const express = require('express');
const { addComment, createDiscussion, createReview, getDiscussions, getDoctorReviews } = require('../controllers/communityController');
const { authorizeRoles, verifyToken } = require('../middlewares/auth');

const router = express.Router();
router.get('/discussions', getDiscussions);
router.get('/reviews/doctors/:doctorId', getDoctorReviews);
router.post('/discussions', verifyToken, createDiscussion);
router.post('/discussions/:id/comments', verifyToken, addComment);
router.post('/reviews', verifyToken, authorizeRoles('patient'), createReview);
module.exports = router;
