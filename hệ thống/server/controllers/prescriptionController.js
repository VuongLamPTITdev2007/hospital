const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

exports.createPrescription = async (req, res, next) => {
  try {
    const { patientId, recordId, items, doctorNotes } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn bệnh nhân cho đơn thuốc!'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn thuốc phải có ít nhất một loại thuốc!'
      });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bệnh nhân!'
      });
    }

    if (new Set(items.map((item) => String(item.medicineId))).size !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Mỗi thuốc chỉ xuất hiện một lần trong đơn!'
      });
    }

    let linkedRecord = null;
    if (recordId) {
      linkedRecord = await MedicalRecord.findById(recordId);
      if (!linkedRecord) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hồ sơ bệnh án liên kết!'
        });
      }
      if (String(linkedRecord.patientId) !== String(patientId)) {
        return res.status(400).json({
          success: false,
          message: 'Bệnh nhân không khớp với hồ sơ bệnh án!'
        });
      }
      if (req.user.role !== 'admin' && String(linkedRecord.doctorId) !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không phải bác sĩ phụ trách bệnh án này!'
        });
      }
      if (linkedRecord.prescriptionId) {
        return res.status(409).json({
          success: false,
          message: 'Bệnh án này đã được kê đơn thuốc trước đó!'
        });
      }
    }

    let totalAmount = 0;
    const prescriptionItems = [];

    for (const item of items) {
      if (
        !item.medicineId ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        typeof item.dosage !== 'string' ||
        !item.dosage.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi thuốc trong đơn phải có mã thuốc, số lượng nguyên (>= 1) và liều dùng hợp lệ!'
        });
      }

      const med = await Medicine.findById(item.medicineId);
      if (!med) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy thuốc với mã ${item.medicineId} trong kho!`
        });
      }

      const quantity = Number(item.quantity);
      if (med.stockQuantity < quantity) {
        return res.status(409).json({
          success: false,
          message: `Thuốc "${med.name}" chỉ còn ${med.stockQuantity} ${med.unit} trong kho, không đủ cho số lượng kê (${quantity})!`
        });
      }

      const subTotal = med.price * quantity;
      totalAmount += subTotal;

      prescriptionItems.push({
        medicineId: med._id,
        medicineName: med.name,
        quantity,
        unit: med.unit,
        dosage: item.dosage.trim(),
        unitPrice: med.price,
        subTotal
      });
    }

    const prescriptionData = {
      patientId,
      doctorId: linkedRecord ? linkedRecord.doctorId : req.user.id,
      items: prescriptionItems,
      totalAmount
    };

    if (recordId) {
      prescriptionData.recordId = recordId;
    }

    if (doctorNotes && doctorNotes.trim()) {
      prescriptionData.doctorNotes = doctorNotes.trim();
    }

    let created;
    if (recordId) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const prescriptionId = new mongoose.Types.ObjectId();
          const updatedRecord = await MedicalRecord.findOneAndUpdate(
            { _id: recordId, patientId, doctorId: prescriptionData.doctorId, prescriptionId: null },
            { $set: { prescriptionId } },
            { new: true, session }
          );
          if (!updatedRecord) {
            const error = new Error('Bệnh án đã có đơn thuốc hoặc đã thay đổi.');
            error.statusCode = 409;
            throw error;
          }
          [created] = await Prescription.create([{ ...prescriptionData, _id: prescriptionId }], { session });
        });
      } finally {
        await session.endSession();
      }
    } else {
      created = await Prescription.create(prescriptionData);
    }
    const populated = await Prescription.findById(created._id)
      .populate('patientId', 'fullName email phone')
      .populate('doctorId', 'fullName email');

    res.status(201).json({
      success: true,
      message: 'Kê đơn thuốc thành công!',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

exports.getPrescriptions = async (req, res, next) => {
  try {
    const { isDispensed, patientId } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patientId = req.user.id;
    } else if (req.user.role === 'doctor') {
      filter.doctorId = req.user.id;
      if (patientId) {
        filter.patientId = patientId;
      }
    } else if (patientId) {
      filter.patientId = patientId;
    }

    if (isDispensed === 'true') {
      filter.isDispensed = true;
    } else if (isDispensed === 'false') {
      filter.isDispensed = false;
    }

    const prescriptions = await Prescription.find(filter)
      .populate('patientId', 'fullName email phone')
      .populate('doctorId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      data: prescriptions
    });
  } catch (error) {
    next(error);
  }
};

exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'fullName email phone')
      .populate('doctorId', 'fullName email')
      .populate('items.medicineId', 'name unit stockQuantity price');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn thuốc!'
      });
    }

    if (
      req.user.role === 'patient' &&
      prescription.patientId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn thuốc của bệnh nhân khác!'
      });
    }

    if (
      req.user.role === 'doctor' &&
      prescription.doctorId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem đơn thuốc của bác sĩ khác!'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    next(error);
  }
};

exports.getPatients = async (req, res, next) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('fullName email phone')
      .sort({ fullName: 1 });

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

exports.dispensePrescription = async (req, res, next) => {
  try {
    // Dùng Transaction để bảo đảm trừ kho nguyên tử: nếu 1 thuốc thiếu tồn kho thì rollback toàn bộ
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const prescription = await Prescription.findById(req.params.id).session(session);

        if (!prescription) {
          const error = new Error('Không tìm thấy đơn thuốc!');
          error.statusCode = 404;
          throw error;
        }

        if (prescription.isDispensed) {
          const error = new Error('Đơn thuốc này đã được xuất kho trước đó!');
          error.statusCode = 409;
          throw error;
        }

        for (const item of prescription.items) {
          const updatedMed = await Medicine.findOneAndUpdate(
            { _id: item.medicineId, stockQuantity: { $gte: item.quantity } },
            { $inc: { stockQuantity: -item.quantity } },
            { new: true, session }
          );
          if (!updatedMed) {
            const error = new Error(`Thuốc "${item.medicineName}" không đủ tồn kho hoặc không tồn tại để xuất!`);
            error.statusCode = 409;
            throw error;
          }
        }

        prescription.isDispensed = true;
        prescription.dispensedAt = new Date();
        await prescription.save({ session });
      });
    } finally {
      await session.endSession();
    }

    const populated = await Prescription.findById(req.params.id)
      .populate('patientId', 'fullName email phone')
      .populate('doctorId', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Duyệt xuất kho và trừ tồn kho thành công!',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};
