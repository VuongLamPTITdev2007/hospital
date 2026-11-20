const Specialty = require('../models/Specialty');

// @desc    Lấy danh sách tất cả chuyên khoa đang hoạt động
// @route   GET /api/specialties
// @access  Public
exports.getSpecialties = async (req, res, next) => {
  try {
    const specialties = await Specialty.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: specialties.length,
      data: specialties
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết một chuyên khoa theo ID
// @route   GET /api/specialties/:id
// @access  Public
exports.getSpecialtyById = async (req, res, next) => {
  try {
    const specialty = await Specialty.findById(req.params.id);

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin chuyên khoa yêu cầu'
      });
    }

    res.status(200).json({
      success: true,
      data: specialty
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo chuyên khoa mới (Dành cho Admin)
// @route   POST /api/specialties
// @access  Private (Admin)
exports.createSpecialty = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;

    const existing = await Specialty.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Tên chuyên khoa này đã tồn tại trong hệ thống!'
      });
    }

    const specialty = await Specialty.create({
      name,
      description,
      icon: icon || 'Stethoscope'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo chuyên khoa mới thành công!',
      data: specialty
    });
  } catch (error) {
    next(error);
  }
};
