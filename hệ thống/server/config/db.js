const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medcare_db');
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn(`[Cảnh báo] MongoDB chưa được bật tại 127.0.0.1:27017. Hãy bật dịch vụ MongoDB trên máy hoặc dùng chuỗi kết nối MongoDB Atlas trong server/.env để lưu dữ liệu!`);
    // Không gọi process.exit(1) để tránh làm server sập ngay lập tức
  }
};

module.exports = connectDB;
