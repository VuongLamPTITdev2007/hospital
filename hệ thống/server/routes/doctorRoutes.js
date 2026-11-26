const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  updateDoctorProfile
} = require('../controllers/doctorController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.put('/:id', verifyToken, authorizeRoles('doctor', 'admin'), updateDoctorProfile);

module.exports = router;
