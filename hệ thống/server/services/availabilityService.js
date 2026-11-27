const Appointment = require('../models/Appointment');
const { ACTIVE_STATUSES, normalizeSlot, validDate, validSlot } = require('./slotPolicy');

const TIME_ZONE = 'Asia/Ho_Chi_Minh';
const MAX_SEARCH_DAYS = 31;
const EARLIEST_SEARCH_DAYS = 30;
const MILLISECONDS_PER_DAY = 86_400_000;
const CLOCK_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PERIODS = ['today', 'tomorrow', 'this_week', 'next_week'];

const calendarDate = (date) => new Date(`${date}T00:00:00Z`);
const addDays = (date, count) => new Date(calendarDate(date).getTime() + count * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
const weekday = (date) => calendarDate(date).getUTCDay() || 7;
const vietnamDate = (now) => now.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
const fold = (value) => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
const isFee = (value) => value === undefined || (Number.isSafeInteger(value) && value >= 0);

const getAvailabilityFilters = (args = {}, now = new Date()) => {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return { error: 'Điều kiện tra lịch không hợp lệ.' };
  const {
    date, period, doctorId, query = '', startTime = '', timeFrom = '', timeTo = '',
    minFee, maxFeeExclusive, earliest = false
  } = args;
  let { dateFrom, dateTo } = args;
  const today = vietnamDate(now);

  if ((period !== undefined && !PERIODS.includes(period)) ||
      (date !== undefined && !validDate(date)) ||
      (dateFrom !== undefined && !validDate(dateFrom)) ||
      (dateTo !== undefined && !validDate(dateTo))) {
    return { error: 'Ngày khám không hợp lệ. Hãy chọn ngày theo định dạng YYYY-MM-DD.' };
  }
  if ((date !== undefined && (dateFrom !== undefined || dateTo !== undefined || period !== undefined)) ||
      (period !== undefined && (dateFrom !== undefined || dateTo !== undefined))) {
    return { error: 'Hãy chọn một ngày, một khoảng ngày hoặc một tuần để tra lịch.' };
  }
  if (typeof earliest !== 'boolean' || typeof query !== 'string' || query.length > 80 ||
      (doctorId !== undefined && (typeof doctorId !== 'string' || !/^[a-f0-9]{24}$/i.test(doctorId)))) {
    return { error: 'Tên, chuyên khoa hoặc mã bác sĩ không hợp lệ.' };
  }
  if ([startTime, timeFrom].some((time) => typeof time !== 'string' || (time && !CLOCK_PATTERN.test(time))) ||
      typeof timeTo !== 'string' || (timeTo && timeTo !== '24:00' && !CLOCK_PATTERN.test(timeTo)) ||
      (timeFrom && timeTo && timeFrom >= timeTo) ||
      (startTime && ((timeFrom && startTime < timeFrom) || (timeTo && startTime >= timeTo)))) {
    return { error: 'Khung giờ tìm kiếm không hợp lệ. Hãy nhập giờ theo định dạng HH:mm.' };
  }
  if (!isFee(minFee) || !isFee(maxFeeExclusive) ||
      (maxFeeExclusive !== undefined && (minFee ?? 0) >= maxFeeExclusive)) {
    return { error: 'Khoảng phí khám không hợp lệ. Hãy nhập số tiền theo đơn vị đồng.' };
  }

  if (date) [dateFrom, dateTo] = [date, date];
  if (period === 'today') [dateFrom, dateTo] = [today, today];
  if (period === 'tomorrow') dateFrom = dateTo = addDays(today, 1);
  if (period === 'this_week') [dateFrom, dateTo] = [today, addDays(today, 7 - weekday(today))];
  if (period === 'next_week') {
    dateFrom = addDays(today, 8 - weekday(today));
    dateTo = addDays(dateFrom, 6);
  }
  if (earliest && !dateFrom && !dateTo) [dateFrom, dateTo] = [today, addDays(today, EARLIEST_SEARCH_DAYS - 1)];
  if (!dateFrom || !dateTo) return { error: 'Hãy cho biết ngày khám hoặc đủ ngày bắt đầu và kết thúc.' };
  if (dateTo < dateFrom) return { error: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.' };
  if (dateTo < today) return { error: 'Ngày khám đã qua.' };
  if ((calendarDate(dateTo) - calendarDate(dateFrom)) / MILLISECONDS_PER_DAY >= MAX_SEARCH_DAYS) {
    return { error: `Mỗi lần chỉ tra tối đa ${MAX_SEARCH_DAYS} ngày. Hãy chọn khoảng ngắn hơn.` };
  }
  if (dateFrom < today) dateFrom = today;
  const dayCount = (calendarDate(dateTo) - calendarDate(dateFrom)) / MILLISECONDS_PER_DAY + 1;

  const currentTime = now.toLocaleTimeString('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false });
  return { dateFrom, dateTo, dayCount, today, currentTime, now, query: fold(query), doctorId: doctorId?.toLowerCase(), startTime, timeFrom, timeTo, minFee, maxFeeExclusive, earliest };
};

const getConfiguredSlots = (workingHours, dayOfWeek) => {
  if (!Array.isArray(workingHours)) return [];
  const hours = workingHours.find((day) => day?.dayOfWeek === dayOfWeek);
  if (!Array.isArray(hours?.slots)) return [];
  return [...new Set(hours.slots.map(normalizeSlot).filter(validSlot))];
};

const compareSlots = (a, b) =>
  a.date.localeCompare(b.date) || a.timeSlot.slice(0, 5).localeCompare(b.timeSlot.slice(0, 5)) ||
  a.doctorName.localeCompare(b.doctorName, 'vi') || a.doctorId.localeCompare(b.doctorId) || a.timeSlot.localeCompare(b.timeSlot);

const findAvailableSlots = async (doctors, filters, after) => {
  const { dateFrom, dateTo, dayCount, today, currentTime, now, query, doctorId, startTime, timeFrom, timeTo, minFee, maxFeeExclusive } = filters;
  const candidates = doctors.filter((doctor) =>
    (!doctorId || String(doctor.doctorId) === doctorId) &&
    (!query || fold(`${doctor.name} ${doctor.specialty}`).includes(query)) &&
    (minFee === undefined || doctor.fee >= minFee) &&
    (maxFeeExclusive === undefined || doctor.fee < maxFeeExclusive)
  );
  if (!candidates.length) return [];

  const appointments = await Appointment.find({
    doctorId: { $in: candidates.map((doctor) => doctor.doctorId) },
    date: { $gte: dateFrom, $lte: dateTo },
    status: { $in: ACTIVE_STATUSES }
  }).select('doctorId date timeSlot status holdingExpiresAt').lean();
  const occupied = new Set();
  const slotKey = (id, date, timeSlot) => `${id}|${date}|${timeSlot}`;
  for (const appointment of appointments) {
    if (appointment.status === 'holding' && new Date(appointment.holdingExpiresAt) <= now) continue;
    occupied.add(slotKey(appointment.doctorId, appointment.date, normalizeSlot(appointment.timeSlot)));
  }

  const options = [];
  for (let offset = 0; offset < dayCount; offset += 1) {
    const date = addDays(dateFrom, offset);
    const dayOfWeek = weekday(date);
    for (const doctor of candidates) {
      const id = String(doctor.doctorId);
      for (const timeSlot of getConfiguredSlots(doctor.workingHours, dayOfWeek)) {
        const start = timeSlot.slice(0, 5);
        if ((date === today && start <= currentTime) || (startTime && start !== startTime) ||
            (timeFrom && start < timeFrom) || (timeTo && start >= timeTo) || occupied.has(slotKey(id, date, timeSlot))) continue;

        const option = { doctorId: id, doctorName: doctor.name, specialty: doctor.specialty, fee: doctor.fee, date, timeSlot };
        if (!after || compareSlots(option, after) > 0) options.push(option);
      }
    }
  }
  return options.sort(compareSlots);
};

module.exports = { getAvailabilityFilters, findAvailableSlots, vietnamDate, addDays, fold };
