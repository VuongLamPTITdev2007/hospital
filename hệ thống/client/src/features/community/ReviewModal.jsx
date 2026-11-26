import React, { useEffect, useState } from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import StarRating from './StarRating';

const ReviewModal = ({ isOpen, onClose, onSubmitReview, doctor, appointmentId }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) { setRating(5); setComment(''); setError(''); }
  }, [isOpen, appointmentId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!appointmentId) { setError('Vui lòng chọn ca khám trong lịch sử khám.'); return; }
    if (comment.trim().length < 10) { setError('Nhận xét cần ít nhất 10 ký tự.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmitReview({ appointmentId, rating, comment: comment.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể gửi đánh giá.');
    } finally {
      setSubmitting(false);
    }
  };

  return <Modal isOpen={isOpen} onClose={onClose} title="Đánh giá bác sĩ sau ca khám" maxWidth="max-w-md">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700">
        <p className="text-sm font-bold">{doctor?.name || 'Bác sĩ'}</p>
        <p className="text-sm">{doctor?.specialty}</p>
      </div>
      <p className="text-sm">Đánh giá gắn với ca khám bạn đã hoàn tất và có bệnh án.</p>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-center"><StarRating rating={rating} interactive size="lg" showLabel onChange={setRating} /></div>
      <label className="block text-sm" htmlFor="review-comment">Nhận xét (tối thiểu 10 ký tự)</label>
      <textarea id="review-comment" className="w-full rounded border p-2 dark:bg-slate-900" rows={3} value={comment} onChange={(event) => setComment(event.target.value)} />
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Đóng</Button><Button type="submit" loading={submitting} disabled={submitting}>Gửi đánh giá</Button></div>
    </form>
  </Modal>;
};

export default ReviewModal;
