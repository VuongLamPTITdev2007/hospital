const Discussion = require('../models/Discussion');
const User = require('../models/User');

/**
 * Controller: communityController
 * Phân hệ TV 5: Diễn đàn Hỏi - Đáp Y tế & Đánh giá Bác sĩ
 * Phần 1: CRUD Câu hỏi Diễn đàn (GET, POST, DELETE)
 */

// 1. Lấy danh sách câu hỏi cộng đồng (hỗ trợ lọc chuyên khoa, tìm kiếm từ khóa, phân trang)
// @route   GET /api/discussions
// @access  Public
exports.getDiscussions = async (req, res, next) => {
  try {
    const { search, specialty, page = 1, limit = 20 } = req.query;

    const query = {};

    // Tìm kiếm từ khóa theo tiêu đề, nội dung hoặc tags
    if (search && search.trim()) {
      const keywordRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: keywordRegex },
        { content: keywordRegex },
        { tags: { $in: [keywordRegex] } }
      ];
    }

    // Lọc theo chuyên khoa (nếu có và khác 'Tất cả')
    if (specialty && specialty !== 'Tất cả') {
      query.$or = query.$or || [];
      query.specialtyName = specialty;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const discussions = await Discussion.find(query)
      .populate('authorId', 'fullName role avatar')
      .populate('comments.authorId', 'fullName role avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Discussion.countDocuments(query);

    // Xử lý dữ liệu trả về: che danh tính nếu người hỏi chọn ẩn danh
    const formattedDiscussions = discussions.map((doc) => {
      const item = doc.toObject();
      return {
        ...item,
        author: item.isAnonymous ? 'Người dùng ẩn danh' : (item.authorId?.fullName || 'Người dùng'),
        authorRole: item.isAnonymous ? 'patient' : (item.authorId?.role || 'patient'),
        authorAvatar: item.isAnonymous ? null : item.authorId?.avatar,
        likesCount: item.likes ? item.likes.length : 0,
        commentsCount: item.comments ? item.comments.length : 0
      };
    });

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      discussions: formattedDiscussions
    });
  } catch (error) {
    next(error);
  }
};

// 2. Lấy chi tiết 1 câu hỏi y khoa (tự động tăng views)
// @route   GET /api/discussions/:id
// @access  Public
exports.getDiscussionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id)
      .populate('authorId', 'fullName role avatar')
      .populate('comments.authorId', 'fullName role avatar');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi này hoặc câu hỏi đã bị gỡ bỏ.'
      });
    }

    // Tự động tăng lượt xem (view count)
    discussion.views = (discussion.views || 0) + 1;
    await discussion.save();

    const item = discussion.toObject();

    res.status(200).json({
      success: true,
      discussion: {
        ...item,
        author: item.isAnonymous ? 'Người dùng ẩn danh' : (item.authorId?.fullName || 'Người dùng'),
        authorRole: item.isAnonymous ? 'patient' : (item.authorId?.role || 'patient'),
        authorAvatar: item.isAnonymous ? null : item.authorId?.avatar,
        likesCount: item.likes ? item.likes.length : 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Đăng câu hỏi tư vấn y khoa mới
// @route   POST /api/discussions
// @access  Private (Yêu cầu đăng nhập - verifyToken)
exports.createDiscussion = async (req, res, next) => {
  try {
    const { title, content, specialty, specialtyId, tags, isAnonymous } = req.body;

    // Validation phía máy chủ
    if (!title || title.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Tiêu đề câu hỏi không được để trống và phải có ít nhất 6 ký tự.'
      });
    }

    if (!content || content.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung mô tả triệu chứng bệnh phải có ít nhất 15 ký tự để bác sĩ tư vấn.'
      });
    }

    // Tạo câu hỏi mới
    const newDiscussion = await Discussion.create({
      authorId: req.user.id,
      title: title.trim(),
      content: content.trim(),
      specialtyName: specialty || 'Đa khoa',
      specialtyId: specialtyId || null,
      tags: Array.isArray(tags) ? tags : [],
      isAnonymous: Boolean(isAnonymous)
    });

    const populatedDiscussion = await Discussion.findById(newDiscussion._id)
      .populate('authorId', 'fullName role avatar');

    const item = populatedDiscussion.toObject();

    // Trả về mã chuẩn RESTful 201 Created khi tạo mới tài nguyên thành công
    res.status(201).json({
      success: true,
      message: 'Gửi câu hỏi tư vấn y khoa thành công!',
      discussion: {
        ...item,
        author: item.isAnonymous ? 'Người dùng ẩn danh' : (item.authorId?.fullName || 'Người dùng'),
        authorRole: item.isAnonymous ? 'patient' : (item.authorId?.role || 'patient'),
        authorAvatar: item.isAnonymous ? null : item.authorId?.avatar,
        likesCount: 0,
        commentsCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Xóa câu hỏi (Chỉ tác giả câu hỏi hoặc Admin mới có quyền xóa)
// @route   DELETE /api/discussions/:id
// @access  Private (verifyToken)
exports.deleteDiscussion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi cần xóa.'
      });
    }

    // Kiểm tra quyền sở hữu (Ownership Authorization): Chỉ chủ bài viết hoặc Admin mới được xóa
    const isOwner = discussion.authorId.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa câu hỏi của người khác!'
      });
    }

    await Discussion.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Đã xóa câu hỏi thành công khỏi hệ thống.'
    });
  } catch (error) {
    next(error);
  }
};
