const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Specialty = require('../models/Specialty');
const User = require('../models/User');
const { vietnamDate } = require('../services/availabilityService');
const { ACTIVE_STATUSES, normalizeSlot, validSlot } = require('../services/slotPolicy');

const ROLE_KEYS = ['patient', 'doctor', 'pharmacist', 'admin'];
const STAFF_ROLES = ['doctor', 'pharmacist', 'admin'];
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^(0[35789])\d{8}$/;
const DEFAULT_DOCTOR_SLOTS = [
  '08:00-08:30',
  '08:30-09:00',
  '09:00-09:30',
  '09:30-10:00',
  '14:00-14:30',
  '14:30-15:00',
  '15:00-15:30'
];
const DEFAULT_DOCTOR_WORKING_HOURS = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  slots: DEFAULT_DOCTOR_SLOTS
}));

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const getMonthStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
};

const getToday = () => new Date().toISOString().slice(0, 10);

const buildDateMatch = (from, to) => ({
  date: { $gte: from, $lte: to }
});

const getAnalytics = async (req, res, next) => {
  try {
    const from = req.query.from || getMonthStart();
    const to = req.query.to || getToday();

    if (!isValidDate(from) || !isValidDate(to) || from > to) {
      return res.status(400).json({
        success: false,
        message: 'Khoảng ngày không hợp lệ. Hãy dùng định dạng YYYY-MM-DD và bảo đảm ngày bắt đầu không sau ngày kết thúc.'
      });
    }

    const dateMatch = buildDateMatch(from, to);
    const completedMatch = { ...dateMatch, status: 'completed' };
    const paidCompletedMatch = { ...completedMatch, paymentStatus: 'paid' };

    const [revenueResult, completedAppointments, patientCount, staffCount, roleCounts, revenueBySpecialty] = await Promise.all([
      Appointment.aggregate([
        { $match: paidCompletedMatch },
        { $group: { _id: null, paidRevenue: { $sum: '$fee' } } }
      ]),
      Appointment.countDocuments(completedMatch),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: { $in: ['doctor', 'pharmacist'] } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Appointment.aggregate([
        { $match: paidCompletedMatch },
        { $lookup: { from: 'doctorprofiles', localField: 'doctorProfileId', foreignField: '_id', as: 'doctorProfile' } },
        { $unwind: { path: '$doctorProfile', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'specialties', localField: 'doctorProfile.specialtyId', foreignField: '_id', as: 'specialty' } },
        { $unwind: { path: '$specialty', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: { $ifNull: ['$specialty.name', 'Chưa phân loại'] },
            revenue: { $sum: '$fee' },
            appointments: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1, _id: 1 } },
        { $project: { _id: 0, specialty: '$_id', revenue: 1, appointments: 1 } }
      ])
    ]);

    const paidRevenue = revenueResult[0]?.paidRevenue || 0;
    const usersByRole = ROLE_KEYS.reduce((result, role) => {
      result[role] = roleCounts.find((item) => item._id === role)?.count || 0;
      return result;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        filters: { from, to },
        summary: { paidRevenue, completedAppointments, patientCount, staffCount },
        revenueBySpecialty: revenueBySpecialty.map((item) => ({
          ...item,
          percent: paidRevenue > 0 ? Math.round((item.revenue / paidRevenue) * 100) : 0
        })),
        usersByRole
      }
    });
  } catch (error) {
    next(error);
  }
};

const buildWeeklySchedule = (workingHours = []) => {
  const safeHours = Array.isArray(workingHours) ? workingHours : [];
  return [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
    const rawSlots = safeHours
      .filter((entry) => entry?.dayOfWeek === dayOfWeek && Array.isArray(entry.slots))
      .flatMap((entry) => entry.slots);
    const slots = [...new Set(rawSlots.map(normalizeSlot).filter(validSlot))].sort((a, b) =>
      a.localeCompare(b)
    );
    return {
      dayOfWeek,
      isWorking: slots.length > 0,
      slots
    };
  });
};

const buildScheduleSummary = (user, profile = null) => {
  if (user.role === 'doctor') {
    const weekly = buildWeeklySchedule(profile?.workingHours);
    const workingDays = weekly.filter((day) => day.isWorking).map((day) => day.dayOfWeek);
    const totalWeeklySlots = weekly.reduce((sum, day) => sum + day.slots.length, 0);
    return {
      type: 'doctor',
      workingDays,
      totalWeeklySlots
    };
  }
  if (user.role === 'pharmacist' || user.role === 'admin') {
    return {
      type: 'office',
      workingDays: [1, 2, 3, 4, 5, 6],
      label: 'T2–T7 · Giờ hành chính'
    };
  }
  return null;
};

const serializeUser = (user, profile = null) => ({
  _id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone || '',
  role: user.role,
  avatar: user.avatar,
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  scheduleSummary: buildScheduleSummary(user, profile),
  doctorProfile: profile
    ? {
        _id: profile._id,
        specialtyId: profile.specialtyId?._id || profile.specialtyId,
        specialtyName: profile.specialtyId?.name || '',
        consultationFee: profile.consultationFee,
        degree: profile.degree,
        hospital: profile.hospital
      }
    : null
});

const validateDoctorFields = async ({ specialtyId, consultationFee }) => {
  if (typeof specialtyId !== 'string' || !mongoose.Types.ObjectId.isValid(specialtyId)) {
    return { error: { status: 400, message: 'Vui lòng chọn chuyên khoa hợp lệ cho bác sĩ.' } };
  }

  const specialty = await Specialty.findById(specialtyId).lean();
  if (!specialty) {
    return { error: { status: 404, message: 'Không tìm thấy chuyên khoa đã chọn.' } };
  }

  const hasFeeValue =
    consultationFee !== undefined &&
    consultationFee !== null &&
    String(consultationFee).trim() !== '';
  const parsedFee = hasFeeValue ? Number(consultationFee) : Number.NaN;
  if (!Number.isFinite(parsedFee) || parsedFee < 0) {
    return { error: { status: 400, message: 'Giá khám phải là số không âm hợp lệ.' } };
  }

  return { specialtyId: specialty._id, consultationFee: parsedFee };
};

const upsertDoctorProfile = async (userId, specialtyId, consultationFee) =>
  DoctorProfile.findOneAndUpdate(
    { userId },
    {
      $set: { specialtyId, consultationFee },
      $setOnInsert: {
        userId,
        degree: 'Bác sĩ Chuyên khoa',
        experienceYears: 5,
        hospital: 'Phòng khám Đa khoa MedCare',
        workingHours: DEFAULT_DOCTOR_WORKING_HOURS
      }
    },
    { new: true, upsert: true, runValidators: true }
  )
    .populate('specialtyId', 'name')
    .lean();

const getUsers = async (req, res, next) => {
  try {
    const {
      scope = 'staff',
      role = 'all',
      status = 'all',
      search = '',
      page = '1',
      limit = '8'
    } = req.query;

    if (
      !['staff', 'patient'].includes(scope) ||
      !['all', ...STAFF_ROLES].includes(role) ||
      !['all', 'active', 'locked'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tham số lọc danh sách tài khoản không hợp lệ.'
      });
    }

    const filter = {};
    if (scope === 'patient') {
      filter.role = 'patient';
    } else {
      filter.role = role === 'all' ? { $in: STAFF_ROLES } : role;
    }

    if (status === 'active') {
      filter.isActive = { $ne: false };
    } else if (status === 'locked') {
      filter.isActive = false;
    }

    if (typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    const limitNum = Math.min(50, Math.max(1, Number.isNaN(parsedLimit) ? 8 : parsedLimit));
    const pageNum = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const skip = (pageNum - 1) * limitNum;

    const [total, users, roleStats] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            total: { $sum: 1 },
            locked: {
              $sum: {
                $cond: [{ $eq: ['$isActive', false] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const doctorUserIds = users
      .filter((item) => item.role === 'doctor')
      .map((item) => item._id);
    const profiles = doctorUserIds.length > 0
      ? await DoctorProfile.find({ userId: { $in: doctorUserIds } })
          .populate('specialtyId', 'name')
          .lean()
      : [];
    const profileByUserId = new Map(profiles.map((profile) => [String(profile.userId), profile]));

    const byRole = ROLE_KEYS.reduce((result, roleKey) => {
      const entry = roleStats.find((item) => item._id === roleKey);
      result[roleKey] = entry ? entry.total : 0;
      return result;
    }, {});
    const staffTotal = STAFF_ROLES.reduce((sum, roleKey) => sum + (byRole[roleKey] || 0), 0);
    const patientTotal = byRole.patient || 0;
    const lockedTotal = roleStats.reduce((sum, item) => sum + (item.locked || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        users: users.map((item) => serializeUser(item, profileByUserId.get(String(item._id)) || null)),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil(total / limitNum))
        },
        summary: {
          staffTotal,
          patientTotal,
          lockedTotal,
          byRole
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      phone = '',
      role = 'patient',
      specialtyId,
      consultationFee
    } = req.body || {};

    const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên phải có độ dài từ 2 đến 100 ký tự.'
      });
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng.'
      });
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > 72) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu khởi tạo phải có từ 6 đến 72 ký tự.'
      });
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ.'
      });
    }
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại phải gồm 10 chữ số theo đầu số Việt Nam (03, 05, 07, 08, 09).'
      });
    }

    if (!ROLE_KEYS.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò tài khoản không hợp lệ.'
      });
    }

    let doctorFields = null;
    if (role === 'doctor') {
      const validation = await validateDoctorFields({ specialtyId, consultationFee });
      if (validation.error) {
        return res.status(validation.error.status).json({
          success: false,
          message: validation.error.message
        });
      }
      doctorFields = validation;
    }

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Địa chỉ email này đã tồn tại trong hệ thống.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: normalizedPhone,
      role,
      isActive: true
    });

    let profile = null;
    if (role === 'doctor') {
      try {
        profile = await upsertDoctorProfile(
          user._id,
          doctorFields.specialtyId,
          doctorFields.consultationFee
        );
      } catch (profileError) {
        await User.deleteOne({ _id: user._id });
        throw profileError;
      }
    }

    res.status(201).json({
      success: true,
      message: 'Cấp tài khoản thành công!',
      data: serializeUser(user, profile)
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã tài khoản không hợp lệ.'
      });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản cần cập nhật.'
      });
    }

    const {
      fullName,
      phone = '',
      role,
      specialtyId,
      consultationFee
    } = req.body || {};

    const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Họ và tên phải có độ dài từ 2 đến 100 ký tự.'
      });
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ.'
      });
    }
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';
    if (normalizedPhone && !PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại phải gồm 10 chữ số theo đầu số Việt Nam (03, 05, 07, 08, 09).'
      });
    }

    if (!ROLE_KEYS.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò tài khoản không hợp lệ.'
      });
    }

    if (String(target._id) === String(req.user.id) && role !== target.role) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự thay đổi vai trò của chính mình.'
      });
    }

    if (target.role === 'admin' && role !== 'admin' && target.isActive !== false) {
      const activeAdmins = await User.countDocuments({
        role: 'admin',
        isActive: { $ne: false }
      });
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hạ quyền quản trị viên đang hoạt động cuối cùng của hệ thống.'
        });
      }
    }

    let doctorFields = null;
    if (role === 'doctor') {
      const validation = await validateDoctorFields({ specialtyId, consultationFee });
      if (validation.error) {
        return res.status(validation.error.status).json({
          success: false,
          message: validation.error.message
        });
      }
      doctorFields = validation;
    }

    target.fullName = normalizedName;
    target.phone = normalizedPhone;
    target.role = role;
    await target.save();

    const profile = role === 'doctor'
      ? await upsertDoctorProfile(target._id, doctorFields.specialtyId, doctorFields.consultationFee)
      : null;

    res.status(200).json({
      success: true,
      message: 'Cập nhật tài khoản thành công!',
      data: serializeUser(target, profile)
    });
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã tài khoản không hợp lệ.'
      });
    }

    if (typeof req.body?.isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái kích hoạt phải là kiểu boolean.'
      });
    }

    const target = await User.findById(id);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản yêu cầu.'
      });
    }

    const nextActive = req.body.isActive;
    if (String(target._id) === String(req.user.id) && nextActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự khóa tài khoản của chính mình.'
      });
    }

    if (target.role === 'admin' && nextActive === false && target.isActive !== false) {
      const activeAdmins = await User.countDocuments({
        role: 'admin',
        isActive: { $ne: false }
      });
      if (activeAdmins <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Không thể khóa quản trị viên đang hoạt động cuối cùng của hệ thống.'
        });
      }
    }

    target.isActive = nextActive;
    await target.save();

    const profile = target.role === 'doctor'
      ? await DoctorProfile.findOne({ userId: target._id }).populate('specialtyId', 'name').lean()
      : null;

    res.status(200).json({
      success: true,
      message: nextActive ? 'Mở khóa tài khoản thành công!' : 'Đã khóa tài khoản thành công!',
      data: serializeUser(target, profile)
    });
  } catch (error) {
    next(error);
  }
};

const getUserSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã tài khoản không hợp lệ.'
      });
    }

    const date = req.query.date ? String(req.query.date).trim() : vietnamDate(new Date());
    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: 'Ngày xem lịch không hợp lệ. Hãy dùng định dạng YYYY-MM-DD.'
      });
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản nhân sự yêu cầu.'
      });
    }

    if (user.role === 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản bệnh nhân không có lịch làm việc nhân sự.'
      });
    }

    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay() || 7;

    if (user.role !== 'doctor') {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isActive: user.isActive !== false
          },
          scheduleType: 'office',
          date,
          dayOfWeek,
          officeHours: {
            days: [1, 2, 3, 4, 5, 6],
            shifts: [
              { label: 'Ca sáng', time: '08:00 - 12:00' },
              { label: 'Ca chiều', time: '13:30 - 17:30' }
            ],
            note: 'Lịch trực hành chính mặc định cho khối Dược sĩ & Quản trị (Chủ Nhật nghỉ).'
          },
          weeklySchedule: [1, 2, 3, 4, 5, 6, 7].map((d) => ({
            dayOfWeek: d,
            isWorking: d <= 6,
            slots: d <= 6 ? ['08:00-12:00', '13:30-17:30'] : []
          })),
          daily: null
        }
      });
    }

    const profile = await DoctorProfile.findOne({ userId: user._id })
      .populate('specialtyId', 'name')
      .lean();
    const weeklySchedule = buildWeeklySchedule(profile?.workingHours);

    const now = new Date();
    const appointments = await Appointment.find({
      doctorId: user._id,
      date,
      status: { $in: ACTIVE_STATUSES }
    })
      .select('timeSlot status holdingExpiresAt patientName patientPhone symptomsNote paymentStatus fee')
      .lean();

    const appointmentBySlot = new Map();
    for (const appt of appointments) {
      if (appt.status === 'holding' && new Date(appt.holdingExpiresAt) <= now) {
        continue;
      }
      const normalized = normalizeSlot(appt.timeSlot);
      if (normalized && !appointmentBySlot.has(normalized)) {
        appointmentBySlot.set(normalized, appt);
      }
    }

    const configuredSlots = weeklySchedule.find((day) => day.dayOfWeek === dayOfWeek)?.slots || [];
    const configuredSet = new Set(configuredSlots);
    const mergedSlots = [...new Set([...configuredSlots, ...appointmentBySlot.keys()])].sort((a, b) =>
      a.localeCompare(b)
    );

    const dailySlots = mergedSlots.map((timeSlot) => {
      const appt = appointmentBySlot.get(timeSlot);
      return {
        timeSlot,
        status: appt ? appt.status : 'available',
        isOffSchedule: !configuredSet.has(timeSlot),
        appointment: appt
          ? {
              _id: appt._id,
              patientName: appt.patientName,
              patientPhone: appt.patientPhone,
              symptomsNote: appt.symptomsNote || '',
              paymentStatus: appt.paymentStatus,
              holdingExpiresAt: appt.holdingExpiresAt
            }
          : null
      };
    });

    const totalSlots = dailySlots.length;
    const bookedCount = dailySlots.filter((slot) => slot.status !== 'available').length;
    const availableCount = totalSlots - bookedCount;
    const completedCount = dailySlots.filter((slot) => slot.status === 'completed').length;
    const holdingCount = dailySlots.filter((slot) => slot.status === 'holding').length;
    const occupancyRate = totalSlots > 0 ? Math.round((bookedCount / totalSlots) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive !== false,
          specialtyName: profile?.specialtyId?.name || 'Chưa phân khoa',
          consultationFee: profile?.consultationFee ?? 0,
          hospital: profile?.hospital || 'Phòng khám Đa khoa MedCare'
        },
        scheduleType: 'doctor',
        date,
        dayOfWeek,
        weeklySchedule,
        daily: {
          isWorkingDay: configuredSlots.length > 0,
          slots: dailySlots,
          stats: {
            totalSlots,
            bookedCount,
            availableCount,
            completedCount,
            holdingCount,
            occupancyRate
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getUserSchedule
};
