const mongoose = require('mongoose');
const { indexOptions } = require('../services/slotPolicy');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorProfile'
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Vui lòng chọn ngày khám']
  },
  timeSlot: {
    type: String, // '08:00-08:30'
    required: [true, 'Vui lòng chọn khung giờ khám']
  },
  status: {
    type: String,
    enum: ['holding', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled'],
    default: 'holding'
  },
  holdingExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 phút đếm ngược
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  symptomsNote: {
    type: String,
    default: ''
  },
  fee: {
    type: Number,
    required: true
  },
  depositAmount: {
    type: Number,
    default: 50000 // Tiền cọc giữ chỗ 50.000 VNĐ
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true,
  autoIndex: false
});

// Đảm bảo không trùng lịch: 1 bác sĩ không thể có 2 ca trùng ngày & timeSlot (ngoại trừ ca đã cancelled)
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  indexOptions
);

module.exports = mongoose.model('Appointment', appointmentSchema);
