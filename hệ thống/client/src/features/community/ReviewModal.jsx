import React, { useState } from 'react';
import { Star, ShieldCheck, AlertCircle } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import StarRating from './StarRating';

/**
 * Component: ReviewModal
 * Form đánh giá chất lượng ca khám 1-5 sao và nhận xét phản hồi bác sĩ
 * Chứa nghiệp vụ chống spam: yêu cầu kiểm tra lượt khám hợp lệ
 */
const ReviewModal = ({
  isOpen,
  onClose,
  onSubmitReview,
  doctorName = 'BSCKII. Lê Văn Hùng',
  specialty = 'Thần kinh',
  appointmentId = 'mock_appointment_123'
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao từ 1 đến 5.');
      return;
    }

    if (!comment.trim()) {
      setError('Vui lòng nhập nhận xét về buổi khám.');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Nhận xét quá ngắn (tối thiểu 10 ký tự) để ban quản trị duyệt.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const reviewPayload = {
        appointmentId,
        rating,
        comment: comment.trim()
      };

      await onSubmitReview(reviewPayload);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        setRating(5);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Gửi đánh giá thất bại. Vui lòng kiểm tra lại trạng thái ca khám.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đánh Giá Chất Lượng Bác Sĩ Sau Ca Khám"
      maxWidth="max-w-md"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Cảm ơn bạn đã đóng góp đánh giá!
          </h4>
          <p className="text-xs text-slate-500">
            Phản hồi của bạn đã được ghi nhận và cập nhật vào điểm số uy tín của Bác sĩ.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thông tin bác sĩ được đánh giá */}
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Bác sĩ phụ trách khám:</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{doctorName}</p>
              <p className="text-xs text-primary-600 dark:text-primary-400">Khoa: {specialty}</p>
            </div>
            <div className="p-2 bg-primary-100 dark:bg-primary-950 text-primary-700 rounded-lg">
              <Star className="w-5 h-5 fill-primary-600 text-primary-600" />
            </div>
          </div>

          {/* Quy chuẩn chống spam */}
          <div className="flex items-start space-x-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Quy chuẩn xác thực: Hệ thống chỉ ghi nhận đánh giá từ những bệnh nhân đã hoàn tất ca khám thực tế tại MedCare.
            </span>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn số sao */}
          <div className="space-y-1.5 text-center flex flex-col items-center py-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Mức độ hài lòng của bạn:
            </label>
            <StarRating
              rating={rating}
              interactive={true}
              size="lg"
              showLabel={true}
              onChange={(newRating) => setRating(newRating)}
            />
          </div>

          {/* Nhận xét */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Nhận xét chi tiết về chuyên môn & thái độ <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="VD: Bác sĩ tư vấn rất kỹ lưỡng, giải thích đơn thuốc rõ ràng, phòng khám sạch sẽ..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-[11px] text-slate-400">
              Đã nhập: {comment.length} ký tự (tối thiểu 10 ký tự)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Đóng
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
              Gửi Đánh Giá Xác Thực
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ReviewModal;
