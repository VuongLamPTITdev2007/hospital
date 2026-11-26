const Appointment = require('../models/Appointment');
const User = require('../models/User');

const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const getAnalytics = async (req, res, next) => {
  try {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const from = req.query.from || `${today.slice(0, 7)}-01`;
    const to = req.query.to || today;
    if (!validDate(from) || !validDate(to) || from > to) return res.status(400).json({ success: false, message: 'Khoảng ngày không hợp lệ.' });
    const date = { $gte: from, $lte: to };
    const [summary, specialties, roles] = await Promise.all([
      Appointment.aggregate([{ $match: { date } }, { $group: { _id: null, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }, simulatedFee: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $eq: ['$paymentStatus', 'paid'] }] }, '$fee', 0] } } } }]),
      Appointment.aggregate([{ $match: { date, status: 'completed', paymentStatus: 'paid' } }, { $lookup: { from: 'doctorprofiles', localField: 'doctorProfileId', foreignField: '_id', as: 'profile' } }, { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }, { $lookup: { from: 'specialties', localField: 'profile.specialtyId', foreignField: '_id', as: 'specialty' } }, { $unwind: { path: '$specialty', preserveNullAndEmptyArrays: true } }, { $group: { _id: { $ifNull: ['$specialty.name', 'Chưa phân loại'] }, appointments: { $sum: 1 }, simulatedFee: { $sum: '$fee' } } }, { $sort: { simulatedFee: -1, _id: 1 } }]),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);
    const count = (role) => roles.find((entry) => entry._id === role)?.count || 0;
    res.status(200).json({ success: true, data: { filters: { from, to }, summary: { completed: summary[0]?.completed || 0, simulatedFee: summary[0]?.simulatedFee || 0, patients: count('patient'), staff: count('doctor') + count('pharmacist') }, specialties: specialties.map((entry) => ({ specialty: entry._id, appointments: entry.appointments, simulatedFee: entry.simulatedFee })) } });
  } catch (error) { next(error); }
};
module.exports = { getAnalytics };
