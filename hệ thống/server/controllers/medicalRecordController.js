const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');

// Tạo mới hồ sơ bệnh án điện tử (POST /api/records)
exports.createMedicalRecord = async (req, res, next) => {
  try {
    const {
      appointmentId,
      patientId,
      doctorId: bodyDoctorId,
      symptoms,
      diagnosis,
      medicalHistory,
      clinicalNotes,
      attachedImages,
      prescriptionId
    } = req.body;

    const doctorId = req.user?.id || bodyDoctorId;

    if (!appointmentId || !patientId || !symptoms || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mã lịch hẹn, mã bệnh nhân, triệu chứng và chẩn đoán!'
      });
    }

    // Chặn tạo trùng bệnh án cho cùng 1 lịch hẹn
    const existingRecord = await MedicalRecord.findOne({ appointmentId });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Lịch hẹn này đã có hồ sơ bệnh án. Vui lòng cập nhật thay vì tạo mới!',
        recordId: existingRecord._id
      });
    }

    const newRecord = await MedicalRecord.create({
      appointmentId,
      patientId,
      doctorId,
      symptoms,
      diagnosis,
      medicalHistory: medicalHistory || 'Không có tiền sử dị ứng hoặc bệnh nền đặc biệt',
      clinicalNotes: clinicalNotes || '',
      attachedImages: Array.isArray(attachedImages) ? attachedImages : [],
      prescriptionId: prescriptionId || null
    });

    // Tự động chuyển trạng thái lịch hẹn sang đã khám xong
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });

    res.status(201).json({
      success: true,
      message: 'Đã lưu hồ sơ bệnh án điện tử thành công!',
      data: newRecord
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách hàng đợi khám bệnh của bác sĩ (GET /api/records/doctor-queue)
exports.getDoctorQueue = async (req, res, next) => {
  try {
    const doctorId = req.user?.id;
    const { date } = req.query;

    const query = {
      status: { $in: ['confirmed', 'waiting', 'in_progress', 'completed'] }
    };

    if (doctorId && req.user?.role === 'doctor') {
      query.doctorId = doctorId;
    }
    if (date) {
      query.date = date;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName email phone avatar')
      .populate('doctorId', 'fullName email')
      .sort({ date: 1, timeSlot: 1 });

    // Kiểm tra lịch hẹn nào đã có bệnh án
    const appointmentIds = appointments.map((app) => app._id);
    const existingRecords = await MedicalRecord.find({
      appointmentId: { $in: appointmentIds }
    }).select('appointmentId _id');

    const recordedSet = new Set(existingRecords.map((r) => r.appointmentId.toString()));

    const formattedQueue = appointments.map((app) => ({
      ...app.toObject(),
      hasMedicalRecord: recordedSet.has(app._id.toString())
    }));

    res.status(200).json({
      success: true,
      count: formattedQueue.length,
      data: formattedQueue
    });
  } catch (error) {
    next(error);
  }
};

// Chuyển trạng thái ca khám: waiting -> in_progress -> completed
// PATCH /api/records/appointments/:appointmentId/status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['waiting', 'in_progress', 'completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái ca khám không hợp lệ (chỉ nhận: waiting, in_progress, completed)!'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn cần chuyển trạng thái!'
      });
    }

    // Chỉ bác sĩ phụ trách ca khám hoặc admin mới được chuyển trạng thái
    if (
      req.user?.role === 'doctor' &&
      appointment.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải bác sĩ phụ trách ca khám này!'
      });
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái ca khám thành công!',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// Tra cứu bệnh án theo mã lịch hẹn (GET /api/records/appointment/:appointmentId)
exports.getRecordByAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const record = await MedicalRecord.findOne({ appointmentId })
      .populate('patientId', 'fullName email phone avatar')
      .populate('doctorId', 'fullName email')
      .populate('appointmentId')
      .populate('prescriptionId');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Chưa có hồ sơ bệnh án cho lịch hẹn này!'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// Lấy lịch sử khám bệnh của bệnh nhân (GET /api/records/patient/:patientId)
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const history = await MedicalRecord.find({ patientId })
      .populate('doctorId', 'fullName email')
      .populate('appointmentId', 'date timeSlot')
      .populate('prescriptionId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// Xem chi tiết bệnh án theo ID (GET /api/records/:id)
exports.getRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findById(id)
      .populate('patientId', 'fullName email phone avatar')
      .populate('doctorId', 'fullName email')
      .populate('appointmentId')
      .populate('prescriptionId');

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án!'
      });
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật hồ sơ bệnh án - Chỉ bác sĩ phụ trách ca hoặc admin được sửa (PUT /api/records/:id)
exports.updateMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { diagnosis, symptoms, medicalHistory, clinicalNotes, attachedImages } = req.body;

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án cần cập nhật!'
      });
    }

    // Kiểm tra quyền sở hữu: chỉ bác sĩ phụ trách ca khám hoặc admin mới được sửa
    if (
      req.user?.role !== 'admin' &&
      record.doctorId.toString() !== req.user?.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Chỉ bác sĩ phụ trách ca khám này mới có quyền chỉnh sửa bệnh án!'
      });
    }

    if (diagnosis) record.diagnosis = diagnosis;
    if (symptoms) record.symptoms = symptoms;
    if (medicalHistory) record.medicalHistory = medicalHistory;
    if (clinicalNotes !== undefined) record.clinicalNotes = clinicalNotes;
    if (Array.isArray(attachedImages)) record.attachedImages = attachedImages;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ bệnh án thành công!',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// Xóa hồ sơ bệnh án - Chỉ bác sĩ phụ trách hoặc admin (DELETE /api/records/:id)
exports.deleteMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bệnh án cần xóa!'
      });
    }

    if (
      req.user?.role !== 'admin' &&
      record.doctorId.toString() !== req.user?.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa hồ sơ bệnh án này!'
      });
    }

    await record.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Đã xóa hồ sơ bệnh án thành công!'
    });
  } catch (error) {
    next(error);
  }
};
