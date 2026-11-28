import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, AlertCircle, CalendarCheck2, ChevronDown } from 'lucide-react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import StarRating from './StarRating';

// Định dạng ngày khám hiển thị gọn trong dropdown
const formatAppointmentDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('vi-VN');
};

/**
 * Component: ReviewModal
 * Form đánh giá chất lượng ca khám 1-5 sao và nhận xét phản hồi bác sĩ
 * - Nếu nhận prop `doctor`: Hiển thị cố định thông tin bác sĩ và mã ca khám đó.
 * - Nếu không có prop `doctor`: Hiển thị dropdown chọn từ danh sách ca khám thực tế đủ điều kiện (`reviewableAppointments`).
 * - Validation: Bắt buộc có ca khám hợp lệ, số sao từ 1-5, nhận xét tối thiểu 10 ký tự.
 */
const ReviewModal = ({
  isOpen,
  onClose,
  onSubmitReview,
  doctor = null,
  appointmentId = null,
  reviewableAppointments = [],
  onGoToHistory
}) => {
  const [selectedAppointmentOptionId, setSelectedAppointmentOptionId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Xác định xem bác sĩ có được truyền cố định từ prop hay không
  const isFixedDoctor = Boolean(doctor && (doctor.name || doctor.doctorName));
  const fixedDoctorName = doctor ? (doctor.name || doctor.doctorName) : '';
  const fixedDoctorSpecialty = doctor ? (doctor.specialty || 'Chuyên khoa') : '';

  // Khởi tạo lại trạng thái form mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (isFixedDoctor) {
        setSelectedAppointmentOptionId(String(appointmentId || doctor?.appointmentId || ''));
      } else if (reviewableAppointments.length === 1) {
        setSelectedAppointmentOptionId(String(reviewableAppointments[0].id));
      } else {
        setSelectedAppointmentOptionId('');
      }
      setComment('');
      setRating(5);
      setError('');
      setIsSuccess(false);
    }
  }, [isOpen, doctor, isFixedDoctor, appointmentId, reviewableAppointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Kiểm tra hợp lệ ca khám & bác sĩ
    let targetAppointmentId = appointmentId || doctor?.appointmentId;
    let activeDoctor = null;

    if (isFixedDoctor) {
      activeDoctor = {
        id: doctor.id || doctor._id || 'fixed_doc',
        name: fixedDoctorName,
        specialty: fixedDoctorSpecialty
      };
    } else {
      if (!selectedAppointmentOptionId) {
        setError('Vui lòng chọn ca khám bạn muốn đánh giá từ danh sách.');
        return;
      }
      const matchedApp = reviewableAppointments.find(
        (app) => String(app.id) === String(selectedAppointmentOptionId)
      );
      if (!matchedApp) {
        setError('Ca khám đã chọn không hợp lệ, vui lòng chọn lại.');
        return;
      }
      targetAppointmentId = matchedApp.id;
      activeDoctor = {
        id: matchedApp.doctorId,
        name: matchedApp.doctorName,
        specialty: matchedApp.specialty || 'Đa khoa'
      };
    }

    if (!targetAppointmentId) {
      setError('Không tìm thấy mã ca khám hợp lệ để gửi đánh giá.');
      return;
    }

    // 2. Kiểm tra hợp lệ số sao
    if (!rating || rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao đánh giá từ 1 đến 5.');
      return;
    }

    // 3. Kiểm tra nhận xét tối thiểu 10 ký tự
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError('Vui lòng nhập nhận xét về buổi khám.');
      return;
    }

    if (trimmedComment.length < 10) {
      setError('Nhận xét quá ngắn (tối thiểu 10 ký tự) để gửi đánh giá.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const reviewPayload = {
        appointmentId: targetAppointmentId,
        doctorId: activeDoctor.id,
        doctorName: activeDoctor.name,
        specialty: activeDoctor.specialty,
        rating,
        comment: trimmedComment
      };

      await onSubmitReview(reviewPayload);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        setRating(5);
        if (!isFixedDoctor) setSelectedAppointmentOptionId('');
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Phản hồi của bạn đã được ghi nhận và cập nhật vào điểm số uy tín của Bác sĩ trên MongoDB.
          </p>
        </div>
      ) : !isFixedDoctor && reviewableAppointments.length === 0 ? (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Bạn chưa có ca khám nào đủ điều kiện đánh giá
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Hệ thống chỉ cho phép đánh giá các ca khám đã hoàn tất, đã có hồ sơ bệnh án từ bác sĩ và chưa từng được đánh giá trước đó.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Đóng
            </Button>
            {onGoToHistory && (
              <Button variant="primary" size="sm" type="button" onClick={onGoToHistory}>
                Xem lịch sử khám của tôi
              </Button>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thông tin bác sĩ: Cố định nếu có prop doctor, Dropdown ca khám thực tế nếu không có */}
          {isFixedDoctor ? (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-400">Bác sĩ phụ trách ca khám:</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{fixedDoctorName}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  Khoa: {fixedDoctorSpecialty}
                </p>
              </div>
              <div className="p-2.5 bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 rounded-lg">
                <Star className="w-5 h-5 fill-primary-600 text-primary-600" />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Chọn ca khám & bác sĩ bạn muốn đánh giá <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={selectedAppointmentOptionId}
                  onChange={(e) => {
                    setSelectedAppointmentOptionId(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors cursor-pointer"
                >
                  <option value="">-- Vui lòng chọn ca khám đã hoàn thành --</option>
                  {reviewableAppointments.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.doctorName} – Khoa {app.specialty} ({formatAppointmentDate(app.date)}
                      {app.timeSlot ? ` • ${app.timeSlot}` : ''})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400 dark:text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Chỉ hiển thị các ca khám đã hoàn tất và có hồ sơ bệnh án hợp lệ của bạn.
              </p>
            </div>
          )}

          {/* Quy chuẩn chống spam */}
          <div className="flex items-start space-x-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Quy chuẩn xác thực: Hệ thống chỉ ghi nhận đánh giá từ những ca khám đã hoàn tất thực tế tại MedCare.
            </span>
          </div>

          {/* Thông báo lỗi Validation */}
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-center text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Chọn số sao tương tác */}
          <div className="space-y-1.5 text-center flex flex-col items-center py-2">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Mức độ hài lòng của bạn:
            </label>
            <StarRating
              rating={rating}
              interactive={true}
              size="lg"
              showLabel={true}
              onChange={(newRating) => {
                setRating(newRating);
                if (error) setError('');
              }}
            />
          </div>

          {/* Nhận xét chi tiết */}
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
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Đã nhập: {comment.length} ký tự (tối thiểu 10 ký tự)</span>
              {comment.trim().length >= 10 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Đạt độ dài</span>
              )}
            </div>
          </div>

          {/* Nút hành động */}
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
