require('dotenv').config();
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { execute } = require('../services/chatTools');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const patient = await User.findOne({ email: 'patient.minh@medcare.local' });
  assert(patient, 'Hãy chạy seed trước khi test chatbot.');
  const user = { id: String(patient._id), role: 'patient' };
  const found = await execute('search_doctors', { query: 'Tim mạch' }, user, 'Khám tim');
  assert(found.doctors.length > 0);
  const doctorId = found.doctors[0].doctorId;
  const date = '2026-12-02';
  const free = await execute('get_available_slots', { doctorId, date }, user, 'Khám tim');
  assert(free.available.length > 0);
  const timeSlot = free.available[0];
  const hold = await execute('create_appointment_hold', { doctorId, date, timeSlot: timeSlot.replace('-', ' - ') }, user, `Tôi chọn đặt lịch ${date} ${timeSlot}`);
  assert(hold.booking?.appointmentId, JSON.stringify(hold));
  assert.equal(hold.booking.timeSlot, timeSlot, 'Giờ do LLM thêm khoảng trắng phải được chuẩn hóa.');
  const appointmentId = hold.booking.appointmentId;
  try {
    const duplicate = await execute('create_appointment_hold', { doctorId, date, timeSlot }, user, `Tôi chọn đặt lịch ${date} ${timeSlot}`);
    assert(duplicate.error, 'Slot trùng phải bị chặn.');
    const booked = await execute('get_available_slots', { doctorId, date }, user, 'Khám tim');
    assert(!booked.available.includes(timeSlot), 'Slot đang giữ không được hiển thị là trống.');
    const unchanged = await Appointment.findById(appointmentId);
    assert.equal(unchanged.status, 'holding');
    console.log(`CHAT_FLOW_PASS doctorCount=${found.doctors.length} available=${free.available.length} duplicateBlocked=true`);
  } finally {
    await Appointment.updateOne({ _id: appointmentId, status: 'holding' }, { $set: { status: 'cancelled' } });
    await mongoose.disconnect();
  }
};
run().catch(async (error) => { console.error(`CHAT_FLOW_FAIL ${error.message}`); await mongoose.disconnect(); process.exitCode = 1; });
