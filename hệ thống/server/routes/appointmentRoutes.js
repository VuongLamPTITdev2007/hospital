const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

// Public endpoints
router.get('/doctors', appointmentController.getDoctorsForBooking);
router.get('/slots', appointmentController.getAvailableSlots);

// Private endpoints (yêu cầu đăng nhập tài khoản)
router.post(['/hold', '/'], verifyToken, authorizeRoles('patient'), appointmentController.holdSlot);
router.post('/:id/confirm', verifyToken, appointmentController.confirmBooking);
router.post('/:id/cancel', verifyToken, appointmentController.cancelAppointment);
router.patch('/:id', verifyToken, (req, res, next) => {
  if (req.body.action === 'confirm') return appointmentController.confirmBooking(req, res, next);
  if (req.body.action === 'cancel') return appointmentController.cancelAppointment(req, res, next);
  return res.status(400).json({ success: false, message: 'Action không hợp lệ (hỗ trợ confirm hoặc cancel).' });
});
router.get('/my-appointments', verifyToken, appointmentController.getMyAppointments);
router.get('/:id', verifyToken, appointmentController.getAppointmentById);

module.exports = router;
