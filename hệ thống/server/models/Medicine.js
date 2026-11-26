const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên thuốc'],
    unique: true,
    trim: true
  },
  activeIngredient: {
    type: String,                   
    default: ''
  },
  unit: {
    type: String,
    enum: ['Viên', 'Vỉ', 'Hộp', 'Chai', 'Gói', 'Ống'],
    default: 'Viên'
  },
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập đơn giá'],
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng tồn kho'],
    min: [0, 'Tồn kho không được âm'],
    default: 100
  },
  minStockAlert: {
    type: Number,
    default: 20                                
  },
  usageInstructions: {
    type: String,
    default: 'Uống sau bữa ăn'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medicine', medicineSchema);
