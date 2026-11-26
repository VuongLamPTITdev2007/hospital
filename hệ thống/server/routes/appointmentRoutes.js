const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

                   
router.get('/doctors', appointmentController.getDoctorsForBooking);
router.get('/slots', appointmentController.getAvailableSlots);

                                                  
router.post('/hold', verifyToken, authorizeRoles('patient'), appointmentController.holdSlot);
router.post('/:id/confirm', verifyToken, appointmentController.confirmBooking);
router.post('/:id/cancel', verifyToken, appointmentController.cancelAppointment);
router.get('/my-appointments', verifyToken, appointmentController.getMyAppointments);
router.get('/:id', verifyToken, appointmentController.getAppointmentById);

module.exports = router;

