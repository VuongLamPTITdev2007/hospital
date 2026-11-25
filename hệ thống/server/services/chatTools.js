const DoctorProfile = require('../models/DoctorProfile');
const Specialty = require('../models/Specialty');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { availableSlots, createHold, normalizeSlot } = require('./bookingService');

const schemas = [
  { name: 'search_doctors', description: 'Tìm bác sĩ theo chuyên khoa hoặc tên.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_available_slots', description: 'Xem giờ còn trống của bác sĩ trong ngày YYYY-MM-DD.', parameters: { type: 'object', properties: { doctorId: { type: 'string' }, date: { type: 'string' } }, required: ['doctorId', 'date'] } },
  { name: 'find_available_doctors', description: 'Tìm tất cả bác sĩ có lịch trống theo ngày, có thể lọc giờ bắt đầu và chuyên khoa. Dùng khi người dùng hỏi nhiều bác sĩ hoặc không nêu bác sĩ cụ thể.', parameters: { type: 'object', properties: { date: { type: 'string', description: 'Ngày khám YYYY-MM-DD theo giờ Việt Nam.' }, startTime: { type: 'string', description: 'Giờ bắt đầu HH:mm theo định dạng 24 giờ, ví dụ 08:00; bỏ trống để xem mọi giờ.' }, specialty: { type: 'string', description: 'Tên chuyên khoa nếu người dùng yêu cầu.' } }, required: ['date'] } },
  { name: 'get_my_appointments', description: 'Xem lịch hẹn của bệnh nhân đang đăng nhập.', parameters: { type: 'object', properties: {} } },
  { name: 'create_appointment_hold', description: 'Giữ slot 5 phút khi bệnh nhân đã chọn rõ bác sĩ, ngày và giờ. Chưa xác nhận thanh toán.', parameters: { type: 'object', properties: { doctorId: { type: 'string' }, date: { type: 'string' }, timeSlot: { type: 'string' }, symptomsNote: { type: 'string' } }, required: ['doctorId', 'date', 'timeSlot'] } }
].map((definition) => ({ type: 'function', function: definition }));

const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validId = (value) => /^[0-9a-f]{24}$/i.test(value || '');
const problem = (message) => ({ error: message });

const execute = async (name, args, user, latestMessage) => {
  if (name === 'find_available_doctors') {
    if (!validDate(args.date)) return problem('Ngày khám phải hợp lệ và có định dạng YYYY-MM-DD.');
    if (args.date < new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })) return problem('Ngày khám đã qua.');
    if (args.startTime !== undefined && (typeof args.startTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(args.startTime))) return problem('Giờ bắt đầu phải theo định dạng HH:mm, ví dụ 08:00.');
    if (args.specialty !== undefined && (typeof args.specialty !== 'string' || args.specialty.length > 80)) return problem('Chuyên khoa không hợp lệ.');
    const specialty = (args.specialty || '').trim().toLocaleLowerCase('vi');
    const profiles = await DoctorProfile.find().populate({ path: 'userId', match: { role: 'doctor' }, select: 'fullName' }).populate({ path: 'specialtyId', match: { isActive: true }, select: 'name' });
    const eligible = profiles.filter((profile) => profile.userId && profile.specialtyId && (!specialty || profile.specialtyId.name.toLocaleLowerCase('vi').includes(specialty)));
    const results = await Promise.all(eligible.map(async (profile) => {
      const slots = await availableSlots(profile.userId._id, args.date);
      const available = (slots || []).filter((slot) => !slot.isBooked && !slot.isPast && (!args.startTime || slot.timeSlot.startsWith(args.startTime))).map((slot) => slot.timeSlot);
      return { doctorId: String(profile.userId._id), doctorName: profile.userId.fullName, specialty: profile.specialtyId.name, available };
    }));
    return { date: args.date, startTime: args.startTime || null, doctors: results.filter((item) => item.available.length) };
  }
  if (name === 'search_doctors') {
    const query = String(args.query || '').trim().toLocaleLowerCase('vi');
    if (!query || query.length > 80) return problem('Cần tên bác sĩ hoặc chuyên khoa hợp lệ.');
    const specialties = await Specialty.find({ isActive: true }).select('name');
    const matching = specialties.filter((item) => item.name.toLocaleLowerCase('vi').includes(query) || query.includes(item.name.toLocaleLowerCase('vi')));
    const profiles = await DoctorProfile.find().populate({ path: 'userId', match: { role: 'doctor' }, select: 'fullName' }).populate('specialtyId', 'name');
    return { doctors: profiles.filter((item) => item.userId && (matching.some((specialty) => String(specialty._id) === String(item.specialtyId?._id)) || item.userId.fullName.toLocaleLowerCase('vi').includes(query) || item.specialtyId?.name.toLocaleLowerCase('vi').includes(query))).slice(0, 10).map((item) => ({ doctorId: String(item.userId._id), name: item.userId.fullName, specialty: item.specialtyId?.name, fee: item.consultationFee })) };
  }
  if (name === 'get_available_slots') {
    if (!validId(args.doctorId) || !validDate(args.date)) return problem('Bác sĩ hoặc ngày không hợp lệ.');
    if (args.date < new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })) return problem('Ngày khám đã qua.');
    const slots = await availableSlots(args.doctorId, args.date);
    return slots ? { doctorId: args.doctorId, date: args.date, available: slots.filter((slot) => !slot.isBooked && !slot.isPast).map((slot) => slot.timeSlot) } : problem('Không tìm thấy bác sĩ.');
  }
  if (name === 'get_my_appointments') {
    const appointments = await Appointment.find({ patientId: user.id }).sort({ date: -1 }).limit(10).select('doctorId date timeSlot status paymentStatus');
    return { appointments };
  }
  if (name === 'create_appointment_hold') {
    if (!/(đặt|giữ|chọn|book|hẹn)/i.test(latestMessage)) return problem('Bệnh nhân cần chủ động chọn lịch trước khi giữ chỗ.');
    const compactSlot = typeof args.timeSlot === 'string' ? args.timeSlot.replace(/\s+/g, '') : '';
    if (!validId(args.doctorId) || !validDate(args.date) || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(compactSlot)) return problem('Thông tin lịch khám không hợp lệ.');
    const timeSlot = normalizeSlot(compactSlot);
    if (args.date < new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })) return problem('Không thể đặt ngày đã qua.');
    const patient = await User.findById(user.id).select('fullName phone');
    if (!patient?.phone) return problem('Vui lòng cập nhật số điện thoại để đặt lịch.');
    const result = await createHold({ patientId: user.id, doctorId: args.doctorId, date: args.date, timeSlot, patientName: patient.fullName, patientPhone: patient.phone, symptomsNote: String(args.symptomsNote || '').slice(0, 500) });
    if (result.message) return problem(result.message);
    const doctor = await User.findById(args.doctorId).select('fullName');
    return { booking: { appointmentId: String(result.appointment._id), doctorId: args.doctorId, doctorName: doctor?.fullName, date: args.date, timeSlot, depositAmount: result.appointment.depositAmount, holdingExpiresAt: result.appointment.holdingExpiresAt } };
  }
  return problem('Tool không được hỗ trợ.');
};

module.exports = { schemas, execute };
