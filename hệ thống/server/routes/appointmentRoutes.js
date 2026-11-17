const express = require('express');
const {
  getMyAppointments,
  createAppointment,
  updateAppointment,
  getDoctorQueue,
  updateAppointmentStatus
} = require('../controllers/appointmentController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(verifyToken);
router.get('/appointments/my', getMyAppointments);
router.post('/appointments', authorizeRoles('patient'), createAppointment);
router.get('/appointments/doctor-queue', authorizeRoles('doctor'), getDoctorQueue);
router.patch('/appointments/:id/status', authorizeRoles('doctor'), updateAppointmentStatus);
router.patch('/appointments/:id', updateAppointment);

module.exports = router;
