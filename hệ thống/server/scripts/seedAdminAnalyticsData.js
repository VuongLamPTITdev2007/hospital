const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Medicine = require('../models/Medicine');
const Specialty = require('../models/Specialty');
const User = require('../models/User');

const today = new Date().toISOString().slice(0, 10);

const ensureUser = async ({ fullName, email, phone, role }) => {
  const existingUser = await User.findOne({ email }).select('+password');
  if (existingUser) {
    existingUser.fullName = fullName;
    existingUser.phone = phone;
    existingUser.role = role;
    await existingUser.save();
    return existingUser;
  }

  return User.create({
    fullName,
    email,
    phone,
    role,
    password: await bcrypt.hash('Admin123456', 10)
  });
};

const ensureAppointment = async ({ patient, doctor, doctorProfile, date, timeSlot, fee, paymentStatus }) => Appointment.findOneAndUpdate(
  { doctorId: doctor._id, date, timeSlot },
  {
    patientId: patient._id,
    doctorId: doctor._id,
    doctorProfileId: doctorProfile._id,
    date,
    timeSlot,
    status: 'completed',
    patientName: patient.fullName,
    patientPhone: patient.phone,
    symptomsNote: 'Dữ liệu kiểm thử dashboard Admin',
    fee,
    depositAmount: 50000,
    paymentStatus
  },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const seed = async () => {
  await connectDB();

  const [cardiology, pediatrics] = await Promise.all([
    Specialty.findOneAndUpdate(
      { name: 'Tim mạch' },
      { name: 'Tim mạch', description: 'Dữ liệu kiểm thử cho báo cáo Admin' },
      { new: true, upsert: true, runValidators: true }
    ),
    Specialty.findOneAndUpdate(
      { name: 'Nhi khoa' },
      { name: 'Nhi khoa', description: 'Dữ liệu kiểm thử cho báo cáo Admin' },
      { new: true, upsert: true, runValidators: true }
    )
  ]);

  // Ưu tiên dùng lại bác sĩ đầu ngành Hà Nội đã seed để không sinh thêm bản ghi thiếu degree/hospital trên trang Bác sĩ
  let [doctorCardiology, doctorPediatrics] = await Promise.all([
    User.findOne({ email: 'lanhieu.nguyen@medcare.vn' }),
    User.findOne({ email: 'tiendung.nguyen@medcare.vn' })
  ]);

  if (!doctorCardiology) {
    doctorCardiology = await ensureUser({ fullName: 'PGS.TS.BS. Nguyễn Lân Hiếu', email: 'lanhieu.nguyen@medcare.vn', phone: '0912111001', role: 'doctor' });
  }
  if (!doctorPediatrics) {
    doctorPediatrics = await ensureUser({ fullName: 'PGS.TS.BS. Nguyễn Tiến Dũng', email: 'tiendung.nguyen@medcare.vn', phone: '0912111002', role: 'doctor' });
  }

  const [admin, patient, pharmacist] = await Promise.all([
    ensureUser({ fullName: 'Admin Kiểm Thử', email: 'admin.minh@medcare.local', phone: '0900000001', role: 'admin' }),
    ensureUser({ fullName: 'Bệnh nhân Kiểm Thử', email: 'patient.minh@medcare.local', phone: '0900000002', role: 'patient' }),
    ensureUser({ fullName: 'Dược sĩ Kiểm Thử', email: 'pharmacist.minh@medcare.local', phone: '0900000005', role: 'pharmacist' })
  ]);

  let [cardiologyProfile, pediatricsProfile] = await Promise.all([
    DoctorProfile.findOne({ userId: doctorCardiology._id }),
    DoctorProfile.findOne({ userId: doctorPediatrics._id })
  ]);

  if (!cardiologyProfile) {
    cardiologyProfile = await DoctorProfile.create({
      userId: doctorCardiology._id,
      specialtyId: cardiology._id,
      degree: 'Phó Giáo sư, Tiến sĩ, Bác sĩ Cao cấp',
      hospital: 'Bệnh viện Đại học Y Hà Nội',
      consultationFee: 450000,
      experienceYears: 25
    });
  }
  if (!pediatricsProfile) {
    pediatricsProfile = await DoctorProfile.create({
      userId: doctorPediatrics._id,
      specialtyId: pediatrics._id,
      degree: 'Phó Giáo sư, Tiến sĩ Bác sĩ Nhi',
      hospital: 'Bệnh viện Bạch Mai Hà Nội',
      consultationFee: 350000,
      experienceYears: 32
    });
  }

  await Promise.all([
    ensureAppointment({ patient, doctor: doctorCardiology, doctorProfile: cardiologyProfile, date: today, timeSlot: '08:00-08:30', fee: 350000, paymentStatus: 'paid' }),
    ensureAppointment({ patient, doctor: doctorPediatrics, doctorProfile: pediatricsProfile, date: today, timeSlot: '09:00-09:30', fee: 250000, paymentStatus: 'paid' }),
    ensureAppointment({ patient, doctor: doctorCardiology, doctorProfile: cardiologyProfile, date: today, timeSlot: '10:00-10:30', fee: 400000, paymentStatus: 'pending' })
  ]);

  await Promise.all([
    { name: 'Panadol Extra 500mg', activeIngredient: 'Paracetamol', unit: 'Vỉ', price: 18000, stockQuantity: 150, minStockAlert: 20, usageInstructions: 'Uống sau bữa ăn' },
    { name: 'Amlodipine 5mg', activeIngredient: 'Amlodipine', unit: 'Hộp', price: 95000, stockQuantity: 45, minStockAlert: 20, usageInstructions: 'Uống buổi sáng' },
    { name: 'Atorvastatin 20mg', activeIngredient: 'Atorvastatin', unit: 'Hộp', price: 140000, stockQuantity: 12, minStockAlert: 20, usageInstructions: 'Uống buổi tối' },
    { name: 'Berberin 50mg', activeIngredient: 'Berberine', unit: 'Chai', price: 15000, stockQuantity: 200, minStockAlert: 20, usageInstructions: 'Uống theo chỉ định' }
  ].map((medicine) => Medicine.findOneAndUpdate({ name: medicine.name }, medicine, { new: true, upsert: true, runValidators: true })));

  console.log(`Đã tạo dữ liệu kiểm thử cho ngày ${today}.`);
  console.log(`Đăng nhập test: ${admin.email} / Admin123456`);
  console.log(`Dược sĩ test: ${pharmacist.email} / Admin123456`);
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Không thể tạo dữ liệu kiểm thử:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
