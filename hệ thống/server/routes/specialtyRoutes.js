const express = require('express');
const router = express.Router();
const {
  getSpecialties,
  getSpecialtyById,
  createSpecialty
} = require('../controllers/specialtyController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

router.get('/', getSpecialties);
router.get('/:id', getSpecialtyById);
router.post('/', verifyToken, authorizeRoles('admin'), createSpecialty);

module.exports = router;
