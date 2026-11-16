const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true // Mỗi lượt khám chỉ được đánh giá 1 lần
  },
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
  rating: {
    type: Number,
    required: [true, 'Vui lòng chọn số sao đánh giá'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Vui lòng nhập nhận xét'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', reviewSchema);
