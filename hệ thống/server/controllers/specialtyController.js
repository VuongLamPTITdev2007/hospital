const mongoose = require('mongoose');
const Specialty = require('../models/Specialty');

const FALLBACK_SPECIALTIES = [
  { _id: 's1', name: 'Tim mạch', description: 'Chẩn đoán và điều trị tăng huyết áp, suy tim, bệnh mạch vành.', icon: 'HeartPulse' },
  { _id: 's2', name: 'Nhi khoa', description: 'Khám chữa bệnh lý sơ sinh, hô hấp, tiêu hóa cho trẻ nhỏ.', icon: 'Baby' },
  { _id: 's3', name: 'Cơ xương khớp', description: 'Điều trị thoái hóa khớp, thoát vị đĩa đệm, viêm khớp dạng thấp.', icon: 'Bone' },
  { _id: 's4', name: 'Tiêu hóa - Gan mật', description: 'Nội soi tiêu hóa không đau, tầm soát ung thư dạ dày - đại tràng.', icon: 'Activity' },
  { _id: 's5', name: 'Thần kinh', description: 'Điều trị đau nửa đầu, mất ngủ mạn tính, rối loạn tiền đình.', icon: 'Brain' },
  { _id: 's6', name: 'Da liễu', description: 'Khám chữa mụn trứng cá, viêm da cơ địa và thẩm mỹ da liễu.', icon: 'Sparkles' },
  { _id: 's7', name: 'Sản phụ khoa', description: 'Khám thai định kỳ, phụ khoa tổng quát và sàng lọc trước sinh.', icon: 'Users' },
  { _id: 's8', name: 'Hô hấp - Phổi', description: 'Điều trị hen suyễn, COPD, viêm phổi và ho kéo dài.', icon: 'Stethoscope' }
];

// @desc    Lấy danh sách tất cả chuyên khoa
// @route   GET /api/specialties
// @access  Public
exports.getSpecialties = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const specialties = await Specialty.find({ isActive: true }).sort({ name: 1 });
      {
        return res.status(200).json({
          success: true,
          count: specialties.length,
          data: specialties
        });
      }
    }

    return res.status(503).json({ success: false, message: 'Chưa kết nối cơ sở dữ liệu.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy chi tiết chuyên khoa
// @route   GET /api/specialties/:id
// @access  Public
exports.getSpecialtyById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Mã chuyên khoa không hợp lệ.' });
    if (mongoose.connection.readyState === 1) {
      const specialty = await Specialty.findById(req.params.id);
      if (specialty) {
        return res.status(200).json({ success: true, data: specialty });
      }
    }

    if (mongoose.connection.readyState !== 1) return res.status(503).json({ success: false, message: 'Chưa kết nối cơ sở dữ liệu.' });
    return res.status(404).json({ success: false, message: 'Không tìm thấy chuyên khoa.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo chuyên khoa mới
// @route   POST /api/specialties
// @access  Private (Admin)
exports.createSpecialty = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
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
