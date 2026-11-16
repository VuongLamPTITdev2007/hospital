const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  medicineName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    required: true
  },
  dosage: {
    type: String, // Ví dụ: "Sáng 1 viên, tối 1 viên"
    required: true
  },
  unitPrice: {
    type: Number,
    required: true
  },
  subTotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
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
  items: [prescriptionItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  doctorNotes: {
    type: String,
    default: 'Uống thuốc đúng liều lượng, tái khám khi có dấu hiệu bất thường.'
  },
  isDispensed: {
    type: Boolean,
    default: false // Dược sĩ bấm xác nhận xuất thuốc -> true
  },
  dispensedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
