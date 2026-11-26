const Discussion = require('../models/Discussion');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const DoctorProfile = require('../models/DoctorProfile');
const Specialty = require('../models/Specialty');
const User = require('../models/User');

   
                                  
                                                          
                                                                                                        
                                                           
                                                                                                                              
   

                                                                 

                                                                                                            
                                
                  
exports.getDiscussions = async (req, res, next) => {
  try {
    const { search, specialty, page = 1, limit = 10 } = req.query;

    const query = {};

                                                                                                      
                                                                                          
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const keywordRegex = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu');
      query.$or = [
        { title: keywordRegex },
        { content: keywordRegex },
        { tags: { $in: [keywordRegex] } }
      ];
    }

                                                     
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

                                    
                                 
                                 
exports.createDiscussion = async (req, res, next) => {
  try {
    const { title, content, specialty, specialtyId, tags, isAnonymous } = req.body;

                              
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
                                      
      discussion.likes.splice(existingIndex, 1);
      isLiked = false;
    } else {
                                             
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

                                                                                   

                                                                                              
                                                
                                 
exports.getMyAppointments = async (req, res, next) => {
  try {
    const patientId = req.user.id;

                                                             
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'fullName avatar role')
      .populate({
        path: 'doctorProfileId',
        select: 'degree hospital specialtyId',
        populate: { path: 'specialtyId', select: 'name' }
      })
      .sort({ createdAt: -1 });

                                                                
    const patientReviews = await Review.find({ patientId }).select('appointmentId rating comment createdAt');
    const reviewedMap = new Map(patientReviews.map((r) => [r.appointmentId.toString(), r]));
    const records = await MedicalRecord.find({ patientId, appointmentId: { $in: appointments.map((app) => app._id) } })
      .select('appointmentId doctorId diagnosis');
    const recordsMap = new Map(records.map((record) => [record.appointmentId.toString(), record]));

                                         
    const formattedAppointments = appointments.map((app) => {
      const isReviewed = reviewedMap.has(app._id.toString());
      const reviewData = reviewedMap.get(app._id.toString()) || null;
      const record = recordsMap.get(app._id.toString());
      const hasMedicalRecord = Boolean(record && app.doctorId?._id && record.doctorId.toString() === app.doctorId._id.toString());

      return {
        id: app._id,
        doctorId: app.doctorId?._id || app.doctorId,
        doctorName: app.doctorId?.fullName || 'Bác sĩ MedCare',
        specialty: app.doctorProfileId?.specialtyId?.name || 'Đa khoa',
        date: app.date,
        timeSlot: app.timeSlot,
        status: app.status,
        diagnosis: hasMedicalRecord ? record.diagnosis : 'Chưa có bệnh án được lưu cho ca khám này.',
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

                                                                                         
                                         
                                 
exports.createReview = async (req, res, next) => {
  try {
    const { appointmentId, rating, comment } = req.body;

                                        
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

                                                                                              
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Ca khám hiện tại có trạng thái '${appointment.status}'. Chỉ những ca khám đã hoàn thành thực tế mới được phép đánh giá!`
      });
    }

    const record = await MedicalRecord.exists({ appointmentId: appointment._id, patientId: req.user.id, doctorId: appointment.doctorId });
    if (!record) {
      return res.status(400).json({ success: false, message: 'Ca khám chưa có bệnh án hợp lệ. Vui lòng liên hệ phòng khám.' });
    }

                                                                                                  
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'Ca khám này đã được đánh giá trước đó, mỗi lượt khám chỉ được đánh giá 1 lần!'
      });
    }

                                             
    const newReview = await Review.create({
      appointmentId,
      patientId: req.user.id,
      doctorId: appointment.doctorId,
      rating: numRating,
      comment: comment.trim()
    });

                                                                                         
    const doctorReviews = await Review.find({ doctorId: appointment.doctorId });
    const reviewCount = doctorReviews.length;
    const totalStars = doctorReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Number((totalStars / reviewCount).toFixed(1));

                                                                                                         
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
                                                                           
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Ca khám này đã được đánh giá trước đó (Xung đột dữ liệu)!'
      });
    }
    next(error);
  }
};

                                                            
                                        
                  
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
