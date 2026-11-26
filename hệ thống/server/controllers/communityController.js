const Discussion = require('../models/Discussion');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const DoctorProfile = require('../models/DoctorProfile');
const Specialty = require('../models/Specialty');
const User = require('../models/User');

/**
 * Controller: communityController
 * Phân hệ TV 5: Diễn đàn Hỏi - Đáp Y tế & Đánh giá Bác sĩ
 * Phần 1: CRUD Câu hỏi Diễn đàn (getDiscussions, getDiscussionById, createDiscussion, deleteDiscussion)
 * Phần 2: Bình luận & Toggle Like (addComment, toggleLike)
 * Phần 3: Đánh giá Bác sĩ chống spam 3 lớp & Lịch sử khám (getMyAppointments, createReview, getReviews, getDoctorReviewsById)
 */

// ==================== PHẦN 1: CRUD CÂU HỎI ====================

// 1. Lấy danh sách câu hỏi cộng đồng (hỗ trợ lọc chuyên khoa, tìm kiếm ranh giới từ tiếng Việt, phân trang)
// @route   GET /api/discussions
// @access  Public
exports.getDiscussions = async (req, res, next) => {
  try {
    const { search, specialty, page = 1, limit = 10 } = req.query;

    const query = {};

    // Tìm kiếm từ khóa theo ranh giới từ tiếng Việt: (?<![\p{L}\p{N}])...(?![\p{L}\p{N}]) với cờ 'iu'
    // Đảm bảo tìm 'ho' chỉ khớp từ 'ho' độc lập, không khớp nhầm vào 'cho', 'không', v.v.
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const keywordRegex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu');
      query.$or = [
        { title: keywordRegex },
        { content: keywordRegex },
        { tags: { $in: [keywordRegex] } }
      ];
    }

    // Lọc theo chuyên khoa (nếu có và khác 'Tất cả')
    if (specialty && specialty !== 'Tất cả') {
      query.specialtyName = specialty;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [discussions, total] = await Promise.all([
      Discussion.find(query)
        .populate('authorId', 'fullName role avatar')
        .populate('comments.authorId', 'fullName role avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Discussion.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

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
      page: pageNum,
      limit: limitNum,
      totalPages,
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
// @access  Private (verifyToken)
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

// ==================== PHẦN 2: BÌNH LUẬN & LIKE ====================

// 5. Bình luận / Trả lời câu hỏi (Tự động nhận diện Bác sĩ trả lời)
// @route   POST /api/discussions/:id/comments
// @access  Private (verifyToken)
exports.addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung phản hồi/bình luận.'
      });
    }

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi để phản hồi.'
      });
    }

    // Nghiệp vụ quan trọng: Nhận diện phản hồi chuyên môn từ Bác sĩ
    const isDoctorAnswer = req.user.role === 'doctor';

    const newComment = {
      authorId: req.user.id,
      content: content.trim(),
      isDoctorAnswer
    };

    discussion.comments.push(newComment);
    await discussion.save();

    const updatedDiscussion = await Discussion.findById(id)
      .populate('comments.authorId', 'fullName role avatar');

    const addedComment = updatedDiscussion.comments[updatedDiscussion.comments.length - 1];

    res.status(201).json({
      success: true,
      message: isDoctorAnswer
        ? 'Bác sĩ đã gửi tư vấn chuyên môn thành công!'
        : 'Đã gửi bình luận trao đổi thành công!',
      comment: {
        _id: addedComment._id,
        content: addedComment.content,
        isDoctorAnswer: addedComment.isDoctorAnswer,
        authorName: addedComment.authorId?.fullName || req.user.fullName || 'Người dùng',
        authorRole: addedComment.authorId?.role || req.user.role || 'patient',
        authorAvatar: addedComment.authorId?.avatar,
        createdAt: addedComment.createdAt
      },
      totalComments: updatedDiscussion.comments.length
    });
  } catch (error) {
    next(error);
  }
};

// 6. Thích / Bỏ thích câu hỏi (Toggle Like - Chống like spam nhiều lần)
// @route   PATCH /api/discussions/:id/like
// @access  Private (verifyToken)
exports.toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi này.'
      });
    }

    discussion.likes = discussion.likes || [];
    const userIdStr = req.user.id.toString();

    const existingIndex = discussion.likes.findIndex(
      (likeId) => likeId.toString() === userIdStr
    );

    let isLiked = false;
    if (existingIndex > -1) {
      // Đã thích -> Bỏ thích (Unlike)
      discussion.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
      // Chưa thích -> Thêm lượt thích (Like)
      discussion.likes.push(req.user.id);
      isLiked = true;
    }

    await discussion.save();

    res.status(200).json({
      success: true,
      isLiked,
      likesCount: discussion.likes.length,
      message: isLiked ? 'Đã thích câu hỏi này.' : 'Đã bỏ thích câu hỏi này.'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== PHẦN 3: ĐÁNH GIÁ BÁC SĨ & LỊCH SỬ KHÁM ====================

// 7. Lấy danh sách ca khám của bệnh nhân đang đăng nhập (kèm trạng thái đã đánh giá hay chưa)
// @route   GET /api/discussions/my-appointments
// @access  Private (verifyToken)
exports.getMyAppointments = async (req, res, next) => {
  try {
    const patientId = req.user.id;

    // Tìm tất cả ca khám của bệnh nhân, nạp thông tin bác sĩ
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'fullName avatar role')
      .populate({
        path: 'doctorProfileId',
        select: 'degree hospital specialtyId',
        populate: { path: 'specialtyId', select: 'name' }
      })
      .sort({ createdAt: -1 });

    // Lấy danh sách tất cả các đánh giá và hồ sơ bệnh án của bệnh nhân này
    const patientReviews = await Review.find({ patientId }).select('appointmentId rating comment createdAt');
    const reviewedMap = new Map(patientReviews.map((r) => [r.appointmentId.toString(), r]));
    const records = await MedicalRecord.find({
      patientId,
      appointmentId: { $in: appointments.map((app) => app._id) }
    }).select('appointmentId doctorId diagnosis');
    const recordsMap = new Map(records.map((record) => [record.appointmentId.toString(), record]));

    // Format kết quả trả về cho frontend
    const formattedAppointments = appointments.map((app) => {
      const isReviewed = reviewedMap.has(app._id.toString());
      const reviewData = reviewedMap.get(app._id.toString()) || null;
      const record = recordsMap.get(app._id.toString());
      const hasMedicalRecord = Boolean(
        record && app.doctorId?._id && record.doctorId.toString() === app.doctorId._id.toString()
      );

      return {
        id: app._id,
        doctorId: app.doctorId?._id || app.doctorId,
        doctorName: app.doctorId?.fullName || 'Bác sĩ MedCare',
        specialty: app.doctorProfileId?.specialtyId?.name || 'Đa khoa',
        date: app.date,
        timeSlot: app.timeSlot,
        status: app.status,
        diagnosis: hasMedicalRecord ? record.diagnosis : (app.symptomsNote || 'Chưa có bệnh án được lưu cho ca khám này.'),
        hasMedicalRecord,
        canReview: app.status === 'completed' && hasMedicalRecord && !isReviewed,
        fee: app.fee,
        isReviewed,
        review: reviewData
          ? {
              rating: reviewData.rating,
              comment: reviewData.comment,
              createdAt: reviewData.createdAt
            }
          : null
      };
    });

    res.status(200).json({
      success: true,
      count: formattedAppointments.length,
      appointments: formattedAppointments
    });
  } catch (error) {
    next(error);
  }
};

// 8. Đánh giá Bác sĩ sau buổi khám (Hệ thống chống spam 3 lớp & Tính lại điểm số bác sĩ)
// @route   POST /api/discussions/reviews
// @access  Private (verifyToken)
exports.createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    // Validation cơ bản dữ liệu đầu vào
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã ca khám (appointmentId).'
      });
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Số sao đánh giá phải từ 1 đến 5 sao.'
      });
    }

    if (typeof comment !== 'string' || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Nhận xét phải có ít nhất 10 ký tự để đảm bảo chất lượng phản hồi.'
      });
    }

    // ========== CHỐNG SPAM LỚP 1: Kiểm tra ca khám tồn tại & thuộc về bệnh nhân gửi request ==========
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy ca khám này trong hệ thống.'
      });
    }

    if (appointment.patientId.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đánh giá ca khám của bệnh nhân khác!'
      });
    }

    // ========== CHỐNG SPAM LỚP 2: Bắt buộc trạng thái ca khám phải là 'completed' và đã có bệnh án ==========
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Ca khám hiện tại có trạng thái '${appointment.status}'. Chỉ những ca khám đã hoàn thành thực tế mới được phép đánh giá!`
      });
    }

    const hasRecord = await MedicalRecord.exists({
      appointmentId: appointment._id,
      patientId: req.user.id,
      doctorId: appointment.doctorId
    });
    if (!hasRecord) {
      return res.status(400).json({
        success: false,
        message: 'Ca khám chưa có hồ sơ bệnh án hợp lệ để đánh giá.'
      });
    }

    // ========== CHỐNG SPAM LỚP 3: Chống trùng lặp (1 ca khám chỉ được đánh giá 1 lần) ==========
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'Ca khám này đã được đánh giá trước đó, mỗi lượt khám chỉ được đánh giá 1 lần!'
      });
    }

    // Lưu đánh giá mới vào collection Review
    const newReview = await Review.create({
      appointmentId,
      patientId: req.user.id,
      doctorId: appointment.doctorId,
      rating: numRating,
      comment: comment.trim()
    });

    // ========== THUẬT TOÁN: Tự động tính toán lại điểm trung bình cho Bác sĩ ==========
    const doctorReviews = await Review.find({ doctorId: appointment.doctorId });
    const reviewCount = doctorReviews.length;
    const totalStars = doctorReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Number((totalStars / reviewCount).toFixed(1));

    // Khớp đúng trường tham chiếu: Cập nhật vào DoctorProfile qua doctorProfileId hoặc userId (doctorId)
    const profileFilter = appointment.doctorProfileId
      ? { _id: appointment.doctorProfileId }
      : { userId: appointment.doctorId };

    await DoctorProfile.findOneAndUpdate(
      profileFilter,
      { averageRating, reviewCount },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: 'Gửi đánh giá ca khám thành công!',
      review: newReview,
      doctorStats: {
        doctorId: appointment.doctorId,
        averageRating,
        reviewCount
      }
    });
  } catch (error) {
    // Bắt thêm lỗi trùng lặp từ MongoDB Unique Index nếu có race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Ca khám này đã được đánh giá trước đó (Xung đột dữ liệu)!'
      });
    }
    next(error);
  }
};

// 9. Lấy danh sách tất cả đánh giá công khai của phòng khám
// @route   GET /api/discussions/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const { doctorId, rating } = req.query;

    const query = {};
    if (doctorId) query.doctorId = doctorId;
    if (rating && rating !== 'ALL') query.rating = Number(rating);

    const reviews = await Review.find(query)
      .populate('patientId', 'fullName avatar')
      .populate('doctorId', 'fullName avatar')
      .populate({
        path: 'appointmentId',
        select: 'date timeSlot doctorProfileId',
        populate: {
          path: 'doctorProfileId',
          select: 'degree hospital specialtyId',
          populate: { path: 'specialtyId', select: 'name' }
        }
      })
      .sort({ createdAt: -1 });

    const formattedReviews = reviews.map((r) => ({
      id: r._id,
      appointmentId: r.appointmentId?._id || r.appointmentId,
      patientName: r.patientId?.fullName || 'Bệnh nhân MedCare',
      patientAvatar: r.patientId?.avatar,
      doctorId: r.doctorId?._id || r.doctorId,
      doctorName: r.doctorId?.fullName || 'Bác sĩ MedCare',
      specialty: r.appointmentId?.doctorProfileId?.specialtyId?.name || 'Đa khoa',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt ? r.createdAt.toISOString().split('T')[0] : 'Vừa xong',
      verified: true
    }));

    res.status(200).json({
      success: true,
      count: formattedReviews.length,
      reviews: formattedReviews
    });
  } catch (error) {
    next(error);
  }
};

// 10. Lấy danh sách đánh giá riêng của 1 bác sĩ cụ thể
// @route   GET /api/discussions/reviews/doctor/:doctorId
// @access  Public
exports.getDoctorReviewsById = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const reviews = await Review.find({ doctorId })
      .populate('patientId', 'fullName avatar')
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = count > 0 ? Number((totalStars / count).toFixed(1)) : 5.0;

    res.status(200).json({
      success: true,
      doctorId,
      averageRating,
      reviewCount: count,
      reviews
    });
  } catch (error) {
    next(error);
  }
};
