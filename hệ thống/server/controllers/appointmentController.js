const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
const isValidSlot = (value) => /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value || '');

const getMyAppointments = async (req, res, next) => {
  try {
    const filter = req.user.role === 'doctor' ? { doctorId: req.user.id } : { patientId: req.user.id };
    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'fullName avatar')
      .populate({ path: 'doctorProfileId', populate: { path: 'specialtyId', select: 'name' } })
      .sort({ date: -1, timeSlot: -1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, patientName, patientPhone, symptomsNote = '' } = req.body;
    if (!doctorId || !isValidDate(date) || !isValidSlot(timeSlot) || !patientName?.trim() || !patientPhone?.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ bác sĩ, ngày, khung giờ và thông tin bệnh nhân.' });
    }

    const profile = await DoctorProfile.findOne({ userId: doctorId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ bác sĩ.' });
    }

    await Appointment.updateMany(
      { doctorId, date, status: 'holding', holdingExpiresAt: { $lt: new Date() } },
      { $set: { status: 'cancelled' } }
    );

    const occupiedAppointment = await Appointment.exists({
      doctorId,
      date,
      timeSlot,
      status: { $ne: 'cancelled' }
    });
    if (occupiedAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Khung giờ này đã được người khác giữ hoặc đặt. Vui lòng chọn khung giờ khác.'
      });
    }

    const appointment = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      doctorProfileId: profile._id,
      date,
      timeSlot,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      symptomsNote: symptomsNote.trim(),
      fee: profile.consultationFee,
      holdingExpiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    res.status(201).json({
      success: true,
      message: 'Đã giữ chỗ trong 5 phút. Vui lòng xác nhận thanh toán cọc.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn.' });
    }

    const { action } = req.body;
    const isPatientOwner = appointment.patientId.toString() === req.user.id;
    if (!isPatientOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật lịch hẹn này.' });
    }

    if (action === 'confirm') {
      if (appointment.status !== 'holding') {
        return res.status(409).json({ success: false, message: 'Lịch hẹn này không còn ở trạng thái giữ chỗ.' });
      }
      if (appointment.holdingExpiresAt < new Date()) {
        appointment.status = 'cancelled';
        await appointment.save();
        return res.status(409).json({ success: false, message: 'Đã hết thời gian giữ chỗ, vui lòng chọn lại lịch.' });
      }
      appointment.status = 'confirmed';
      appointment.paymentStatus = 'paid';
    } else if (action === 'cancel') {
      if (appointment.status === 'completed') {
        return res.status(409).json({ success: false, message: 'Không thể hủy lịch hẹn đã hoàn tất.' });
      }
      appointment.status = 'cancelled';
      appointment.paymentStatus = appointment.paymentStatus === 'paid' ? 'refunded' : appointment.paymentStatus;
    } else {
      return res.status(400).json({ success: false, message: 'Hành động cập nhật lịch hẹn không hợp lệ.' });
    }

    await appointment.save();
    res.status(200).json({ success: true, message: 'Đã cập nhật lịch hẹn.', data: appointment });
  } catch (error) {
    next(error);
  }
};

const getDoctorQueue = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (date && !isValidDate(date)) {
      return res.status(400).json({ success: false, message: 'Ngày khám phải có định dạng YYYY-MM-DD.' });
    }
    const filter = {
      doctorId: req.user.id,
      status: { $in: ['confirmed', 'waiting', 'in_progress', 'completed'] },
      ...(date && { date })
    };
    const appointments = await Appointment.find(filter).sort({ date: 1, timeSlot: 1 });
    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['waiting', 'in_progress'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái khám không hợp lệ.' });
    }
    const appointment = await Appointment.findOne({ _id: req.params.id, doctorId: req.user.id });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch hẹn của bác sĩ.' });
    }
    const expectedCurrentStatus = status === 'waiting' ? 'confirmed' : 'waiting';
    if (appointment.status !== expectedCurrentStatus) {
      return res.status(409).json({ success: false, message: `Không thể chuyển từ trạng thái ${appointment.status} sang ${status}.` });
    }
    appointment.status = status;
    await appointment.save();
    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyAppointments, createAppointment, updateAppointment, getDoctorQueue, updateAppointmentStatus };
