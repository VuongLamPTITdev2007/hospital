const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

const findAuthorizedAppointment = async (appointmentId, user) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return { error: { status: 404, message: 'Không tìm thấy lịch hẹn.' } };
  const isOwner = appointment.patientId.toString() === user.id;
  const isDoctor = appointment.doctorId.toString() === user.id;
  if (user.role !== 'admin' && !isOwner && !isDoctor) {
    return { error: { status: 403, message: 'Bạn không có quyền xem bệnh án này.' } };
  }
  return { appointment };
};

const getRecordByAppointment = async (req, res, next) => {
  try {
    const result = await findAuthorizedAppointment(req.params.appointmentId, req.user);
    if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
    const record = await MedicalRecord.findOne({ appointmentId: result.appointment._id })
      .populate('patientId', 'fullName email phone avatar')
      .populate('doctorId', 'fullName avatar');
    if (!record) return res.status(404).json({ success: false, message: 'Lịch hẹn này chưa có bệnh án.' });
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

const createRecord = async (req, res, next) => {
  try {
    const { appointmentId, symptoms, diagnosis, medicalHistory = '', clinicalNotes = '', attachedImages = [] } = req.body;
    if (!appointmentId || !symptoms?.trim() || !diagnosis?.trim()) {
      return res.status(400).json({ success: false, message: 'Triệu chứng và chẩn đoán là bắt buộc.' });
    }
    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId: req.user.id });
    if (!appointment) return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn của bác sĩ.' });
    if (appointment.status === 'cancelled') return res.status(409).json({ success: false, message: 'Không thể lập bệnh án cho lịch đã hủy.' });
    if (await MedicalRecord.exists({ appointmentId })) return res.status(409).json({ success: false, message: 'Lịch hẹn này đã có bệnh án.' });

    const record = await MedicalRecord.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: req.user.id,
      symptoms: symptoms.trim(),
      diagnosis: diagnosis.trim(),
      medicalHistory: medicalHistory.trim(),
      clinicalNotes: clinicalNotes.trim(),
      attachedImages: Array.isArray(attachedImages) ? attachedImages.filter(Boolean) : []
    });
    appointment.status = 'completed';
    await appointment.save();
    res.status(201).json({ success: true, message: 'Đã lưu bệnh án điện tử.', data: record });
  } catch (error) {
    next(error);
  }
};

const updateRecord = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!record) return res.status(404).json({ success: false, message: 'Không tìm thấy bệnh án của bác sĩ.' });
    const fields = ['symptoms', 'diagnosis', 'medicalHistory', 'clinicalNotes', 'attachedImages'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) record[field] = req.body[field];
    });
    await record.save();
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecordByAppointment, createRecord, updateRecord };
