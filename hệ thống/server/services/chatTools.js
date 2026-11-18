const DoctorProfile = require('../models/DoctorProfile');
const Specialty = require('../models/Specialty');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { availableSlots, createHold } = require('./bookingService');

const schemas = [
  { name: 'search_doctors', description: 'Tìm bác sĩ theo chuyên khoa hoặc tên.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
  { name: 'get_available_slots', description: 'Xem giờ còn trống của bác sĩ trong ngày YYYY-MM-DD.', parameters: { type: 'object', properties: { doctorId: { type: 'string' }, date: { type: 'string' } }, required: ['doctorId', 'date'] } },
  { name: 'get_my_appointments', description: 'Xem lịch hẹn của bệnh nhân đang đăng nhập.', parameters: { type: 'object', properties: {} } },
  { name: 'create_appointment_hold', description: 'Giữ slot 5 phút khi bệnh nhân đã chọn rõ bác sĩ, ngày và giờ. Chưa xác nhận thanh toán.', parameters: { type: 'object', properties: { doctorId: { type: 'string' }, date: { type: 'string' }, timeSlot: { type: 'string' }, symptomsNote: { type: 'string' } }, required: ['doctorId', 'date', 'timeSlot'] } }
].map((definition) => ({ type: 'function', function: definition }));

const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validId = (value) => /^[0-9a-f]{24}$/i.test(value || '');
const problem = (message) => ({ error: message });

const execute = async (name, args, user, latestMessage) => {
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
    const timeSlot = typeof args.timeSlot === 'string' ? args.timeSlot.replace(/\s+/g, '') : '';
    if (!validId(args.doctorId) || !validDate(args.date) || !/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(timeSlot)) return problem('Thông tin lịch khám không hợp lệ.');
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
