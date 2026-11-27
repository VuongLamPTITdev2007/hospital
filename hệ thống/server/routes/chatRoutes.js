const express = require('express');
const { sendMessage, loadAvailabilityPage, selectAvailabilityOption } = require('../controllers/chatController');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const router = express.Router();
const requests = new Map();
const limit = (req, res, next) => {
  const now = Date.now();
  const key = req.ip;
  const recent = (requests.get(key) || []).filter((time) => now - time < 60000);
  if (recent.length >= 15) return res.status(429).json({ success: false, message: 'Bạn gửi quá nhanh, vui lòng thử lại sau một phút.' });
  recent.push(now); requests.set(key, recent);
  if (requests.size > 1000) for (const [ip, times] of requests) if (times.every((time) => now - time >= 60000)) requests.delete(ip);
  next();
};
router.post('/messages', limit, sendMessage);
router.post('/availability/pages', limit, loadAvailabilityPage);
router.post('/availability/selections', limit, verifyToken, authorizeRoles('patient'), selectAvailabilityOption);
module.exports = router;
