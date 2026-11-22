const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  deleteDiscussion,
  addComment,
  toggleLike
} = require('../controllers/communityController');

/**
 * Routes: /api/discussions
 * Phân hệ TV 5: Diễn đàn Hỏi - Đáp Y tế & Đánh giá Bác sĩ
 */

// 1. Lấy danh sách câu hỏi cộng đồng & Đăng câu hỏi mới
router.route('/')
  .get(getDiscussions)
  .post(verifyToken, createDiscussion);

// 2. Lấy chi tiết câu hỏi theo ID & Xóa câu hỏi (kiểm tra quyền)
router.route('/:id')
  .get(getDiscussionById)
  .delete(verifyToken, deleteDiscussion);

// 3. Bình luận / Trả lời câu hỏi (Tự động nhận diện nếu người gửi là Bác sĩ)
router.post('/:id/comments', verifyToken, addComment);

// 4. Thích / Bỏ thích câu hỏi (Toggle Like)
router.patch('/:id/like', verifyToken, toggleLike);

module.exports = router;
