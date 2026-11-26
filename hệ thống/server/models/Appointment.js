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
    type: String,              
    required: [true, 'Vui lòng chọn ngày khám']
  },
  timeSlot: {
    type: String,                 
    required: [true, 'Vui lòng chọn khung giờ khám']
  },
  status: {
    type: String,
    enum: ['holding', 'confirmed', 'waiting', 'in_progress', 'completed', 'cancelled'],
    default: 'holding'
  },
  holdingExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000)                    
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
    default: 50000                               
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

                                                                                                         
appointmentSchema.index(
  { doctorId: 1, date: 1, timeSlot: 1 },
  indexOptions
);

module.exports = mongoose.model('Appointment', appointmentSchema);
