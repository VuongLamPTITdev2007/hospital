const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Specialty = require('../models/Specialty');

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

const formatDoctor = (profile) => ({
  id: profile.userId?._id || profile.userId,
  profileId: profile._id,
  fullName: profile.userId?.fullName,
  email: profile.userId?.email,
  avatar: profile.userId?.avatar,
  phone: profile.userId?.phone,
  specialty: profile.specialtyId?.name || 'Chưa phân loại',
  specialtyId: profile.specialtyId?._id || profile.specialtyId,
  degree: profile.degree,
  hospital: profile.hospital,
  bio: profile.bio,
  consultationFee: profile.consultationFee,
  experienceYears: profile.experienceYears,
  averageRating: profile.averageRating,
  reviewCount: profile.reviewCount,
  workingHours: profile.workingHours
});

const getSpecialties = async (req, res, next) => {
  try {
    const specialties = await Specialty.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: specialties });
  } catch (error) {
    next(error);
  }
};

const getDoctors = async (req, res, next) => {
  try {
    const { search = '', specialty } = req.query;
    const specialtyFilter = specialty ? { specialtyId: specialty } : {};
    const profiles = await DoctorProfile.find(specialtyFilter)
      .populate({ path: 'userId', match: { role: 'doctor' }, select: 'fullName email phone avatar' })
      .populate('specialtyId', 'name')
      .sort({ averageRating: -1, experienceYears: -1 });

    const normalizedSearch = search.trim().toLowerCase();
    const doctors = profiles
      .filter((profile) => profile.userId)
      .map(formatDoctor)
      .filter((doctor) => !normalizedSearch || [doctor.fullName, doctor.specialty, doctor.hospital]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch)));

    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

const getDoctorById = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ userId: req.params.id })
      .populate({ path: 'userId', match: { role: 'doctor' }, select: 'fullName email phone avatar' })
      .populate('specialtyId', 'name description');

    if (!profile || !profile.userId) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bác sĩ.' });
    }

    res.status(200).json({ success: true, data: formatDoctor(profile) });
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!isValidDate(date)) {
      return res.status(400).json({ success: false, message: 'Ngày khám phải có định dạng YYYY-MM-DD.' });
    }

    const profile = await DoctorProfile.findOne({ userId: req.params.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ bác sĩ.' });
    }

    await Appointment.updateMany(
      { status: 'holding', holdingExpiresAt: { $lt: new Date() } },
      { $set: { status: 'cancelled' } }
    );

    const dayOfWeek = new Date(`${date}T00:00:00`).getDay() || 7;
    const workingDay = profile.workingHours.find((item) => item.dayOfWeek === dayOfWeek);
    const defaultSlots = ['08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00', '10:00-10:30', '14:00-14:30', '14:30-15:00', '15:00-15:30'];
    const slots = workingDay?.slots?.length ? workingDay.slots : defaultSlots;
    const bookedAppointments = await Appointment.find({
      doctorId: req.params.id,
      date,
      status: { $ne: 'cancelled' }
    }).select('timeSlot');
    const bookedSlots = new Set(bookedAppointments.map((appointment) => appointment.timeSlot));

    res.status(200).json({
      success: true,
      data: slots.map((timeSlot) => ({ timeSlot, isBooked: bookedSlots.has(timeSlot) }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSpecialties, getDoctors, getDoctorById, getAvailableSlots };
