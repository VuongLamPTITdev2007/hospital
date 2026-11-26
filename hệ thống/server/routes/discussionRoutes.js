const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/auth');
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

                                                     
router.get('/my-appointments', verifyToken, getMyAppointments);

router.route('/reviews')
  .get(getReviews)
  .post(verifyToken, authorizeRoles('patient'), createReview);

router.get('/reviews/doctor/:doctorId', getDoctorReviewsById);

                     
router.route('/')
  .get(getDiscussions)
  .post(verifyToken, createDiscussion);

                               
router.post('/:id/comments', verifyToken, addComment);
router.patch('/:id/like', verifyToken, toggleLike);

router.route('/:id')
  .get(getDiscussionById)
  .delete(verifyToken, deleteDiscussion);

module.exports = router;
