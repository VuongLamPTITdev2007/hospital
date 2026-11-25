const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');

dotenv.config();

const seedPharmacyData = async () => {
  try {
    await connectDB();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    const demoUsers = [
      {
        fullName: 'Quản trị viên MedCare',
        email: 'admin@medcare.vn',
        phone: '0901000001',
        role: 'admin'
      },
      {
        fullName: 'BS. Nguyễn Văn An',
        email: 'doctor.an@medcare.vn',
        phone: '0901000002',
        role: 'doctor'
      },
      {
        fullName: 'DS. Vũ Ngọc Mai',
        email: 'duocsi.mai@medcare.vn',
        phone: '0901000003',
        role: 'pharmacist'
      },
      {
        fullName: 'Lê Thị Thu',
        email: 'benhnhan@gmail.com',
        phone: '0901000004',
        role: 'patient'
      }
    ];

    const createdUsers = {};
    for (const item of demoUsers) {
      let user = await User.findOne({ email: item.email });
      if (!user) {
        user = await User.create({ ...item, password: hashedPassword });
      }
      createdUsers[item.role] = user;
    }

    const sampleMedicines = [
      {
        name: 'Panadol Extra 500mg',
        activeIngredient: 'Paracetamol 500mg, Caffeine 65mg',
        unit: 'Vỉ',
        price: 18000,
        stockQuantity: 150,
        minStockAlert: 30,
        usageInstructions: 'Uống 1-2 viên mỗi 4-6 giờ khi đau hoặc sốt'
      },
      {
        name: 'Amlodipine 5mg',
        activeIngredient: 'Amlodipine besylate 5mg',
        unit: 'Hộp',
        price: 95000,
        stockQuantity: 45,
        minStockAlert: 15,
        usageInstructions: 'Uống 1 viên/ngày vào buổi sáng sau ăn'
      },
      {
        name: 'Atorvastatin 20mg',
        activeIngredient: 'Atorvastatin calcium 20mg',
        unit: 'Hộp',
        price: 140000,
        stockQuantity: 12,
        minStockAlert: 20,
        usageInstructions: 'Uống 1 viên/ngày vào buổi tối trước khi ngủ'
      },
      {
        name: 'Berberin 50mg',
        activeIngredient: 'Berberin chloride 50mg',
        unit: 'Chai',
        price: 25000,
        stockQuantity: 180,
        minStockAlert: 25,
        usageInstructions: 'Uống 2-4 viên/lần, ngày 2 lần sau ăn'
      },
      {
        name: 'Amoxicillin 500mg',
        activeIngredient: 'Amoxicillin trihydrate 500mg',
        unit: 'Vỉ',
        price: 22000,
        stockQuantity: 14,
        minStockAlert: 20,
        usageInstructions: 'Uống 1 viên mỗi 8 giờ, dùng đủ liệu trình'
      },
      {
        name: 'Omeprazol 20mg',
        activeIngredient: 'Omeprazole 20mg',
        unit: 'Hộp',
        price: 68000,
        stockQuantity: 60,
        minStockAlert: 15,
        usageInstructions: 'Uống 1 viên trước bữa ăn sáng 30 phút'
      },
      {
        name: 'Oresol 245',
        activeIngredient: 'Natri clorid, Kali clorid, Glucose',
        unit: 'Gói',
        price: 5000,
        stockQuantity: 220,
        minStockAlert: 40,
        usageInstructions: 'Pha 1 gói với 200ml nước đun sôi để nguội'
      },
      {
        name: 'Vitamin C 500mg',
        activeIngredient: 'Acid ascorbic 500mg',
        unit: 'Viên',
        price: 3000,
        stockQuantity: 9,
        minStockAlert: 30,
        usageInstructions: 'Uống 1 viên/ngày sau bữa ăn sáng'
      }
    ];

    const medicines = [];
    for (const item of sampleMedicines) {
      let med = await Medicine.findOne({ name: item.name });
      if (!med) {
        med = await Medicine.create(item);
      }
      medicines.push(med);
    }

    const totalPrescriptions = await Prescription.countDocuments();
    if (totalPrescriptions === 0 && medicines.length >= 3) {
      const m1 = medicines[1];
      const m2 = medicines[2];
      const m3 = medicines[0];

      await Prescription.create([
        {
          patientId: createdUsers.patient._id,
          doctorId: createdUsers.doctor._id,
          items: [
            {
              medicineId: m1._id,
              medicineName: m1.name,
              quantity: 2,
              unit: m1.unit,
              dosage: 'Sáng 1 viên sau ăn',
              unitPrice: m1.price,
              subTotal: m1.price * 2
            },
            {
              medicineId: m2._id,
              medicineName: m2.name,
              quantity: 1,
              unit: m2.unit,
              dosage: 'Tối 1 viên trước khi ngủ',
              unitPrice: m2.price,
              subTotal: m2.price
            }
          ],
          totalAmount: m1.price * 2 + m2.price,
          doctorNotes: 'Theo dõi huyết áp mỗi sáng, tái khám sau 30 ngày.',
          isDispensed: false
        },
        {
          patientId: createdUsers.patient._id,
          doctorId: createdUsers.doctor._id,
          items: [
            {
              medicineId: m3._id,
              medicineName: m3.name,
              quantity: 3,
              unit: m3.unit,
              dosage: 'Uống 1 viên khi sốt trên 38.5°C',
              unitPrice: m3.price,
              subTotal: m3.price * 3
            }
          ],
          totalAmount: m3.price * 3,
          doctorNotes: 'Uống nhiều nước ấm và nghỉ ngơi.',
          isDispensed: true,
          dispensedAt: new Date()
        }
      ]);
    }

    console.log('Seed dữ liệu Kho thuốc & Đơn thuốc thành công!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi seed dữ liệu:', error.message);
    process.exit(1);
  }
};

seedPharmacyData();
