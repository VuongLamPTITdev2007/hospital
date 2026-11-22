const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
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

    for (const item of items) {
      if (!item.medicineId || !item.quantity || Number(item.quantity) < 1 || !item.dosage || !item.dosage.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Mỗi thuốc trong đơn phải có mã thuốc, số lượng (>= 1) và liều dùng hợp lệ!'
        });
      }
    }

    const medicineIds = [...new Set(items.map((item) => item.medicineId.toString()))];
    const medicines = await Medicine.find({ _id: { $in: medicineIds } });
    const medicineMap = new Map(medicines.map((med) => [med._id.toString(), med]));

    const requestedQtyMap = new Map();
    for (const item of items) {
      const id = item.medicineId.toString();
      if (!medicineMap.has(id)) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy thuốc với mã ${id} trong kho!`
        });
      }
      requestedQtyMap.set(id, (requestedQtyMap.get(id) || 0) + Number(item.quantity));
    }

    for (const [id, totalQty] of requestedQtyMap.entries()) {
      const med = medicineMap.get(id);
      if (med.stockQuantity < totalQty) {
        return res.status(409).json({
          success: false,
          message: `Thuốc "${med.name}" chỉ còn ${med.stockQuantity} ${med.unit} trong kho, không đủ cho số lượng kê (${totalQty})!`
        });
      }
    }

    let totalAmount = 0;
    const prescriptionItems = items.map((item) => {
      const med = medicineMap.get(item.medicineId.toString());
      const quantity = Number(item.quantity);
      const unitPrice = med.price;
      const subTotal = unitPrice * quantity;
      totalAmount += subTotal;

      return {
        medicineId: med._id,
        medicineName: med.name,
        quantity,
        unit: med.unit,
        dosage: item.dosage.trim(),
        unitPrice,
        subTotal
      };
    });

    const prescriptionData = {
      patientId,
      doctorId: req.user.id,
      items: prescriptionItems,
      totalAmount
    };

    if (recordId) {
      prescriptionData.recordId = recordId;
    }

    if (doctorNotes && doctorNotes.trim()) {
      prescriptionData.doctorNotes = doctorNotes.trim();
    }

    const created = await Prescription.create(prescriptionData);
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
