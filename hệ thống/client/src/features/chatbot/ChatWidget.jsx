import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { selectDoctor, selectDate, selectSlot, setPatientInfo, setHoldingInfo, setStep } from '../../store/slices/bookingSlice';

const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retryText, setRetryText] = useState('');
  const [holds, setHolds] = useState([]);
  const [holdsLoaded, setHoldsLoaded] = useState(false);
  useEffect(() => { setMessages([]); setError(''); setHolds([]); setHoldsLoaded(false); }, [user?._id, user?.id]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy) return;
    const history = messages.slice(-8).map(({ role, content: body }) => ({ role, content: body }));
    setMessages((current) => [...current, { role: 'user', content }]);
    setInput(''); setError(''); setBusy(true); setRetryText('');
    try {
      const response = await axiosClient.post('/chat/messages', { message: content, history }, { timeout: 110000 });
      setMessages((current) => [...current, { role: 'assistant', content: response.data.reply, options: response.data.options || [] }]);
    } catch (err) { setError(err.message); setRetryText(content); }
    finally { setBusy(false); }
  };
  const choose = (option) => {
    if (!isAuthenticated) { setError('Vui lòng đăng nhập bằng tài khoản bệnh nhân trước khi đặt lịch.'); return; }
    if (user?.role !== 'patient') { setError('Vui lòng dùng tài khoản bệnh nhân để đặt lịch.'); return; }
    dispatch(selectDoctor({ id: option.doctorId, doctorId: option.doctorId, name: option.doctorName, specialty: option.specialty, fee: option.fee }));
    dispatch(selectDate(option.date)); dispatch(selectSlot(option.timeSlot)); dispatch(setStep(2));
    setOpen(false); navigate('/booking');
  };
  const loadHolds = async () => {
    if (!isAuthenticated || user?.role !== 'patient') { setError('Đăng nhập bằng tài khoản bệnh nhân để xem lịch đang giữ.'); return; }
    setBusy(true); setError(''); setHoldsLoaded(false);
    try { const response = await axiosClient.get('/appointments/my-appointments'); setHolds((response.data || []).filter((item) => item.status === 'holding' && new Date(item.holdingExpiresAt).getTime() > Date.now())); setHoldsLoaded(true); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const resume = (hold) => {
    dispatch(selectDoctor({ id: hold.doctorId?._id, doctorId: hold.doctorId?._id, name: hold.doctorId?.fullName, specialty: hold.doctorProfileId?.specialtyId?.name, fee: hold.fee }));
    dispatch(selectDate(hold.date)); dispatch(selectSlot(hold.timeSlot));
    dispatch(setPatientInfo({ fullName: hold.patientName, phone: hold.patientPhone }));
    dispatch(setHoldingInfo({ appointmentId: hold._id, holdingExpiresAt: hold.holdingExpiresAt }));
    dispatch(setStep(3)); setOpen(false); navigate('/booking');
  };
  return <>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Mở trợ lý đặt lịch" className="fixed bottom-5 right-5 z-40 rounded-full bg-primary-600 p-4 text-white shadow-lg"><MessageCircle className="h-6 w-6" /></button>
    {open && <section aria-label="Trợ lý đặt lịch" className="fixed bottom-24 right-4 z-40 flex h-[min(70vh,550px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-2xl border bg-white shadow-xl dark:bg-slate-800">
      <header className="flex items-center justify-between border-b p-4"><div><strong>Trợ lý MedCare</strong><p className="text-xs text-slate-500">Tra cứu bác sĩ và lịch khám</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý"><X /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        <p className="text-xs text-slate-500">Tin nhắn được gửi tới OpenRouter. Vui lòng không nhập bệnh án, mật khẩu hoặc thông tin nhạy cảm.</p>
        {!messages.length && <p className="text-sm">Chào bạn! Hãy hỏi: “Ngày mai lúc 8 giờ có bác sĩ nào trống?”</p>}
        {messages.map((item, index) => <div key={index} className={`rounded-xl p-3 text-sm ${item.role === 'user' ? 'ml-6 bg-primary-600 text-white' : 'mr-6 bg-slate-100 dark:bg-slate-700'}`}><p className="whitespace-pre-wrap">{item.content}</p>{item.options?.map((option) => <button key={`${option.doctorId}-${option.date}-${option.timeSlot}`} type="button" onClick={() => choose(option)} className="mt-2 block w-full rounded-lg border border-primary-500 p-2 text-left text-xs text-primary-700 dark:text-primary-300">{option.doctorName} · {option.specialty} · {option.date} · {option.timeSlot} · {Number(option.fee || 0).toLocaleString('vi-VN')} đ</button>)}</div>)}
        {busy && <p className="text-sm">Đang xử lý...</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error} {retryText && <button type="button" className="underline" onClick={() => { setInput(retryText); setError(''); }}>Thử lại</button>}</p>}
        {holds.map((hold) => <button type="button" key={hold._id} onClick={() => resume(hold)} className="block rounded-lg border p-2 text-left text-sm">Tiếp tục cọc: {hold.doctorId?.fullName} · {hold.date} · {hold.timeSlot}</button>)}
        {holdsLoaded && !holds.length && <p className="text-sm text-slate-500">Bạn không có lịch đang giữ còn hiệu lực.</p>}
      </div>
      <div className="border-t px-3 pt-2"><button type="button" onClick={loadHolds} disabled={busy} className="text-xs text-primary-600 underline">Xem lịch đang giữ để xác nhận cọc</button></div>
      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex gap-2 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} placeholder="Nhập yêu cầu đặt lịch..." aria-label="Tin nhắn" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-slate-900" /><button type="submit" disabled={busy || !input.trim()} aria-label="Gửi tin nhắn" className="rounded-lg bg-primary-600 p-2 text-white disabled:opacity-50"><Send className="h-5 w-5" /></button></form>
    </section>}
  </>;
};
export default ChatWidget;
