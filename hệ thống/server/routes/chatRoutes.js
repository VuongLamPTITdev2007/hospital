const express = require('express');
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
const { sendMessage } = require('../controllers/chatController');
const router = express.Router();
const usage = new Map();
const limitChat = (req, res, next) => {
  const now = Date.now();
  const recent = (usage.get(req.user.id) || []).filter((time) => now - time < 60000);
  if (recent.length >= 12) return res.status(429).json({ success: false, message: 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau một phút.' });
  recent.push(now);
  usage.set(req.user.id, recent);
  if (usage.size > 1000) {
    for (const [id, times] of usage) if (times.every((time) => now - time >= 60000)) usage.delete(id);
  }
  next();
};
router.post('/messages', verifyToken, authorizeRoles('patient'), limitChat, sendMessage);
module.exports = router;
