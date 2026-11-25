const Appointment = require('../models/Appointment');
const User = require('../models/User');

const ROLE_KEYS = ['patient', 'doctor', 'pharmacist', 'admin'];

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

module.exports = { getAnalytics };
