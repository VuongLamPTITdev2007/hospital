const booking = require('../controllers/appointmentController');
const { getAvailabilityFilters, findAvailableSlots, fold } = require('./availabilityService');
const { validDate, validSlot } = require('./slotPolicy');

const PAGE_SIZE = 20;
const partsOfDay = ['morning', 'afternoon', 'evening'];

const readSelectionIntent = (args) => {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return null;
  const { slotNumber, doctorNumber, doctorName, sameDoctor, date, dayOfMonth, month, startTime, partOfDay, followUp, previousSearch } = args;
  const isOrdinal = (value) => value === undefined || (Number.isSafeInteger(value) && value > 0);
  if (!isOrdinal(slotNumber) || !isOrdinal(doctorNumber) || !isOrdinal(dayOfMonth) || dayOfMonth > 31 || !isOrdinal(month) || month > 12 ||
      (doctorName !== undefined && (typeof doctorName !== 'string' || !doctorName.trim() || doctorName.length > 80)) ||
      (date !== undefined && !validDate(date)) ||
      (startTime !== undefined && (typeof startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))) ||
      (partOfDay !== undefined && !partsOfDay.includes(partOfDay)) ||
      [sameDoctor, followUp, previousSearch].some((value) => value !== undefined && typeof value !== 'boolean')) return null;

  return Object.fromEntries(Object.entries({ slotNumber, doctorNumber, doctorName, sameDoctor, date, dayOfMonth, month, startTime, partOfDay, followUp, previousSearch }).filter(([, value]) => value !== undefined));
};

const schemas = [
  {
    type: 'function',
    function: {
      name: 'find_available_doctors',
      description: 'Tra lịch trống theo ngày hoặc khoảng ngày, tên bác sĩ, chuyên khoa, giờ bắt đầu và phí khám.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Một ngày khám YYYY-MM-DD theo giờ Việt Nam' },
          dateFrom: { type: 'string', description: 'Ngày đầu của khoảng tìm kiếm, YYYY-MM-DD, bao gồm ngày này' },
          dateTo: { type: 'string', description: 'Ngày cuối của khoảng tìm kiếm, YYYY-MM-DD, bao gồm ngày này' },
          period: { type: 'string', enum: ['today', 'tomorrow', 'this_week', 'next_week'], description: 'Hôm nay, ngày mai, tuần này hoặc tuần sau. Dùng riêng, không kết hợp date/dateFrom/dateTo.' },
          query: { type: 'string', description: 'Tên bác sĩ hoặc chuyên khoa. Bỏ qua khi tìm mọi bác sĩ.' },
          doctorId: { type: 'string', description: 'Mã bác sĩ lấy từ kết quả công cụ trước đó, nếu đã xác định.' },
          startTime: { type: 'string', description: 'Giờ bắt đầu chính xác, HH:mm theo dạng 24 giờ' },
          timeFrom: { type: 'string', description: 'Giờ bắt đầu sớm nhất, bao gồm giờ này, HH:mm' },
          timeTo: { type: 'string', description: 'Chỉ lấy ca bắt đầu trước giờ này, HH:mm. Dùng 24:00 cho hết ngày.' },
          minFee: { type: 'integer', minimum: 0, description: 'Phí khám tối thiểu, bao gồm mức này, đơn vị đồng' },
          maxFeeExclusive: { type: 'integer', minimum: 1, description: 'Chỉ lấy phí khám thấp hơn số này, đơn vị đồng' },
          earliest: { type: 'boolean', description: 'Chỉ lấy lịch sớm nhất. Nếu không có ngày hoặc khoảng ngày, tìm trong 30 ngày từ hôm nay.' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_doctors',
      description: 'Tìm bác sĩ và chuyên khoa khi chưa hỏi lịch trống.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Tên bác sĩ hoặc chuyên khoa, rỗng nếu muốn tất cả' } }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'select_displayed_slot',
      description: 'Diễn giải yêu cầu chọn một ca trong kết quả đã hiển thị, hoặc câu trả lời làm rõ lựa chọn. Chỉ trích tiêu chí người dùng nêu.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          slotNumber: { type: 'integer', minimum: 1, description: 'Số hiển thị cạnh ca (#), hoặc thứ tự ca. Chọn lịch đầu tiên là 1.' },
          doctorNumber: { type: 'integer', minimum: 1, description: 'Thứ tự bác sĩ khác nhau trong danh sách. Bác sĩ đầu tiên là 1, khác với ca đầu tiên.' },
          doctorName: { type: 'string', description: 'Tên hoặc phần tên bác sĩ do người dùng nêu.' },
          sameDoctor: { type: 'boolean', description: 'Người dùng nói bác sĩ này, bác sĩ đó hoặc bác sĩ vừa chọn mà không nêu tên hay số thứ tự.' },
          date: { type: 'string', description: 'Ngày cụ thể YYYY-MM-DD hoặc đã suy ra chắc chắn từ hôm nay/ngày mai.' },
          dayOfMonth: { type: 'integer', minimum: 1, maximum: 31, description: 'Chỉ số ngày khi người dùng chỉ nói ngày trong tháng, ví dụ ngày 28.' },
          month: { type: 'integer', minimum: 1, maximum: 12, description: 'Tháng khi người dùng nêu tháng nhưng chưa nêu năm.' },
          startTime: { type: 'string', description: 'Giờ bắt đầu chính xác HH:mm, dạng 24 giờ.' },
          partOfDay: { type: 'string', enum: partsOfDay, description: 'Buổi sáng, chiều hoặc tối.' },
          followUp: { type: 'boolean', description: 'Chỉ bật khi người dùng trả lời câu hỏi làm rõ ngay trước đó, chẳng hạn chỉ trả lời 14 giờ.' },
          previousSearch: { type: 'boolean', description: 'Chỉ bật khi người dùng nói rõ muốn dùng một danh sách cũ, không phải lượt tra gần nhất.' }
        }
      }
    }
  }
];

const callBooking = async (handler, query) => {
  let status = 200; let body;
  await handler({ query }, { status(code) { status = code; return this; }, json(value) { body = value; return this; } }, (error) => { throw error; });
  if (status >= 400 || !body?.success) throw new Error('Không thể lấy lịch khám.');
  return body.data;
};

const getAvailabilityPage = async (args, after) => {
  const filters = getAvailabilityFilters(args);
  if (filters.error) return filters;
  if (after !== undefined && (!after || !validDate(after.date) ||
      typeof after.timeSlot !== 'string' || !validSlot(after.timeSlot) ||
      typeof after.doctorId !== 'string' || !/^[a-f0-9]{24}$/.test(after.doctorId) ||
      typeof after.doctorName !== 'string' || !after.doctorName.trim())) {
    return { error: 'Vị trí tải thêm lịch không hợp lệ.' };
  }

  const doctors = await callBooking(booking.getDoctorsForBooking, {});
  const available = await findAvailableSlots(doctors, filters, after);
  const { dateFrom, dateTo, earliest, query, doctorId, startTime, timeFrom, timeTo, minFee, maxFeeExclusive } = filters;
  const searchFilters = { dateFrom, dateTo, query, doctorId, startTime, timeFrom, timeTo, minFee, maxFeeExclusive, earliest };
  const options = available.slice(0, earliest ? 1 : PAGE_SIZE);
  const truncated = !earliest && available.length > PAGE_SIZE;
  let nextPage = null;
  if (truncated) {
    const last = options.at(-1);
    nextPage = {
      filters: searchFilters,
      after: { date: last.date, timeSlot: last.timeSlot, doctorId: last.doctorId, doctorName: last.doctorName }
    };
  }

  return { ...(dateFrom === dateTo ? { date: dateFrom } : {}), dateFrom, dateTo, searchFilters, options, truncated, nextPage };
};

const execute = async (name, args) => {
  if (name === 'search_doctors') {
    const query = args?.query || '';
    if (typeof query !== 'string' || query.length > 80) return { error: 'Tên hoặc chuyên khoa không hợp lệ.' };
    const doctors = await callBooking(booking.getDoctorsForBooking, {});
    const normalizedQuery = fold(query);
    return {
      doctors: doctors
        .filter((doctor) => !normalizedQuery || fold(`${doctor.name} ${doctor.specialty}`).includes(normalizedQuery))
        .slice(0, 20)
        .map(({ doctorId, name, specialty, fee }) => ({ doctorId: String(doctorId), name, specialty, fee }))
    };
  }
  if (name !== 'find_available_doctors') return { error: 'Công cụ không được hỗ trợ.' };
  return getAvailabilityPage(args);
};

module.exports = { schemas, execute, getAvailabilityPage, readSelectionIntent };
