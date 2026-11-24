const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medcare_db';
    // Đặt timeout 2.5s để không treo server nếu máy chưa bật MongoDB
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[MongoDB] Kết nối CSDL thành công tới: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    console.warn('[MongoDB] Không thể lưu dữ liệu khi chưa kết nối cơ sở dữ liệu.');
  }
};

module.exports = connectDB;
