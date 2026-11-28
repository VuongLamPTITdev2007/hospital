const express = require('express');
const {
  getAnalytics,
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  getUserSchedule
} = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(verifyToken, authorizeRoles('admin'));
router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/users/:id/schedule', getUserSchedule);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);

module.exports = router;
