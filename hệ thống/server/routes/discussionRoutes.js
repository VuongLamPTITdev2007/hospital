const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  deleteDiscussion,
  addComment,
  toggleLike,
  getMyAppointments,
  createReview,
  getReviews,
  getDoctorReviewsById
} = require('../controllers/communityController');

// Lịch sử ca khám & Đánh giá bác sĩ (đặt trước /:id)
router.get('/my-appointments', verifyToken, getMyAppointments);

router.route('/reviews')
  .get(getReviews)
  .post(verifyToken, createReview);

router.get('/reviews/doctor/:doctorId', getDoctorReviewsById);

// Diễn đàn Hỏi - Đáp
router.route('/')
  .get(getDiscussions)
  .post(verifyToken, createDiscussion);

// Tương tác & Chi tiết câu hỏi
router.post('/:id/comments', verifyToken, addComment);
router.patch('/:id/like', verifyToken, toggleLike);

router.route('/:id')
  .get(getDiscussionById)
  .delete(verifyToken, deleteDiscussion);

module.exports = router;
