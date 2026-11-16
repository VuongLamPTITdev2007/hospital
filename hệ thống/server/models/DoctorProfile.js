const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: [true, 'Bác sĩ phải thuộc một chuyên khoa']
  },
  degree: {
    type: String, // BS, ThS, TS, BSCKI, BSCKII
    default: 'Bác sĩ Chuyên khoa'
  },
  consultationFee: {
    type: Number,
    required: [true, 'Vui lòng nhập giá khám'],
    min: [0, 'Giá khám không được âm']
  },
  experienceYears: {
    type: Number,
    default: 5
  },
  hospital: {
    type: String,
    default: 'Phòng khám Đa khoa MedCare'
  },
  bio: {
    type: String,
    default: ''
  },
  workingHours: [{
    dayOfWeek: {
      type: Number, // 1: Thứ 2, ..., 7: Chủ nhật
      required: true
    },
    slots: [{
      type: String // '08:00-08:30', '08:30-09:00', ...
    }]
  }],
  averageRating: {
    type: Number,
    default: 5.0,
    min: 1,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
