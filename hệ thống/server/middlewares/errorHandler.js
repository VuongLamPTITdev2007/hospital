                                 
const errorHandler = (err, req, res, next) => {
  console.error('[Error Trace]:', err.stack);

  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Lỗi hệ thống máy chủ nội bộ!';

                                                           
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Dữ liệu trường '${field}' đã tồn tại trong hệ thống!`;
  }

                          
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

                                            
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
