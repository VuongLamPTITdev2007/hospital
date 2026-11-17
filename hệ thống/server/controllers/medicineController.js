const mongoose = require('mongoose');
const MedicalRecord = require('../models/MedicalRecord');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');

const getMedicines = async (req, res, next) => { try { res.status(200).json({ success: true, data: await Medicine.find().sort({ name: 1 }) }); } catch (error) { next(error); } };
const getMyRecords = async (req, res, next) => { try { res.status(200).json({ success: true, data: await MedicalRecord.find({ doctorId: req.user.id }).populate('patientId', 'fullName').sort({ createdAt: -1 }) }); } catch (error) { next(error); } };

const createPrescription = async (req, res, next) => {
  try {
    const { recordId, items, doctorNotes = '' } = req.body;
    if (!recordId || !Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: 'Bệnh án và ít nhất một thuốc là bắt buộc.' });
    const record = await MedicalRecord.findOne({ _id: recordId, doctorId: req.user.id });
    if (!record) return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh án của bác sĩ.' });
    if (record.prescriptionId) return res.status(409).json({ success: false, message: 'Bệnh án này đã có đơn thuốc.' });
    const medicineIds = items.map((item) => item.medicineId);
    if (new Set(medicineIds).size !== medicineIds.length) return res.status(400).json({ success: false, message: 'Mỗi thuốc chỉ được kê một lần trong đơn.' });
    const medicines = await Medicine.find({ _id: { $in: medicineIds } });
    if (medicines.length !== medicineIds.length) return res.status(400).json({ success: false, message: 'Có thuốc không tồn tại trong kho.' });
    const medicineMap = new Map(medicines.map((medicine) => [medicine._id.toString(), medicine]));
    const normalizedItems = items.map((item) => {
      const medicine = medicineMap.get(item.medicineId);
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || !item.dosage?.trim()) throw new Error('Dữ liệu thuốc hoặc liều dùng không hợp lệ.');
      return { medicineId: medicine._id, medicineName: medicine.name, quantity, unit: medicine.unit, dosage: item.dosage.trim(), unitPrice: medicine.price, subTotal: medicine.price * quantity };
    });
    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.subTotal, 0);
    const prescription = await Prescription.create({ recordId, patientId: record.patientId, doctorId: req.user.id, items: normalizedItems, totalAmount, doctorNotes });
    record.prescriptionId = prescription._id; await record.save();
    res.status(201).json({ success: true, data: prescription });
  } catch (error) { next(error); }
};

const getPrescriptions = async (req, res, next) => { try { const filter = req.user.role === 'pharmacist' ? { isDispensed: false } : { doctorId: req.user.id }; res.status(200).json({ success: true, data: await Prescription.find(filter).populate('patientId', 'fullName').sort({ createdAt: -1 }) }); } catch (error) { next(error); } };

const dispensePrescription = async (req, res, next) => {
  try {
    const session = await mongoose.startSession();
    let dispensedPrescription;
    try {
      await session.withTransaction(async () => {
        const prescription = await Prescription.findById(req.params.id).session(session);
        if (!prescription) {
          const error = new Error('Không tìm thấy đơn thuốc.');
          error.statusCode = 404;
          throw error;
        }
        if (prescription.isDispensed) {
          const error = new Error('Đơn thuốc đã được xuất kho.');
          error.statusCode = 409;
          throw error;
        }
        for (const item of prescription.items) {
          const medicine = await Medicine.findOneAndUpdate(
            { _id: item.medicineId, stockQuantity: { $gte: item.quantity } },
            { $inc: { stockQuantity: -item.quantity } },
            { new: true, session }
          );
          if (!medicine) {
            const error = new Error(`Không đủ tồn kho cho thuốc ${item.medicineName}.`);
            error.statusCode = 409;
            throw error;
          }
        }
        prescription.isDispensed = true;
        prescription.dispensedAt = new Date();
        await prescription.save({ session });
        dispensedPrescription = prescription;
      });
    } finally {
      await session.endSession();
    }
    res.status(200).json({ success: true, data: dispensedPrescription });
  } catch (error) { next(error); }
};

module.exports = { getMedicines, getMyRecords, createPrescription, getPrescriptions, dispensePrescription };
