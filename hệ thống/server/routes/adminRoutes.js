const express = require('express');
const { getAnalytics } = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(verifyToken, authorizeRoles('admin'));
router.get('/analytics', getAnalytics);

module.exports = router;
