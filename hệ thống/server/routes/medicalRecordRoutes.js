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

                                
router.get('/doctor-queue', verifyToken, authorizeRoles('doctor', 'admin'), getDoctorQueue);

                                                                  
router.patch(
  '/appointments/:appointmentId/status',
  verifyToken,
  authorizeRoles('doctor', 'admin'),
  updateAppointmentStatus
);

                                
router.get('/patient/:patientId', verifyToken, getPatientHistory);

                                   
router.get('/appointment/:appointmentId', verifyToken, getRecordByAppointment);

                     
router.get('/:id', verifyToken, getRecordById);
router.post('/', verifyToken, authorizeRoles('doctor', 'admin'), createMedicalRecord);
router.put('/:id', verifyToken, authorizeRoles('doctor', 'admin'), updateMedicalRecord);
router.delete('/:id', verifyToken, authorizeRoles('doctor', 'admin'), deleteMedicalRecord);

module.exports = router;
