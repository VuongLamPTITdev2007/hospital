const booking = require('../controllers/appointmentController');
const { validDate, validSlot, normalizeSlot } = require('./slotPolicy');

const schemas = [{ type: 'function', function: {
  name: 'find_available_doctors',
  description: 'Tra lịch trống thực tế của tất cả bác sĩ hoặc theo tên, chuyên khoa; phải có ngày khám. Gọi khi người dùng hỏi lịch.',
  parameters: { type: 'object', properties: {
    date: { type: 'string', description: 'Ngày khám YYYY-MM-DD theo giờ Việt Nam' },
    query: { type: 'string', description: 'Tên bác sĩ hoặc chuyên khoa, để trống nếu muốn tất cả' },
    startTime: { type: 'string', description: 'Giờ bắt đầu HH:mm dạng 24 giờ, để trống nếu hỏi mọi giờ' }
  }, required: ['date'] }
} }, { type: 'function', function: { name: 'search_doctors', description: 'Tìm bác sĩ và chuyên khoa; dùng khi chưa hỏi giờ khám.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Tên bác sĩ hoặc chuyên khoa, rỗng nếu muốn tất cả' } } } } }];

                                                                                                  
const callBooking = async (handler, query) => {
  let status = 200; let body;
  await handler({ query }, { status(code) { status = code; return this; }, json(value) { body = value; return this; } }, (error) => { throw error; });
  if (status >= 400 || !body?.success) throw new Error('Không thể lấy lịch khám.');
  return body.data;
};
const fold = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();

const getConfiguredSlots = (workingHours, dayOfWeek) => {
  if (!Array.isArray(workingHours)) return new Set();
  const schedule = workingHours.find((day) => day?.dayOfWeek === dayOfWeek);
  if (!Array.isArray(schedule?.slots)) return new Set();
  return new Set(schedule.slots.map(normalizeSlot).filter(validSlot));
};

const execute = async (name, args) => {
  if (name === 'search_doctors') {
    const query = args?.query || '';
    if (typeof query !== 'string' || query.length > 80) return { error: 'Tên hoặc chuyên khoa không hợp lệ.' };
    const doctors = await callBooking(booking.getDoctorsForBooking, {});
    return { doctors: doctors.filter((d) => !query || fold(`${d.name} ${d.specialty}`).includes(fold(query.trim()))).slice(0, 20).map((d) => ({ doctorId: String(d.doctorId), name: d.name, specialty: d.specialty, fee: d.fee })) };
  }
  if (name !== 'find_available_doctors') return { error: 'Công cụ không được hỗ trợ.' };
  const { date, query = '', startTime = '' } = args || {};
  if (!validDate(date) || typeof query !== 'string' || query.length > 80 || typeof startTime !== 'string' || (startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))) return { error: 'Ngày, tên hoặc giờ không hợp lệ.' };
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  if (date < today) return { error: 'Ngày khám đã qua.' };
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
  const doctors = await callBooking(booking.getDoctorsForBooking, {});
  const normalizedQuery = fold(query.trim());
  const candidates = doctors
    .filter((doctor) => !normalizedQuery || fold(`${doctor.name} ${doctor.specialty}`).includes(normalizedQuery))
    .map((doctor) => ({ doctor, configuredSlots: getConfiguredSlots(doctor.workingHours, dayOfWeek) }))
    .filter(({ configuredSlots }) => configuredSlots.size > 0)
    .slice(0, 50);

  const entries = await Promise.all(candidates.map(async ({ doctor, configuredSlots }) => {
    const result = await callBooking(booking.getAvailableSlots, { doctorId: String(doctor.doctorId), date });
    return result.slots
      .map((slot) => ({ ...slot, timeSlot: normalizeSlot(slot.time) }))
      .filter(({ timeSlot, isBooked, isPast }) => configuredSlots.has(timeSlot) && !isBooked && !isPast && (!startTime || timeSlot.startsWith(`${startTime}-`)))
      .map(({ timeSlot }) => ({ doctorId: String(doctor.doctorId), doctorName: doctor.name, specialty: doctor.specialty, fee: doctor.fee, date, timeSlot }));
  }));
  const all = entries.flat();
  return { date, options: all.slice(0, 20), truncated: all.length > 20 };
};
module.exports = { schemas, execute };
