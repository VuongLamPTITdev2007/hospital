const Appointment = require('../models/Appointment');
const Discussion = require('../models/Discussion');
const DoctorProfile = require('../models/DoctorProfile');
const Review = require('../models/Review');

const getDiscussions = async (req, res, next) => {
  try {
    const discussions = await Discussion.find()
      .populate('authorId', 'fullName role')
      .populate('specialtyId', 'name')
      .populate('comments.authorId', 'fullName role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: discussions });
  } catch (error) { next(error); }
};

const createDiscussion = async (req, res, next) => {
  try {
    const { title, content, specialtyId, tags = [] } = req.body;
    if (!title?.trim() || !content?.trim()) return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung câu hỏi là bắt buộc.' });
    const discussion = await Discussion.create({ authorId: req.user.id, title: title.trim(), content: content.trim(), specialtyId: specialtyId || undefined, tags });
    await discussion.populate(['authorId', 'specialtyId']);
    res.status(201).json({ success: true, data: discussion });
  } catch (error) { next(error); }
};

const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false, message: 'Nội dung phản hồi là bắt buộc.' });
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ success: false, message: 'Không tìm thấy câu hỏi.' });
    discussion.comments.push({ authorId: req.user.id, content: content.trim(), isDoctorAnswer: req.user.role === 'doctor' });
    await discussion.save();
    await discussion.populate('comments.authorId', 'fullName role');
    res.status(201).json({ success: true, data: discussion.comments.at(-1) });
  } catch (error) { next(error); }
};

const createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;
    if (!appointmentId || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5 || !comment?.trim()) {
      return res.status(400).json({ success: false, message: 'Thông tin đánh giá không hợp lệ.' });
    }
    const appointment = await Appointment.findOne({ _id: appointmentId, patientId: req.user.id, status: 'completed' });
    if (!appointment) return res.status(403).json({ success: false, message: 'Chỉ lịch khám đã hoàn tất của chính bạn mới được đánh giá.' });
    const review = await Review.create({ appointmentId, patientId: req.user.id, doctorId: appointment.doctorId, rating: Number(rating), comment: comment.trim() });
    const metrics = await Review.aggregate([{ $match: { doctorId: appointment.doctorId } }, { $group: { _id: '$doctorId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }]);
    await DoctorProfile.updateOne({ userId: appointment.doctorId }, { $set: { averageRating: Number(metrics[0].averageRating.toFixed(1)), reviewCount: metrics[0].reviewCount } });
    res.status(201).json({ success: true, data: review });
  } catch (error) { next(error); }
};

const getDoctorReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ doctorId: req.params.doctorId }).populate('patientId', 'fullName').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) { next(error); }
};

module.exports = { getDiscussions, createDiscussion, addComment, createReview, getDoctorReviews };
