const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung phản hồi'],
    trim: true
  },
  isDoctorAnswer: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const discussionSchema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề câu hỏi'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung chi tiết'],
    trim: true
  },
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty'
  },
  specialtyName: {
    type: String,
    default: 'Đa khoa'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  tags: [String],
  comments: [commentSchema],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Discussion', discussionSchema);
