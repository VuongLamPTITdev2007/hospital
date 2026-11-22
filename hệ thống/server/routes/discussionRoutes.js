const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  deleteDiscussion
} = require('../controllers/communityController');

/**
 * Routes: /api/discussions
 * Phân hệ TV 5: Diễn đàn Hỏi - Đáp Y tế & Đánh giá Bác sĩ
 */

// Lấy danh sách câu hỏi cộng đồng & Đăng câu hỏi mới
router.route('/')
  .get(getDiscussions)
  .post(verifyToken, createDiscussion);

// Lấy chi tiết câu hỏi theo ID & Xóa câu hỏi (kiểm tra quyền)
router.route('/:id')
  .get(getDiscussionById)
  .delete(verifyToken, deleteDiscussion);

module.exports = router;
