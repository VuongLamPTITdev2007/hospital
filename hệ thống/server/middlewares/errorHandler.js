const chatErrors = {
  400: 'Yêu cầu chatbot không hợp lệ.',
  413: 'Nội dung gửi đến chatbot quá dài.',
  415: 'Định dạng dữ liệu chatbot không được hỗ trợ.',
  500: 'Chatbot gặp lỗi máy chủ. Vui lòng thử lại.',
  502: 'Không kết nối được dịch vụ chatbot. Vui lòng thử lại.',
  503: 'Dịch vụ chatbot chưa sẵn sàng. Vui lòng thử lại sau.'
};

// Middleware xử lý lỗi tập trung
const errorHandler = (err, req, res, next) => {
  if (/^\/api\/chat(?:[/?]|$)/i.test(req.originalUrl)) {
    const status = err.statusCode || err.status;
    const code = Object.hasOwn(chatErrors, status) ? status : 500;
    if (code >= 500) console.error('[Chat] Yêu cầu gặp lỗi máy chủ.', code);
    return res.status(code).json({ success: false, message: chatErrors[code] });
  }
  console.error('[Error Trace]:', err.stack);

  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Lỗi hệ thống máy chủ nội bộ!';

  // Lỗi trùng lặp dữ liệu (MongoDB Duplicate Key - E11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Dữ liệu trường '${field}' đã tồn tại trong hệ thống!`;
  }

  // Lỗi xác thực Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Lỗi ép sai kiểu ObjectId trong Mongoose
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Không tìm thấy tài nguyên với mã định danh (id): ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
