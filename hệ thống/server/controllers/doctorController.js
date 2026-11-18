const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Specialty = require('../models/Specialty');
const { availableSlots } = require('../services/bookingService');

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

    const slots = await availableSlots(req.params.id, date);
    if (!slots) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ bác sĩ.' });
    }
    res.status(200).json({
      success: true,
      data: slots
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSpecialties, getDoctors, getDoctorById, getAvailableSlots };
