const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const Review = require('../models/Review');

// @desc    Lấy danh sách bác sĩ với Tìm kiếm thông minh, Lọc đa tiêu chí & Phân trang (Tiêu chí 8)
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res, next) => {
  try {
    const {
      search,
      specialty,
      minFee,
      maxFee,
      minRating,
      sortBy = 'rating_desc',
      page = 1,
      limit = 6
    } = req.query;

    const query = {};

    // 1. Lọc theo chuyên khoa (Specialty ID hoặc tên)
    if (specialty && specialty !== 'all') {
      // Nếu truyền dạng ObjectId hoặc tên
      if (specialty.match(/^[0-9a-fA-F]{24}$/)) {
        query.specialtyId = specialty;
      } else {
        const foundSpec = await Specialty.findOne({ name: new RegExp(specialty, 'i') });
        if (foundSpec) {
          query.specialtyId = foundSpec._id;
        }
      }
    }

    // 2. Lọc theo khoảng giá khám ($gte, $lte)
    if (minFee || maxFee) {
      query.consultationFee = {};
      if (minFee) query.consultationFee.$gte = Number(minFee);
      if (maxFee) query.consultationFee.$lte = Number(maxFee);
    }

    // 3. Lọc theo số sao đánh giá tối thiểu ($gte)
    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    // 4. Tìm kiếm từ khóa ($regex không phân biệt hoa thường)
    let matchingUserIds = [];
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');

      // Tìm trong User (họ tên, email)
      const matchedUsers = await User.find({
        role: 'doctor',
        $or: [{ fullName: searchRegex }, { email: searchRegex }]
      }).select('_id');

      matchingUserIds = matchedUsers.map(u => u._id);

      // Tìm trong cả DoctorProfile (bio, bệnh viện, học vị) HOẶC khớp User
      query.$or = [
        { userId: { $in: matchingUserIds } },
        { hospital: searchRegex },
        { degree: searchRegex },
        { bio: searchRegex }
      ];
    }

    // 5. Sắp xếp dữ liệu (Sort)
    let sortOptions = {};
    if (sortBy === 'fee_asc') sortOptions.consultationFee = 1;
    else if (sortBy === 'fee_desc') sortOptions.consultationFee = -1;
    else if (sortBy === 'exp_desc') sortOptions.experienceYears = -1;
    else sortOptions.averageRating = -1; // Mặc định: đánh giá cao nhất xếp trước

    // 6. Phân trang ở server (Server-side pagination với skip/limit)
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 6);
    const skip = (pageNum - 1) * limitNum;

    const total = await DoctorProfile.countDocuments(query);

    const doctors = await DoctorProfile.find(query)
      .populate('userId', 'fullName email avatar phone')
      .populate('specialtyId', 'name icon description')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: doctors.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết thông tin một bác sĩ (kèm ca trực và đánh giá)
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Tìm theo doctorProfile ID hoặc userId
    let doctor = await DoctorProfile.findById(id)
      .populate('userId', 'fullName email avatar phone')
      .populate('specialtyId', 'name icon description');

    if (!doctor) {
      doctor = await DoctorProfile.findOne({ userId: id })
        .populate('userId', 'fullName email avatar phone')
        .populate('specialtyId', 'name icon description');
    }

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bác sĩ yêu cầu!'
      });
    }

    // Lấy kèm danh sách đánh giá của bác sĩ này
    const reviews = await Review.find({ doctorId: doctor.userId._id })
      .populate('patientId', 'fullName avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: doctor,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật thông tin hồ sơ bác sĩ (Lịch ca trực, giá khám, tiểu sử)
// @route   PUT /api/doctors/:id
// @access  Private (Doctor hoặc Admin)
exports.updateDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { consultationFee, degree, hospital, bio, workingHours, experienceYears } = req.body;

    let doctor = await DoctorProfile.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bác sĩ để cập nhật!'
      });
    }

    // Kiểm tra quyền: Chỉ chính bác sĩ đó hoặc Admin mới được sửa
    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa đổi hồ sơ của bác sĩ này!'
      });
    }

    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (degree !== undefined) doctor.degree = degree;
    if (hospital !== undefined) doctor.hospital = hospital;
    if (bio !== undefined) doctor.bio = bio;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
    if (workingHours !== undefined) doctor.workingHours = workingHours;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ bác sĩ thành công!',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};
