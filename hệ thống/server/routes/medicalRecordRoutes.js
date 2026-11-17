const express = require('express');
const { getRecordByAppointment, createRecord, updateRecord } = require('../controllers/medicalRecordController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(verifyToken);
router.get('/records/appointment/:appointmentId', getRecordByAppointment);
router.post('/records', authorizeRoles('doctor'), createRecord);
router.patch('/records/:id', authorizeRoles('doctor'), updateRecord);

module.exports = router;
