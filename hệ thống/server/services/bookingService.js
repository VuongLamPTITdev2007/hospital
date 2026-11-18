const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const localDate = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const localTime = () => new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false });

const slotsFor = (profile, date) => {
  const dayOfWeek = new Date(`${date}T00:00:00`).getDay() || 7;
  const workingDay = profile.workingHours.find((item) => item.dayOfWeek === dayOfWeek);
  return workingDay?.slots?.length ? workingDay.slots : ['08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00', '10:00-10:30', '14:00-14:30', '14:30-15:00', '15:00-15:30'];
};

const expireHolds = () => Appointment.updateMany({ status: 'holding', holdingExpiresAt: { $lt: new Date() } }, { $set: { status: 'cancelled' } });

const availableSlots = async (doctorId, date) => {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile) return null;
  await expireHolds();
  const booked = await Appointment.find({ doctorId, date, status: { $ne: 'cancelled' } }).select('timeSlot');
  const occupied = new Set(booked.map((item) => item.timeSlot));
  return slotsFor(profile, date).map((timeSlot) => ({ timeSlot, isBooked: occupied.has(timeSlot), isPast: date < localDate() || (date === localDate() && timeSlot.slice(0, 5) <= localTime()) }));
};

const createHold = async ({ patientId, doctorId, date, timeSlot, patientName, patientPhone, symptomsNote = '' }) => {
  const profile = await DoctorProfile.findOne({ userId: doctorId });
  if (!profile) return { status: 404, message: 'Không tìm thấy hồ sơ bác sĩ.' };
  const slots = await availableSlots(doctorId, date);
  if (!slots.some((slot) => slot.timeSlot === timeSlot)) return { status: 400, message: 'Khung giờ này không thuộc lịch khám của bác sĩ.' };
  if (slots.some((slot) => slot.timeSlot === timeSlot && slot.isPast)) return { status: 400, message: 'Khung giờ này đã qua.' };
  if (slots.some((slot) => slot.timeSlot === timeSlot && slot.isBooked)) return { status: 409, message: 'Khung giờ này đã được giữ hoặc đặt.' };
  try {
    const appointment = await Appointment.create({ patientId, doctorId, doctorProfileId: profile._id, date, timeSlot, patientName: patientName.trim(), patientPhone: patientPhone.trim(), symptomsNote: symptomsNote.trim(), fee: profile.consultationFee, holdingExpiresAt: new Date(Date.now() + 300000) });
    return { status: 201, appointment };
  } catch (error) {
    if (error.code === 11000) return { status: 409, message: 'Khung giờ vừa được người khác đặt.' };
    throw error;
  }
};

module.exports = { availableSlots, createHold };
