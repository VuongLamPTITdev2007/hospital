require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const DoctorProfile = require('../models/DoctorProfile');

const doctors = [
  { name: 'BS Nguyễn Minh An', email: 'doctor.noi@medcare.local', specialty: 'Nội tổng quát', fee: 300000 },
  { name: 'BS Trần Ngọc Hà', email: 'doctor.dalieu@medcare.local', specialty: 'Da liễu', fee: 300000 },
  { name: 'BS Lê Hoàng Nam', email: 'doctor.taimuihong@medcare.local', specialty: 'Tai Mũi Họng', fee: 280000 },
  { name: 'BS Phạm Thu Trang', email: 'doctor.mat@medcare.local', specialty: 'Mắt', fee: 250000 },
  { name: 'BS Vũ Đức Long', email: 'doctor.coxuongkhop@medcare.local', specialty: 'Cơ xương khớp', fee: 350000 }
];
const slots = ['08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00', '14:00-14:30', '14:30-15:00', '15:00-15:30'];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const password = await bcrypt.hash('Admin123456', 10);
  for (const [index, doctor] of doctors.entries()) {
    const specialty = await Specialty.findOneAndUpdate({ name: doctor.specialty }, { $setOnInsert: { name: doctor.specialty, isActive: true } }, { upsert: true, new: true, runValidators: true });
    const user = await User.findOneAndUpdate({ email: doctor.email }, { $setOnInsert: { fullName: doctor.name, email: doctor.email, phone: `09000001${String(index + 1).padStart(2, '0')}`, role: 'doctor', password } }, { upsert: true, new: true, runValidators: true });
    if (user.role !== 'doctor') throw new Error(`Tài khoản ${doctor.email} không phải bác sĩ; dừng để tránh ghi đè.`);
    await DoctorProfile.findOneAndUpdate({ userId: user._id }, { $setOnInsert: { userId: user._id, specialtyId: specialty._id, consultationFee: doctor.fee, experienceYears: 7 + index, workingHours: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({ dayOfWeek, slots })) } }, { upsert: true, new: true, runValidators: true });
    console.log(`${doctor.name} | ${doctor.specialty} | ${doctor.email}`);
  }
  await mongoose.disconnect();
};
seed().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exitCode = 1; });
