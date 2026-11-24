const express = require('express');
const router = express.Router();
const {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  getPatients,
  dispensePrescription
} = require('../controllers/prescriptionController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.post('/', verifyToken, authorizeRoles('doctor', 'admin'), createPrescription);
router.get('/patients', verifyToken, authorizeRoles('doctor', 'pharmacist', 'admin'), getPatients);
router.get('/', verifyToken, getPrescriptions);
router.get('/:id', verifyToken, getPrescriptionById);
router.patch('/:id/dispense', verifyToken, authorizeRoles('pharmacist', 'admin'), dispensePrescription);

module.exports = router;
