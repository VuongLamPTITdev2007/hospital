const express = require('express');
const router = express.Router();
const {
  createMedicalRecord,
  getDoctorQueue,
  updateAppointmentStatus,
  getRecordByAppointment,
  getPatientHistory,
  getRecordById,
  updateMedicalRecord,
  deleteMedicalRecord
} = require('../controllers/medicalRecordController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

// Hàng đợi khám bệnh của bác sĩ
router.get('/doctor-queue', verifyToken, authorizeRoles('doctor', 'admin'), getDoctorQueue);

// Chuyển trạng thái ca khám (waiting -> in_progress -> completed)
router.patch(
  '/appointments/:appointmentId/status',
  verifyToken,
  authorizeRoles('doctor', 'admin'),
  updateAppointmentStatus
);

// Lịch sử bệnh án của bệnh nhân
router.get('/patient/:patientId', verifyToken, getPatientHistory);

// Tra cứu bệnh án theo mã lịch hẹn
router.get('/appointment/:appointmentId', verifyToken, getRecordByAppointment);

// CRUD hồ sơ bệnh án
router.get('/:id', verifyToken, getRecordById);
router.post('/', verifyToken, authorizeRoles('doctor', 'admin'), createMedicalRecord);
router.put('/:id', verifyToken, authorizeRoles('doctor', 'admin'), updateMedicalRecord);
router.delete('/:id', verifyToken, authorizeRoles('doctor', 'admin'), deleteMedicalRecord);

module.exports = router;
