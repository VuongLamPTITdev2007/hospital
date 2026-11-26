const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const { ACTIVE_STATUSES, INDEX_NAME, normalizeSlot, validSlot, validDate } = require('../services/slotPolicy');

// Kiểm tra unique index chống trùng lịch đã tồn tại đúng chuẩn trên collection appointments chưa
const isSafeIndex = (index) =>
  index.name === INDEX_NAME &&
  index.unique === true &&
  JSON.stringify(index.key) === JSON.stringify({ doctorId: 1, date: 1, timeSlot: 1 }) &&
  JSON.stringify(index.partialFilterExpression?.status?.$in) === JSON.stringify(ACTIVE_STATUSES);

/**
 * @desc Lấy danh sách bác sĩ phục vụ chọn bác sĩ trong quy trình đặt lịch
 * @route GET /api/appointments/doctors
 * @access Public
 */
exports.getDoctorsForBooking = async (req, res, next) => {
  try {
    const doctorProfiles = await DoctorProfile.find()
      .populate('userId', 'fullName email phone avatar role')
      .populate('specialtyId', 'name icon description')
      .lean();

    const doctors = doctorProfiles
      .filter((dp) => dp.userId && dp.userId.role === 'doctor')
      .map((dp) => ({
        id: dp.userId._id,
        doctorId: dp.userId._id,
        doctorProfileId: dp._id,
        name: dp.userId.fullName,
        email: dp.userId.email,
        phone: dp.userId.phone,
        avatar: dp.userId.avatar,
        specialty: dp.specialtyId ? dp.specialtyId.name : 'Đa khoa',
        specialtyId: dp.specialtyId ? dp.specialtyId._id : null,
        degree: dp.degree || 'Bác sĩ Chuyên khoa',
        hospital: dp.hospital || 'Phòng khám Đa khoa MedCare',
        fee: dp.consultationFee || 350000,
        experienceYears: dp.experienceYears || 5,
        rating: dp.averageRating || 5.0,
        reviewCount: dp.reviewCount || 0,
        workingHours: dp.workingHours || []
      }));

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Lấy danh sách khung giờ khả dụng theo bác sĩ và ngày
 * @route GET /api/appointments/slots
 * @access Public / Optional Auth
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !validDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã bác sĩ (doctorId) và ngày khám hợp lệ (YYYY-MM-DD)!'
      });
    }

    // Tìm profile của bác sĩ
    const doctorProfile = await DoctorProfile.findOne({
      $or: [{ userId: doctorId }, { _id: doctorId }]
    })
      .populate('userId', 'fullName avatar')
      .populate('specialtyId', 'name');

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ yêu cầu!'
      });
    }

    const targetDoctorId = doctorProfile.userId ? doctorProfile.userId._id : doctorId;

    // Xác định thứ trong tuần theo chuẩn ISO Việt Nam (Thứ 2 = 1 ... Chủ nhật = 7)
    const dateObj = new Date(date + 'T00:00:00');
    const jsDay = dateObj.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;

    // Tìm khung giờ cấu hình trong workingHours của bác sĩ cho ngày này
    const schedule = doctorProfile.workingHours?.find((w) => w.dayOfWeek === dayOfWeek);

    const defaultSlots = [
      '08:00 - 08:30',
      '08:30 - 09:00',
      '09:00 - 09:30',
      '09:30 - 10:00',
      '10:00 - 10:30',
      '10:30 - 11:00',
      '14:00 - 14:30',
      '14:30 - 15:00',
      '15:00 - 15:30',
      '15:30 - 16:00'
    ];

    const configuredSlots = schedule && schedule.slots?.length > 0 ? schedule.slots : defaultSlots;

    // Tự động giải phóng (cancel) các lịch giữ chỗ đã quá 5 phút
    const now = new Date();
    const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const currentTime = now.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    await Appointment.updateMany(
      {
        doctorId: targetDoctorId,
        date,
        status: 'holding',
        holdingExpiresAt: { $lt: now }
      },
      { status: 'cancelled' }
    );

    // Lấy các lịch hẹn còn hiệu lực (holding còn hạn, confirmed, waiting, in_progress, completed)
    const activeAppointments = await Appointment.find({
      doctorId: targetDoctorId,
      date,
      status: { $in: ['holding', 'confirmed', 'waiting', 'in_progress', 'completed'] }
    }).lean();

    // Map các slot và gắn cờ trạng thái
    const mappedSlots = configuredSlots.map((slotText) => {
      const standardSlot = normalizeSlot(slotText);
      const isPast = date < today || (date === today && standardSlot.slice(0, 5) <= currentTime);
      const matchedAppt = activeAppointments.find(
        (a) => normalizeSlot(a.timeSlot) === standardSlot
      );

      if (!matchedAppt) {
        return {
          time: slotText,
          status: 'available',
          isBooked: false,
          isPast,
          appointmentId: null
        };
      }

      const isHolding = matchedAppt.status === 'holding';
      const isExpired = isHolding && new Date(matchedAppt.holdingExpiresAt) <= now;

      if (isExpired) {
        return {
          time: slotText,
          status: 'available',
          isBooked: false,
          isPast,
          appointmentId: null
        };
      }

      return {
        time: slotText,
        status: matchedAppt.status, // 'holding' | 'confirmed' | ...
        isBooked: true,
        isPast
      };
    });

    res.status(200).json({
      success: true,
      data: {
        doctorId: targetDoctorId,
        doctorName: doctorProfile.userId?.fullName || 'Bác sĩ MedCare',
        specialty: doctorProfile.specialtyId?.name || 'Đa khoa',
        fee: doctorProfile.consultationFee,
        depositAmount: 50000,
        date,
        dayOfWeek,
        slots: mappedSlots
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Giữ chỗ 5 phút có đếm ngược (Hold Slot - Concurrency & Race Condition Handled)
 * @route POST /api/appointments/hold
 * @access Private (Bệnh nhân)
 */
exports.holdSlot = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, patientName, patientPhone, symptomsNote } = req.body;
    const patientId = req.user.id;

    if (!doctorId || !date || !timeSlot || !patientName || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ: Bác sĩ, Ngày khám, Khung giờ, Họ tên và Số điện thoại bệnh nhân!'
      });
    }

    const standardSlot = normalizeSlot(timeSlot);

    if (!validDate(date) || !validSlot(standardSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Ngày khám hoặc khung giờ không hợp lệ.'
      });
    }

    // Bảo đảm unique index chống trùng lịch đang tồn tại trên MongoDB
    const indexes = await Appointment.collection.indexes();
    if (!indexes.some(isSafeIndex)) {
      return res.status(503).json({
        success: false,
        message: 'Chức năng đặt lịch đang bảo trì để bảo đảm không trùng ca. Vui lòng thử lại sau.'
      });
    }

    // Kiểm tra thông tin bác sĩ
    const doctorProfile = await DoctorProfile.findOne({
      $or: [{ userId: doctorId }, { _id: doctorId }]
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ được chỉ định!'
      });
    }

    const actualDoctorUserId = doctorProfile.userId || doctorId;

    // Chặn đặt lịch trong quá khứ và kiểm tra khung giờ có thuộc lịch bác sĩ không
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const currentTime = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    if (date < today || (date === today && standardSlot.slice(0, 5) <= currentTime)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể đặt lịch trong quá khứ.'
      });
    }

    const day = new Date(`${date}T00:00:00Z`).getUTCDay() || 7;
    const schedule = doctorProfile.workingHours?.find((item) => item.dayOfWeek === day);
    const defaults = [
      '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00',
      '10:00-10:30', '10:30-11:00', '14:00-14:30', '14:30-15:00',
      '15:00-15:30', '15:30-16:00'
    ];
    const allowedSlots = schedule?.slots?.length ? schedule.slots.map(normalizeSlot) : defaults;
    if (!allowedSlots.includes(standardSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Khung giờ không thuộc lịch làm việc của bác sĩ.'
      });
    }

    // 1. Dọn dẹp các ca holding cũ đã quá hạn cho khung giờ này
    const now = new Date();
    await Appointment.updateMany(
      {
        doctorId: actualDoctorUserId,
        date,
        timeSlot: standardSlot,
        status: 'holding',
        holdingExpiresAt: { $lt: now }
      },
      { status: 'cancelled' }
    );

    // 2. Kiểm tra xem slot đã có ai giữ hoặc đặt chưa
    const existingActive = await Appointment.findOne({
      doctorId: actualDoctorUserId,
      date,
      timeSlot: standardSlot,
      status: { $in: ['holding', 'confirmed', 'waiting', 'in_progress', 'completed'] }
    });

    if (existingActive) {
      // Nếu chính bệnh nhân này đang giữ chỗ và còn hạn -> trả về luôn để tiếp tục thanh toán
      if (
        existingActive.status === 'holding' &&
        String(existingActive.patientId) === String(patientId) &&
        new Date(existingActive.holdingExpiresAt) > now
      ) {
        const secondsRemaining = Math.max(
          1,
          Math.floor((new Date(existingActive.holdingExpiresAt).getTime() - now.getTime()) / 1000)
        );

        const vietQrUrl = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=50000&addInfo=MEDCARE%20${existingActive._id.toString().slice(-6).toUpperCase()}&accountName=MEDCARE%20CLINIC`;

        return res.status(200).json({
          success: true,
          message: 'Bạn hiện đang giữ chỗ khung giờ này. Vui lòng thanh toán cọc trong thời gian còn lại!',
          data: {
            appointmentId: existingActive._id,
            holdingExpiresAt: existingActive.holdingExpiresAt,
            secondsRemaining,
            depositAmount: existingActive.depositAmount,
            vietQrUrl,
            appointment: existingActive
          }
        });
      }

      // Khung giờ đã bị người khác đặt hoặc đang giữ
      return res.status(409).json({
        success: false,
        message: 'Khung giờ này vừa có người đặt hoặc đang giữ chỗ. Vui lòng chọn khung giờ khác!'
      });
    }

    // 3. Khởi tạo phiên giữ chỗ 5 phút (300 giây)
    const holdingDurationMs = 5 * 60 * 1000;
    const holdingExpiresAt = new Date(Date.now() + holdingDurationMs);

    const newAppointment = new Appointment({
      patientId,
      doctorId: actualDoctorUserId,
      doctorProfileId: doctorProfile._id,
      date,
      timeSlot: standardSlot,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      symptomsNote: symptomsNote ? symptomsNote.trim() : '',
      fee: doctorProfile.consultationFee || 350000,
      depositAmount: 50000,
      status: 'holding',
      holdingExpiresAt,
      paymentStatus: 'pending'
    });

    // 4. Lưu vào CSDL - bắt lỗi race condition trùng lặp từ MongoDB Unique Index
    try {
      await newAppointment.save();
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: 'Xung đột lịch khám: Khung giờ vừa có người khác giữ chỗ nhanh hơn. Vui lòng chọn khung giờ khác!'
        });
      }
      throw saveError;
    }

    // 5. Sinh link ảnh thanh toán VietQR chuẩn
    const bookingCode = newAppointment._id.toString().slice(-6).toUpperCase();
    const vietQrUrl = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=50000&addInfo=MEDCARE%20${bookingCode}&accountName=MEDCARE%20CLINIC`;

    res.status(201).json({
      success: true,
      message: 'Giữ chỗ thành công! Bạn có 5 phút để hoàn tất chuyển khoản cọc 50.000 VNĐ.',
      data: {
        appointmentId: newAppointment._id,
        bookingCode,
        holdingExpiresAt,
        secondsRemaining: 300,
        depositAmount: 50000,
        vietQrUrl,
        appointment: newAppointment
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Xác nhận thanh toán cọc thành công -> chuyển appointment sang confirmed
 * @route POST /api/appointments/:id/confirm
 * @access Private (Bệnh nhân)
 */
exports.confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionCode, paymentMethod } = req.body;
    const patientId = req.user.id;

    const appointment = await Appointment.findById(id)
      .populate('doctorId', 'fullName phone avatar')
      .populate('doctorProfileId');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin ca hẹn khám!'
      });
    }

    // Kiểm tra quyền sở hữu ca hẹn
    if (String(appointment.patientId) !== String(patientId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xác nhận ca khám này!'
      });
    }

    // Nếu đã confirmed trước đó
    if (appointment.status === 'confirmed' && appointment.paymentStatus === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Lịch khám này đã được xác nhận thanh toán trước đó!',
        data: appointment
      });
    }

    // Kiểm tra xem đã hết thời gian 5 phút giữ chỗ chưa
    const now = new Date();
    if (appointment.status === 'holding' && new Date(appointment.holdingExpiresAt) < now) {
      await Appointment.updateOne(
        { _id: id, status: 'holding', holdingExpiresAt: { $lte: now } },
        { $set: { status: 'cancelled' } }
      );
      return res.status(400).json({
        success: false,
        message: 'Đã hết thời gian 5 phút giữ chỗ! Khung giờ đã được giải phóng, vui lòng thực hiện lại.'
      });
    }

    // Chỉ xác nhận phiên giữ chỗ còn hạn bằng một thao tác nguyên tử (atomic)
    const updated = await Appointment.findOneAndUpdate(
      { _id: id, patientId: appointment.patientId, status: 'holding', holdingExpiresAt: { $gt: now } },
      { $set: { status: 'confirmed', paymentStatus: 'paid' } },
      { new: true }
    )
      .populate('doctorId', 'fullName phone avatar')
      .populate('doctorProfileId');

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'Lịch đã hết hạn hoặc không còn ở trạng thái giữ chỗ.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xác nhận đặt lịch và cọc thành công! Vui lòng đến trước giờ khám 15 phút.',
      data: {
        appointment: updated,
        bookingCode: updated._id.toString().slice(-6).toUpperCase(),
        transactionCode: transactionCode || `TXN-${Date.now()}`,
        paymentMethod: paymentMethod || 'VietQR'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Hủy giữ chỗ hoặc hủy lịch hẹn khám
 * @route POST /api/appointments/:id/cancel
 * @access Private
 */
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca hẹn khám!'
      });
    }

    if (String(appointment.patientId) !== String(patientId) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy ca hẹn này!'
      });
    }

    if (!['holding', 'confirmed'].includes(appointment.status)) {
      return res.status(409).json({
        success: false,
        message: 'Không thể hủy lịch ở trạng thái này.'
      });
    }

    const cancelled = await Appointment.findOneAndUpdate(
      { _id: id, status: { $in: ['holding', 'confirmed'] } },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!cancelled) {
      return res.status(409).json({
        success: false,
        message: 'Trạng thái lịch đã thay đổi, vui lòng tải lại.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã hủy giữ chỗ thành công. Khung giờ đã được giải phóng cho bệnh nhân khác!'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Lấy danh sách lịch hẹn của bệnh nhân hiện tại
 * @route GET /api/appointments/my-appointments
 * @access Private
 */
exports.getMyAppointments = async (req, res, next) => {
  try {
    const patientId = req.user.id;

    // Tự động hủy các ca holding đã hết hạn
    await Appointment.updateMany(
      {
        patientId,
        status: 'holding',
        holdingExpiresAt: { $lt: new Date() }
      },
      { status: 'cancelled' }
    );

    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'fullName email phone avatar')
      .populate({
        path: 'doctorProfileId',
        populate: { path: 'specialtyId', select: 'name icon' }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Lấy chi tiết một lịch hẹn
 * @route GET /api/appointments/:id
 * @access Private
 */
exports.getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate('doctorId', 'fullName email phone avatar')
      .populate({
        path: 'doctorProfileId',
        populate: { path: 'specialtyId', select: 'name icon' }
      });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin ca hẹn khám!'
      });
    }

    // Kiểm tra quyền xem chi tiết ca hẹn (tránh rò rỉ dữ liệu IDOR)
    if (
      req.user.role !== 'admin' &&
      String(appointment.patientId) !== req.user.id &&
      String(appointment.doctorId?._id || appointment.doctorId) !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem lịch hẹn này.'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

