const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const mongoose = require('mongoose');

const canReadRecord = (user, record) => user.role === 'admin' || (user.role === 'patient' && String(record.patientId?._id || record.patientId) === user.id) || (user.role === 'doctor' && String(record.doctorId?._id || record.doctorId) === user.id);

                                                    
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

    let doctorId = req.user?.id || bodyDoctorId;

    if (!appointmentId || !patientId || !symptoms || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ mã lịch hẹn, mã bệnh nhân, triệu chứng và chẩn đoán!'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    if (req.user.role !== 'admin' && String(appointment.doctorId) !== req.user.id) return res.status(403).json({ success: false, message: 'Bạn không phải bác sĩ phụ trách lịch hẹn này.' });
    if (String(appointment.patientId) !== patientId) return res.status(400).json({ success: false, message: 'Bệnh nhân không khớp với lịch hẹn.' });
    if (appointment.status !== 'in_progress') return res.status(409).json({ success: false, message: 'Chỉ có thể tạo bệnh án khi ca đang khám.' });
    doctorId = appointment.doctorId;

                                                 
    const existingRecord = await MedicalRecord.findOne({ appointmentId });
    if (existingRecord) {
      return res.status(409).json({
        success: false,
        message: 'Lịch hẹn này đã có hồ sơ bệnh án. Vui lòng cập nhật thay vì tạo mới!',
        recordId: existingRecord._id
      });
    }

    const session = await mongoose.startSession();
    let newRecord;
    try {
      await session.withTransaction(async () => {
        const updated = await Appointment.findOneAndUpdate(
          { _id: appointmentId, patientId, doctorId, status: 'in_progress' },
          { $set: { status: 'completed' } },
          { new: true, session }
        );
        if (!updated) {
          const error = new Error('Lịch hẹn đã thay đổi, vui lòng tải lại.');
          error.statusCode = 409;
          throw error;
        }
        [newRecord] = await MedicalRecord.create([{
          appointmentId, patientId, doctorId, symptoms, diagnosis,
          medicalHistory: medicalHistory || 'Không có tiền sử dị ứng hoặc bệnh nền đặc biệt',
          clinicalNotes: clinicalNotes || '',
          attachedImages: Array.isArray(attachedImages) ? attachedImages : [],
          prescriptionId: prescriptionId || null
        }], { session });
      });
    } finally {
      await session.endSession();
    }

    res.status(201).json({
      success: true,
      message: 'Đã lưu hồ sơ bệnh án điện tử thành công!',
      data: newRecord
    });
  } catch (error) {
    next(error);
  }
};

                                                                              
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

                                                                 
                                                        
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['waiting', 'in_progress'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái ca khám không hợp lệ (chỉ nhận: waiting, in_progress)!'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch hẹn cần chuyển trạng thái!'
      });
    }

                                                                         
    if (
      req.user?.role === 'doctor' &&
      appointment.doctorId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không phải bác sĩ phụ trách ca khám này!'
      });
    }

    const previousStatuses = status === 'waiting' ? ['confirmed'] : ['confirmed', 'waiting'];
    const updated = await Appointment.findOneAndUpdate({ _id: appointmentId, status: { $in: previousStatuses } }, { $set: { status } }, { new: true });
    if (!updated) return res.status(409).json({ success: false, message: 'Không thể chuyển trạng thái từ ca khám hiện tại.' });

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái ca khám thành công!',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

                                                                                 
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

    if (!canReadRecord(req.user, record)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem bệnh án này.' });

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

                                                                            
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'patient' && req.user.id !== patientId) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem lịch sử bệnh án này.' });
    if (!['patient', 'doctor', 'admin'].includes(req.user.role)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem lịch sử bệnh án.' });

    const history = await MedicalRecord.find({ patientId, ...(req.user.role === 'doctor' ? { doctorId: req.user.id } : {}) })
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

    if (!canReadRecord(req.user, record)) return res.status(403).json({ success: false, message: 'Bạn không có quyền xem bệnh án này.' });

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

                                                                                              
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
