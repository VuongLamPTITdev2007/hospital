const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Load biến môi trường
dotenv.config();

// Khởi tạo Express
const app = express();

// Kết nối Cơ sở dữ liệu MongoDB
connectDB();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra sức khỏe API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MedCare API Server is up and running!',
    timestamp: new Date().toISOString()
  });
});

// Nạp các Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/specialties', require('./routes/specialtyRoutes')); // TV 1
app.use('/api/doctors', require('./routes/doctorRoutes'));         // TV 1
app.use('/api/appointments', require('./routes/appointmentRoutes')); // Phân hệ TV 2: Booking Engine & Giữ chỗ 5p

app.use('/api/records', require('./routes/medicalRecordRoutes'));   // TV 3
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
// app.use('/api/discussions', require('./routes/discussionRoutes')); // TV 5
// app.use('/api/admin', require('./routes/adminRoutes'));           // TV 6

// Xử lý 404 cho Route không tồn tại
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên API tại đường dẫn: ${req.originalUrl}`
  });
});

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] MedCare backend running on http://localhost:${PORT}`);
});
