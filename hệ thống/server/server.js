const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

                       
dotenv.config();

                   
const app = express();

                                
connectDB();

              
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

                        
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'MedCare API Server is up and running!',
    timestamp: new Date().toISOString()
  });
});

                 
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/specialties', require('./routes/specialtyRoutes'));        
app.use('/api/doctors', require('./routes/doctorRoutes'));                
app.use('/api/appointments', require('./routes/appointmentRoutes'));                                             

app.use('/api/records', require('./routes/medicalRecordRoutes'));          
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/discussions', require('./routes/discussionRoutes'));                                                 
app.use('/api/admin', require('./routes/adminRoutes'));                    
app.use('/api/chat', require('./routes/chatRoutes'));

                                    
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên API tại đường dẫn: ${req.originalUrl}`
  });
});

                                 
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Server] MedCare backend running on http://localhost:${PORT}`);
});
