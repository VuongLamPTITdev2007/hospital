const jwt = require('jsonwebtoken');
const User = require('../models/User');

                                
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy mã xác thực. Vui lòng đăng nhập lại!'
    });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'medcare_super_secret_jwt_key_2026_vibecoding');
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ!'
    });
  }
  try {
    const user = await User.findById(decoded.id).select('role email fullName');
    if (!user) return res.status(401).json({ success: false, message: 'Tài khoản không còn tồn tại.' });
    req.user = { id: String(user._id), role: user.role, email: user.email, fullName: user.fullName };
    next();
  } catch (error) {
    if (error.name === 'CastError') return res.status(401).json({ success: false, message: 'Mã xác thực không hợp lệ.' });
    next(error);
  }
};

                                                   
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vào tài nguyên này!'
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
