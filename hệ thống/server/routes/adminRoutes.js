const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { getAnalytics } = require('../controllers/adminController');
const router = express.Router();
router.get('/analytics', verifyToken, authorizeRoles('admin'), getAnalytics);
module.exports = router;
