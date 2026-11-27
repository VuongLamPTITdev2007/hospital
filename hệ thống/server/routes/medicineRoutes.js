const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine
} = require('../controllers/medicineController');
const { verifyToken, optionalVerifyToken, authorizeRoles } = require('../middlewares/auth');

router.get('/', optionalVerifyToken, getMedicines);
router.get('/:id', optionalVerifyToken, getMedicineById);
router.post('/', verifyToken, authorizeRoles('pharmacist', 'admin'), createMedicine);
router.put('/:id', verifyToken, authorizeRoles('pharmacist', 'admin'), updateMedicine);
router.delete('/:id', verifyToken, authorizeRoles('pharmacist', 'admin'), deleteMedicine);

module.exports = router;
