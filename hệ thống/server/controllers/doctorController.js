const mongoose = require('mongoose');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const Review = require('../models/Review');

// Escape ký tự đặc biệt trước khi đưa vào RegExp để tránh lỗi cú pháp khi tìm kiếm
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Dữ liệu Bác sĩ Hà Nội in-memory để phục vụ API ngay cả khi MongoDB offline
const HANOI_DOCTORS_DATA = [
  {
    _id: 'doc_lanhieu',
    degree: 'Phó Giáo sư, Tiến sĩ, Bác sĩ Cao cấp',
    hospital: 'Bệnh viện Đại học Y Hà Nội (Tôn Thất Tùng, Đống Đa)',
    consultationFee: 450000,
    experienceYears: 25,
    averageRating: 5.0,
    reviewCount: 215,
    userId: {
      _id: 'u_lanhieu',
      fullName: 'PGS.TS.BS. Nguyễn Lân Hiếu',
      email: 'lanhieu.nguyen@medcare.vn',
      phone: '0912111001',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's1', name: 'Tim mạch' },
    bio: 'Giám đốc BV Đại học Y Hà Nội. Chuyên gia đầu ngành can thiệp tim bẩm sinh và tim mạch can thiệp tại Việt Nam.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] },
      { dayOfWeek: 3, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] },
      { dayOfWeek: 5, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] }
    ]
  },
  {
    _id: 'doc_tiendung',
    degree: 'Phó Giáo sư, Tiến sĩ Bác sĩ Nhi',
    hospital: 'Bệnh viện Bạch Mai (Số 78 Giải Phóng, Đống Đa)',
    consultationFee: 350000,
    experienceYears: 32,
    averageRating: 4.9,
    reviewCount: 180,
    userId: {
      _id: 'u_tiendung',
      fullName: 'PGS.TS.BS. Nguyễn Tiến Dũng',
      email: 'tiendung.nguyen@medcare.vn',
      phone: '0912111002',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's2', name: 'Nhi khoa' },
    bio: 'Nguyên Trưởng khoa Nhi - Bệnh viện Bạch Mai. Chuyên gia điều trị viêm phổi nặng, dị ứng và hô hấp nhi khoa.',
    workingHours: [
      { dayOfWeek: 2, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] },
      { dayOfWeek: 4, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] },
      { dayOfWeek: 6, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  {
    _id: 'doc_vinhngoc',
    degree: 'Phó Giáo sư, Tiến sĩ Y khoa',
    hospital: 'Bệnh viện Bạch Mai & Đại học Y Hà Nội',
    consultationFee: 400000,
    experienceYears: 28,
    averageRating: 4.9,
    reviewCount: 164,
    userId: {
      _id: 'u_vinhngoc',
      fullName: 'PGS.TS.BS. Nguyễn Vĩnh Ngọc',
      email: 'vinhngoc.nguyen@medcare.vn',
      phone: '0912111003',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's3', name: 'Cơ xương khớp' },
    bio: 'Phó Chủ tịch Hội Thấp khớp học Hà Nội. Chuyên gia điều trị thoái hóa khớp gối, thoái hóa cột sống và gút.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] },
      { dayOfWeek: 3, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] }
    ]
  },
  {
    _id: 'doc_vanlong',
    degree: 'Giáo sư, Tiến sĩ Y học',
    hospital: 'Bệnh viện Đại học Y Hà Nội (Nguyên Giám đốc BV)',
    consultationFee: 500000,
    experienceYears: 35,
    averageRating: 5.0,
    reviewCount: 240,
    userId: {
      _id: 'u_vanlong',
      fullName: 'GS.TS.BS. Đào Văn Long',
      email: 'vanlong.dao@medcare.vn',
      phone: '0912111004',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's4', name: 'Tiêu hóa - Gan mật' },
    bio: 'Nguyên Trưởng khoa Tiêu hóa BV Bạch Mai. Chuyên gia hàng đầu về tầm soát ung thư sớm tiêu hóa và dạ dày HP.',
    workingHours: [
      { dayOfWeek: 2, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 4, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  {
    _id: 'doc_vanlieu',
    degree: 'Phó Giáo sư, Bác sĩ Thần kinh',
    hospital: 'Bệnh viện Bạch Mai & Đại học Y Hà Nội',
    consultationFee: 400000,
    experienceYears: 30,
    averageRating: 4.8,
    reviewCount: 132,
    userId: {
      _id: 'u_vanlieu',
      fullName: 'PGS.TS.BS. Nguyễn Văn Liệu',
      email: 'vanlieu.nguyen@medcare.vn',
      phone: '0912111005',
      avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's5', name: 'Thần kinh' },
    bio: 'Chuyên gia đầu ngành nội thần kinh. Chuyên khám chữa chứng đau nửa đầu, mất ngủ, rối loạn tiền đình và đột quỵ.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 5, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  {
    _id: 'doc_thilan',
    degree: 'Phó Giáo sư, Tiến sĩ Da liễu',
    hospital: 'Bệnh viện Da liễu Trung ương (Phương Mai, Đống Đa)',
    consultationFee: 350000,
    experienceYears: 22,
    averageRating: 4.9,
    reviewCount: 195,
    userId: {
      _id: 'u_thilan',
      fullName: 'PGS.TS.BS. Phạm Thị Lan',
      email: 'thilan.pham@medcare.vn',
      phone: '0912111006',
      avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's6', name: 'Da liễu' },
    bio: 'Giảng viên cao cấp ĐH Y Hà Nội, Bác sĩ BV Da liễu TW. Chuyên trị mụn trứng cá nặng, viêm da cơ địa và thẩm mỹ da.',
    workingHours: [
      { dayOfWeek: 2, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 6, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  {
    _id: 'doc_baquyet',
    degree: 'Phó Giáo sư, Tiến sĩ Sản phụ khoa',
    hospital: 'Bệnh viện Phụ sản Trung ương (Tràng Thi, Hoàn Kiếm)',
    consultationFee: 450000,
    experienceYears: 34,
    averageRating: 5.0,
    reviewCount: 220,
    userId: {
      _id: 'u_baquyet',
      fullName: 'PGS.TS.BS. Vũ Bá Quyết',
      email: 'baquyet.vu@medcare.vn',
      phone: '0912111007',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's7', name: 'Sản phụ khoa' },
    bio: 'Nguyên Giám đốc BV Phụ sản TW. Chuyên gia phẫu thuật nội soi sản phụ khoa hàng đầu Việt Nam và vô sinh hiếm muộn.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 4, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  {
    _id: 'doc_thihanh',
    degree: 'Phó Giáo sư, Tiến sĩ Hô hấp',
    hospital: 'Trung tâm Hô hấp - Bệnh viện Bạch Mai',
    consultationFee: 380000,
    experienceYears: 26,
    averageRating: 4.8,
    reviewCount: 110,
    userId: {
      _id: 'u_thihanh',
      fullName: 'PGS.TS.BS. Chu Thị Hạnh',
      email: 'thihanh.chu@medcare.vn',
      phone: '0912111008',
      avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { _id: 's8', name: 'Hô hấp - Phổi' },
    bio: 'Phó Chủ tịch Hội Hô hấp VN, Phó GĐ Trung tâm Hô hấp BV Bạch Mai. Chuyên trị hen phế quản, COPD và viêm phổi.',
    workingHours: [
      { dayOfWeek: 3, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 5, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  }
];

// Hàm lọc và phân trang in-memory
const getMockFilteredDoctors = (params) => {
  const { search, specialty, sortBy, page = 1, limit = 6 } = params;
  let filtered = [...HANOI_DOCTORS_DATA];

  if (search && search.trim() !== '') {
    const s = search.trim().toLowerCase();
    filtered = filtered.filter(d =>
      d.userId.fullName.toLowerCase().includes(s) ||
      d.hospital.toLowerCase().includes(s) ||
      d.specialtyId.name.toLowerCase().includes(s) ||
      d.degree.toLowerCase().includes(s)
    );
  }

  if (specialty && specialty !== 'all') {
    filtered = filtered.filter(d => d.specialtyId.name === specialty || d.specialtyId._id === specialty);
  }

  if (sortBy === 'fee_asc') filtered.sort((a, b) => a.consultationFee - b.consultationFee);
  else if (sortBy === 'fee_desc') filtered.sort((a, b) => b.consultationFee - a.consultationFee);
  else if (sortBy === 'exp_desc') filtered.sort((a, b) => b.experienceYears - a.experienceYears);
  else filtered.sort((a, b) => b.averageRating - a.averageRating);

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 6);
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = filtered.slice(startIndex, startIndex + limitNum);

  return {
    success: true,
    count: paginated.length,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / limitNum) || 1,
    currentPage: pageNum,
    data: paginated
  };
};

// @desc    Lấy danh sách bác sĩ với Tìm kiếm, Lọc & Phân trang
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res, next) => {
  try {
    // Nếu MongoDB đang kết nối
    if (mongoose.connection.readyState === 1) {
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

      if (specialty && specialty !== 'all') {
        if (specialty.match(/^[0-9a-fA-F]{24}$/)) {
          query.specialtyId = specialty;
        } else {
          const foundSpec = await Specialty.findOne({ name: new RegExp(escapeRegex(specialty), 'i') });
          if (foundSpec) query.specialtyId = foundSpec._id;
          else query.specialtyId = null;
        }
      }

      if (minFee || maxFee) {
        query.consultationFee = {};
        if (minFee) query.consultationFee.$gte = Number(minFee);
        if (maxFee) query.consultationFee.$lte = Number(maxFee);
      }

      if (minRating) {
        query.averageRating = { $gte: Number(minRating) };
      }

      if (search && search.trim() !== '') {
        const searchRegex = new RegExp(escapeRegex(search.trim()), 'i');
        const matchedUsers = await User.find({
          role: 'doctor',
          $or: [{ fullName: searchRegex }, { email: searchRegex }]
        }).select('_id');

        query.$or = [
          { userId: { $in: matchedUsers.map(u => u._id) } },
          { hospital: searchRegex },
          { degree: searchRegex },
          { bio: searchRegex }
        ];
      }

      let sortOptions = {};
      if (sortBy === 'fee_asc') sortOptions.consultationFee = 1;
      else if (sortBy === 'fee_desc') sortOptions.consultationFee = -1;
      else if (sortBy === 'exp_desc') sortOptions.experienceYears = -1;
      else sortOptions.averageRating = -1;

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 6);
      const skip = (pageNum - 1) * limitNum;

      const hasDoctorsInDb = (await DoctorProfile.estimatedDocumentCount()) > 0;
      if (hasDoctorsInDb) {
        const total = await DoctorProfile.countDocuments(query);
        const doctors = total > 0
          ? await DoctorProfile.find(query)
              .populate('userId', 'fullName email avatar phone')
              .populate('specialtyId', 'name icon description')
              .sort(sortOptions)
              .skip(skip)
              .limit(limitNum)
          : [];

        return res.status(200).json({
          success: true,
          source: 'mongodb',
          count: doctors.length,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
          currentPage: pageNum,
          data: doctors
        });
      }
    }

    // Nếu MongoDB offline hoặc chưa nạp dữ liệu: Phục vụ dữ liệu Hà Nội in-memory
    const result = getMockFilteredDoctors(req.query);
    return res.status(200).json(result);
  } catch (error) {
    if (mongoose.connection.readyState !== 1) {
      const result = getMockFilteredDoctors(req.query);
      return res.status(200).json(result);
    }
    next(error);
  }
};

// @desc    Lấy chi tiết bác sĩ
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        let doctor = await DoctorProfile.findById(id)
          .populate('userId', 'fullName email avatar phone')
          .populate('specialtyId', 'name icon description');

        if (!doctor) {
          doctor = await DoctorProfile.findOne({ userId: id })
            .populate('userId', 'fullName email avatar phone')
            .populate('specialtyId', 'name icon description');
        }

        if (doctor) {
          const reviews = await Review.find({ doctorId: doctor.userId._id })
            .populate('patientId', 'fullName avatar')
            .sort({ createdAt: -1 })
            .limit(10);

          return res.status(200).json({
            success: true,
            data: doctor,
            reviews
          });
        }

        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin bác sĩ yêu cầu!'
        });
      }

      // Hỗ trợ xem chi tiết các mã demo tĩnh (doc_lanhieu...) nếu trùng khớp chính xác
      const matchedStatic = HANOI_DOCTORS_DATA.find(d => d._id === id);
      if (!matchedStatic) {
        return res.status(404).json({
          success: false,
          message: 'Mã bác sĩ không hợp lệ hoặc không tồn tại!'
        });
      }
    }

    // Fallback in-memory khi MongoDB offline hoặc truy vấn đúng mã tĩnh
    const foundDoctor = HANOI_DOCTORS_DATA.find(d => d._id === id);
    if (!foundDoctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ yêu cầu!'
      });
    }

    const mockReviews = [
      {
        _id: 'rev_1',
        patientId: { fullName: 'Trần Văn Bình' },
        rating: 5,
        comment: 'Bác sĩ khám bệnh rất kỹ lưỡng, giải thích nguyên nhân rõ ràng và kê đơn hiệu quả.',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'rev_2',
        patientId: { fullName: 'Lê Thị Thu Trang' },
        rating: 5,
        comment: 'Hệ thống đặt lịch giúp không phải chờ đợi lâu. Bác sĩ chuyên môn rất cao!',
        createdAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: foundDoctor,
      reviews: mockReviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật hồ sơ bác sĩ
// @route   PUT /api/doctors/:id
// @access  Private (Doctor hoặc Admin)
exports.updateDoctorProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    let doctor = await DoctorProfile.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ bác sĩ!'
      });
    }

    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa đổi hồ sơ này!'
      });
    }

    Object.assign(doctor, req.body);
    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật thành công!',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};
