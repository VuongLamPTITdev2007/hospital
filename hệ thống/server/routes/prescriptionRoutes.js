const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById
} = require('../controllers/prescriptionController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', verifyToken, authorizeRoles('doctor', 'admin'), createPrescription);
router.get('/', verifyToken, getPrescriptions);
router.get('/:id', verifyToken, getPrescriptionById);

module.exports = router;
