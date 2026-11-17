const express = require('express');
const {
  getSpecialties,
  getDoctors,
  getDoctorById,
  getAvailableSlots
} = require('../controllers/doctorController');

const router = express.Router();

router.get('/specialties', getSpecialties);
router.get('/doctors', getDoctors);
router.get('/doctors/:id/available-slots', getAvailableSlots);
router.get('/doctors/:id', getDoctorById);

module.exports = router;
