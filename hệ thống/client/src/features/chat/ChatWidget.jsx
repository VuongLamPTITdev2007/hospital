import React, { useEffect, useState } from 'react';
import { MessageCircle, Send, X, QrCode } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [booking, setBooking] = useState(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!booking) return undefined;
    const tick = () => setRemaining(Math.max(0, Math.ceil((new Date(booking.holdingExpiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [booking]);

  const cancel = async () => {
    if (!booking) return;
    try { await axiosClient.patch(`/appointments/${booking.appointmentId}`, { action: 'cancel' }); } catch (requestError) { setError(requestError.message); }
    setBooking(null);
  };

  useEffect(() => {
    if (booking && remaining === 0) cancel();
    // Countdown uses a server timestamp; cancel is only needed on expiry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const send = async (text = input) => {
    const content = text.trim();
    if (!content || busy || booking) return;
    const history = messages.map(({ role, content: body }) => ({ role, content: body }));
    setMessages((current) => [...current, { role: 'user', content }]);
    setInput(''); setError(''); setBusy(true);
    try {
      const response = await axiosClient.post('/chat/messages', { message: content, history });
      setMessages((current) => [...current, { role: 'assistant', content: response.data.reply, choices: response.data.choices || [] }]);
      if (response.data.booking) setBooking(response.data.booking);
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };

  const selectSlot = async (choice) => {
    if (busy || booking) return;
    if (!user?.phone) { setError('Tài khoản chưa có số điện thoại. Vui lòng cập nhật thông tin trước khi đặt lịch.'); return; }
    setBusy(true); setError('');
    try {
      const doctor = await axiosClient.get(`/doctors/${choice.doctorId}`);
      const response = await axiosClient.post('/appointments', {
        doctorId: choice.doctorId,
        date: choice.date,
        timeSlot: choice.timeSlot,
        patientName: user.fullName,
        patientPhone: user.phone,
        symptomsNote: ''
      });
      setMessages((current) => [...current, { role: 'user', content: `Tôi chọn ${choice.date}, ${choice.timeSlot}.` }, { role: 'assistant', content: 'Đã giữ chỗ trong 5 phút. Vui lòng xem thông tin cọc.' }]);
      setBooking({ appointmentId: response.data._id, doctorId: choice.doctorId, doctorName: doctor.data.fullName, date: choice.date, timeSlot: choice.timeSlot, depositAmount: response.data.depositAmount, holdingExpiresAt: response.data.holdingExpiresAt });
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true); setError('');
    try {
      const response = await axiosClient.patch(`/appointments/${booking.appointmentId}`, { action: 'confirm' });
      setBooking(null);
      setMessages((current) => [...current, { role: 'assistant', content: `Đặt lịch thành công: ${response.data.date}, ${response.data.timeSlot}. Mã lịch: ${response.data._id}.` }]);
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };

  if (user?.role !== 'patient') return null;
  return <>
    <button type="button" onClick={() => setOpen((current) => !current)} aria-label={open ? 'Đóng trợ lý đặt lịch' : 'Mở trợ lý đặt lịch'} className="fixed bottom-5 right-5 z-40 rounded-full bg-primary-600 p-4 text-white shadow-lg"><MessageCircle className="h-6 w-6" /></button>
    {open && <section aria-label="Trợ lý đặt lịch" className="fixed bottom-24 right-4 z-40 flex h-[min(70vh,550px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800">
      <header className="flex items-center justify-between border-b p-4"><div><strong>Trợ lý MedCare</strong><p className="text-xs text-slate-500">Hỏi lịch trống, chọn bác sĩ và giữ chỗ</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Đóng"><X className="h-5 w-5" /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">{messages.length === 0 && <p className="rounded-xl bg-primary-50 p-3 text-sm">Chào bạn! Hãy hỏi “Khám tim ngày mai còn lịch nào?”</p>}{messages.map((item, index) => <div key={index} className={`rounded-xl p-3 text-sm ${item.role === 'user' ? 'ml-7 bg-primary-600 text-white' : 'mr-7 bg-slate-100 dark:bg-slate-700'}`}><p className="whitespace-pre-wrap">{item.content}</p>{item.choices?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{item.choices.map((choice) => <button key={`${choice.doctorId}-${choice.date}-${choice.timeSlot}`} type="button" disabled={busy || !!booking} onClick={() => selectSlot(choice)} className="rounded-lg border border-primary-500 px-2 py-1 text-xs text-primary-700 disabled:opacity-50 dark:text-primary-300">{choice.date} · {choice.timeSlot}</button>)}</div>}</div>)}{busy && <p className="text-sm text-slate-500">Đang xử lý...</p>}{error && <p role="alert" className="text-sm text-red-600">{error} <button type="button" onClick={() => { setError(''); setInput(messages.at(-1)?.role === 'user' ? messages.at(-1).content : input); }} className="underline">Thử lại</button></p>}</div>
      <form onSubmit={(event) => { event.preventDefault(); send(); }} className="flex gap-2 border-t p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} placeholder="Nhập yêu cầu đặt lịch..." aria-label="Tin nhắn" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-slate-900" /><button type="submit" disabled={busy || !!booking} aria-label="Gửi tin nhắn" className="rounded-lg bg-primary-600 p-2 text-white disabled:opacity-50"><Send className="h-5 w-5" /></button></form>
    </section>}
    <Modal isOpen={!!booking} onClose={cancel} title="Xác nhận giữ chỗ & thanh toán cọc"><div className="space-y-4 text-sm"><div className="flex justify-between rounded-xl bg-amber-50 p-4"><span>Thời gian giữ slot còn lại</span><strong className="text-red-600">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</strong></div><div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900"><p>Bác sĩ: <strong>{booking?.doctorName}</strong></p><p>Thời gian: <strong>{booking?.date}, {booking?.timeSlot}</strong></p><p>Tiền cọc: <strong>{Number(booking?.depositAmount || 0).toLocaleString('vi-VN')} đ</strong></p></div><div className="rounded-xl border border-dashed p-5 text-center"><QrCode className="mx-auto h-12 w-12" /><p>VietQR giữ chỗ — môi trường demo</p></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={cancel}>Hủy</Button><Button disabled={remaining === 0 || busy} onClick={confirm}>Xác nhận đã chuyển khoản</Button></div>{error && <p role="alert" className="text-red-600">{error}</p>}</div></Modal>
  </>;
};

export default ChatWidget;
