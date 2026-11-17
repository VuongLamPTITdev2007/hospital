import React, { useState } from 'react';
import { CheckCircle, MessageSquare, Send, Star } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';

const QnAPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { data, loading, error, refetch } = useFetch('/discussions');
  const { data: appointmentData, refetch: reloadAppointments } = useFetch(user?.role === 'patient' ? '/appointments/my' : null);
  const discussions = data?.data || [];
  const appointments = (appointmentData?.data || []).filter((appointment) => appointment.status === 'completed');
  const [form, setForm] = useState({ title: '', content: '' });
  const [commentInputs, setCommentInputs] = useState({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [review, setReview] = useState({ appointmentId: '', rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const postDiscussion = async (event) => {
    event.preventDefault(); setSaving(true); setMessage('');
    try { await axiosClient.post('/discussions', form); setForm({ title: '', content: '' }); setMessage('Đã đăng câu hỏi.'); refetch(); } catch (requestError) { setMessage(requestError.message); } finally { setSaving(false); }
  };
  const postComment = async (id) => {
    const content = commentInputs[id]?.trim(); if (!content) return;
    setSaving(true); setMessage('');
    try { await axiosClient.post(`/discussions/${id}/comments`, { content }); setCommentInputs((current) => ({ ...current, [id]: '' })); refetch(); } catch (requestError) { setMessage(requestError.message); } finally { setSaving(false); }
  };
  const postReview = async () => {
    setSaving(true); setMessage('');
    try { await axiosClient.post('/reviews', review); setReviewOpen(false); setReview({ appointmentId: '', rating: 5, comment: '' }); setMessage('Cảm ơn bạn đã gửi đánh giá.'); reloadAppointments(); } catch (requestError) { setMessage(requestError.message); } finally { setSaving(false); }
  };

  if (loading) return <Loader text="Đang tải diễn đàn..." />;
  if (error) return <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error}</p><Button variant="outline" onClick={refetch}>Thử lại</Button></div>;
  return <div className="mx-auto max-w-4xl space-y-6">
    <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row dark:border-slate-700 dark:bg-slate-800"><div><span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">Cộng đồng MedCare</span><h1 className="mt-2 text-2xl font-bold">Hỏi đáp và đánh giá bác sĩ</h1><p className="mt-1 text-sm text-slate-500">Câu hỏi và phản hồi được lưu tập trung, chỉ lịch khám hoàn tất mới được đánh giá.</p></div>{user?.role === 'patient' && <Button variant="outline" size="sm" onClick={() => setReviewOpen(true)}><Star className="mr-1.5 h-4 w-4 text-amber-500" />Đánh giá sau khám</Button>}</section>
    {message && <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">{message}</div>}
    {isAuthenticated ? <form onSubmit={postDiscussion} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><h2 className="flex items-center text-sm font-bold"><MessageSquare className="mr-2 h-4 w-4 text-primary-600" />Đặt câu hỏi mới</h2><input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tiêu đề câu hỏi" className="w-full rounded-lg border p-2.5 dark:bg-slate-900" /><textarea required rows="3" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Mô tả triệu chứng hoặc vấn đề cần tư vấn" className="w-full rounded-lg border p-2.5 dark:bg-slate-900" /><div className="flex justify-end"><Button type="submit" size="sm" loading={saving}><Send className="mr-1.5 h-4 w-4" />Gửi câu hỏi</Button></div></form> : <p className="rounded-xl border border-dashed p-4 text-center text-sm text-slate-500">Đăng nhập để đặt câu hỏi hoặc phản hồi.</p>}
    <div className="space-y-4">{discussions.length ? discussions.map((discussion) => <article key={discussion._id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"><div><div className="mb-1 text-xs text-slate-400">Đăng bởi <strong>{discussion.authorId?.fullName || 'Người dùng'}</strong>{discussion.specialtyId?.name && ` · ${discussion.specialtyId.name}`}</div><h2 className="font-bold">{discussion.title}</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{discussion.content}</p></div>{discussion.comments.map((comment) => <div key={comment._id} className={`rounded-r-xl border-l-4 p-3 text-sm ${comment.isDoctorAnswer ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40' : 'border-slate-300 bg-slate-50 dark:bg-slate-900'}`}><div className="mb-1 flex items-center text-xs font-semibold">{comment.isDoctorAnswer && <CheckCircle className="mr-1 h-4 w-4 text-primary-600" />}{comment.authorId?.fullName || 'Người dùng'}{comment.isDoctorAnswer ? ' · Bác sĩ phản hồi' : ''}</div>{comment.content}</div>)}{isAuthenticated && <div className="flex gap-2"><input value={commentInputs[discussion._id] || ''} onChange={(event) => setCommentInputs((current) => ({ ...current, [discussion._id]: event.target.value }))} placeholder="Viết phản hồi..." className="min-w-0 flex-1 rounded-lg border p-2 text-sm dark:bg-slate-900" /><Button size="sm" disabled={saving} onClick={() => postComment(discussion._id)}>Gửi</Button></div>}</article>) : <p className="rounded-xl border border-dashed p-10 text-center text-slate-500">Chưa có câu hỏi nào.</p>}</div>
    <Modal isOpen={reviewOpen} onClose={() => setReviewOpen(false)} title="Đánh giá buổi khám"><div className="space-y-4"><select required value={review.appointmentId} onChange={(event) => setReview((current) => ({ ...current, appointmentId: event.target.value }))} className="w-full rounded-lg border p-2"><option value="">Chọn lịch khám đã hoàn tất</option>{appointments.map((appointment) => <option key={appointment._id} value={appointment._id}>{appointment.date} · {appointment.timeSlot}</option>)}</select><div className="flex justify-center gap-2">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setReview((current) => ({ ...current, rating: star }))}><Star className={`h-8 w-8 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}</div><textarea required rows="3" value={review.comment} onChange={(event) => setReview((current) => ({ ...current, comment: event.target.value }))} placeholder="Nhận xét của bạn" className="w-full rounded-lg border p-2" /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setReviewOpen(false)}>Hủy</Button><Button disabled={!review.appointmentId || !review.comment.trim()} loading={saving} onClick={postReview}>Gửi đánh giá</Button></div></div></Modal>
  </div>;
};

export default QnAPage;
