const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true,
    unique: true
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
  symptoms: {
    type: String,
    required: [true, 'Vui lòng ghi nhận triệu chứng']
  },
  diagnosis: {
    type: String,
    required: [true, 'Vui lòng nhập kết luận chẩn đoán']
  },
  medicalHistory: {
    type: String,
    default: 'Không có tiền sử dị ứng hoặc bệnh nền đặc biệt'
  },
  clinicalNotes: {
    type: String,
    default: ''
  },
  attachedImages: [{
    type: String                                        
  }],
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
