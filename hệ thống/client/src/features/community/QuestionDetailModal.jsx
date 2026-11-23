import React, { useState } from 'react';
import { Send, UserCircle, MessageSquare, AlertCircle, ShieldAlert } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import DoctorAnswerBadge from './DoctorAnswerBadge';

/**
 * Component: QuestionDetailModal
 * Xem toàn bộ chi tiết câu hỏi y tế, danh sách bình luận thảo luận và gửi phản hồi mới
 */
const QuestionDetailModal = ({
  isOpen,
  onClose,
  question,
  onAddComment,
  currentUser
}) => {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!question) return null;

  // Lấy chính xác mã định danh MongoDB (_id hoặc id)
  const questionId = question._id || question.id;

  const {
    author = 'Người dùng ẩn danh',
    title,
    content,
    specialtyName,
    specialty = specialtyName || 'Đa khoa',
    tags = [],
    doctorAnswer,
    comments = [],
    views = 0,
    createdAt
  } = question;

  const isDoctor = currentUser?.role === 'doctor';

  // Định dạng ngày giờ chuẩn tiếng Việt
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  // Nhận diện phản hồi của bác sĩ (từ doctorAnswer hoặc từ danh sách comments có c.isDoctorAnswer = true)
  const doctorComment = doctorAnswer || comments.find((c) => c.isDoctorAnswer);
  const formattedDoctorAnswer = doctorComment
    ? {
        doctorName:
          doctorComment.authorName ||
          doctorComment.authorId?.fullName ||
          doctorComment.doctorName ||
          'Bác sĩ chuyên khoa',
        specialty: doctorComment.specialty || specialtyName || specialty || 'Đa khoa',
        answer: doctorComment.content || doctorComment.answer,
        date: doctorComment.createdAt
          ? new Date(doctorComment.createdAt).toLocaleDateString('vi-VN')
          : doctorComment.date || 'Gần đây'
      }
    : null;

  const handleSendComment = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('Vui lòng đăng nhập để gửi phản hồi hoặc tư vấn cho câu hỏi này.');
      return;
    }

    if (!commentText.trim()) {
      setError('Vui lòng nhập nội dung phản hồi.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        questionId,
        content: commentText.trim(),
        isDoctorAnswer: isDoctor
      };

      await onAddComment(payload);
      setCommentText('');
    } catch (err) {
      setError(err.message || 'Không thể gửi bình luận, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi Tiết Thảo Luận Sức Khỏe"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Header thông tin người hỏi */}
        <div className="space-y-2 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <UserCircle className="w-5 h-5 text-slate-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {author}
              </span>
              {formattedDate && <span>• {formattedDate}</span>}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              Khoa {specialty}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl">
            {content}
          </p>
        </div>

        {/* Phản hồi chính thức của Bác sĩ nếu có */}
        {formattedDoctorAnswer && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
              Phản hồi chính thức từ Chuyên gia
            </h4>
            <DoctorAnswerBadge
              doctorName={formattedDoctorAnswer.doctorName}
              specialty={formattedDoctorAnswer.specialty}
              answer={formattedDoctorAnswer.answer}
              date={formattedDoctorAnswer.date}
            />
          </div>
        )}

        {/* Danh sách các trao đổi khác */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Các ý kiến trao đổi ({comments.length})
          </h4>

          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Chưa có bình luận nào khác. Hãy là người đầu tiên trao đổi!
            </p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {comments.map((cmt, idx) => (
                <div
                  key={cmt._id || idx}
                  className={`p-3 rounded-xl border text-xs sm:text-sm ${
                    cmt.isDoctorAnswer
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center">
                      {cmt.authorName || cmt.authorId?.fullName || (cmt.isDoctorAnswer ? 'Bác sĩ chuyên khoa' : 'Thành viên')}
                      {cmt.isDoctorAnswer && (
                        <span className="ml-1.5 px-1.5 py-0.2 bg-primary-100 text-primary-700 rounded text-[10px] font-bold">
                          Bác sĩ
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {cmt.createdAt ? new Date(cmt.createdAt).toLocaleString('vi-VN') : (cmt.time || 'Vừa xong')}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{cmt.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form nhập bình luận */}
        <form onSubmit={handleSendComment} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
          {error && (
            <div className="p-2 bg-red-50 text-red-600 rounded-lg text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}

          {isDoctor && (
            <div className="flex items-center space-x-1.5 text-xs text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-950/40 p-2 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
              <span>Bạn đang đăng nhập với vai trò Bác sĩ. Phản hồi của bạn sẽ được gắn huy hiệu xác thực.</span>
            </div>
          )}

          {!currentUser ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 rounded-xl text-xs flex items-center justify-between">
              <span>Vui lòng đăng nhập để gửi phản hồi hoặc trả lời câu hỏi này.</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (error) setError('');
                }}
                placeholder={isDoctor ? 'Nhập lời khuyên chuyên môn gửi bệnh nhân...' : 'Nhập câu hỏi phụ hoặc chia sẻ kinh nghiệm...'}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button type="submit" variant="primary" size="sm" loading={isSubmitting} className="self-end px-4">
                <Send className="w-4 h-4 mr-1" /> Gửi
              </Button>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default QuestionDetailModal;
