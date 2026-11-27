import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import { selectDoctor, selectDate, selectSlot, setPatientInfo, setHoldingInfo, setStep } from '../../store/slices/bookingSlice';
import { resolveChatSelection } from './resolveChatSelection';

const slotKey = ({ doctorId, date, timeSlot }) => `${doctorId}-${date}-${timeSlot}`;
const displayDate = (date) => date.split('-').reverse().join('/');
const holdResponseConfig = {
  validateStatus: (status) => status === 409 || (status >= 200 && status < 300),
  transformResponse: [].concat(axiosClient.defaults.transformResponse, (data, _headers, status) =>
    status === 409 ? { slotConflict: true } : data)
};

const ChatAvailabilityResults = ({ item, active, onChoose, onLoadMore, loading, busy, canLoadMore }) => {
  const groups = useMemo(() => {
    const byDate = new Map();
    (item.options || []).forEach((option, index) => {
      if (!byDate.has(option.date)) byDate.set(option.date, []);
      byDate.get(option.date).push({ option, number: index + 1 });
    });
    return [...byDate];
  }, [item.options]);

  if (!groups.length) return null;

  return <div className="mt-3 space-y-3" aria-busy={loading}>
    {groups.map(([date, options]) => <div key={date} className="space-y-1.5">
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-200">{displayDate(date)}</p>
      {options.map(({ option, number }) => <button
        key={slotKey(option)}
        type="button"
        disabled={busy || !active}
        onClick={() => onChoose(item, option.optionId)}
        className="block w-full rounded-lg border border-primary-500 px-2 py-1.5 text-left text-xs text-primary-700 disabled:opacity-60 dark:text-primary-300"
      >
        <span className="font-semibold">#{number} · {option.timeSlot} · {option.doctorName}</span>
        <span className="mt-0.5 block">{option.specialty} · {Number(option.fee || 0).toLocaleString('vi-VN')} đ</span>
      </button>)}
    </div>)}
    {!active && <p className="text-xs text-slate-600 dark:text-slate-200">Kết quả cũ. Hãy chọn lịch từ lần tra gần nhất.</p>}
    {active && item.pageError && <p role="alert" className="text-xs text-red-600 dark:text-red-300">{item.pageError}</p>}
    {active && item.pageExhausted && <p className="text-xs text-slate-600 dark:text-slate-200">Không còn lịch trống khác trong khoảng đã tra.</p>}
    {active && item.nextPage && <button
      type="button"
      disabled={!canLoadMore}
      onClick={() => onLoadMore(item)}
      className="rounded-lg border border-primary-500 px-3 py-2 text-xs font-semibold text-primary-700 disabled:opacity-60 dark:text-primary-300"
    >{loading ? 'Đang tải thêm...' : item.pageError ? 'Thử tải lại' : 'Xem thêm'}</button>}
  </div>;
};

const ChatSession = ({ user, isAuthenticated }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingPage, setLoadingPage] = useState(null);
  const [error, setError] = useState('');
  const [retryText, setRetryText] = useState('');
  const [holds, setHolds] = useState([]);
  const [holdsLoaded, setHoldsLoaded] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [phase, setPhase] = useState('chat');
  const [selectionContext, setSelectionContext] = useState(null);
  const activeSearch = useMemo(() => messages.findLast((item) => item.searchId || item.closesSearch), [messages]);
  const sessionRequest = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    sessionRequest.current = controller;
    return () => controller.abort();
  }, []);

  const suggestAlternatives = async ({ option, searchId, optionId }, signal) => {
    const taken = `Ca ${option.timeSlot} ngày ${displayDate(option.date)} vừa có người giữ hoặc đặt.`;
    let message;
    try {
      const { data } = await axiosClient.post('/chat/availability/alternatives', { searchId, optionId }, { signal });
      const { suggestedDate, ...availability } = data;
      let suggestion = 'Mình chưa thấy ca khác của bác sĩ này trong khoảng đã tra. Bạn có thể hỏi lịch ngày khác hoặc bác sĩ khác.';
      if (suggestedDate === option.date) suggestion = 'Bác sĩ này còn các ca sau trong ngày. Bạn muốn chọn ca nào?';
      else if (suggestedDate) suggestion = `Ngày gần nhất bác sĩ này còn lịch là ${displayDate(suggestedDate)}. Bạn có thể chọn một ca bên dưới.`;
      message = { content: `${taken} ${suggestion}`, ...availability };
    } catch (err) {
      if (signal.aborted) return;
      setError(err.message);
      message = { content: `${taken} Bạn hãy tra lại lịch để xem các ca còn trống.`, closesSearch: true };
    }
    if (signal.aborted) return;
    setPendingBooking(null); setSelectionContext(null); setPhase('chat');
    setMessages((current) => [...current, { ...message, role: 'assistant', localOnly: true }]);
  };

  const createHold = async (booking) => {
    const { signal } = sessionRequest.current;
    setBusy(true); setError('');
    try {
      const response = await axiosClient.post('/appointments/hold', {
        doctorId: booking.option.doctorId,
        date: booking.option.date,
        timeSlot: booking.option.timeSlot,
        patientName: user.fullName,
        patientPhone: booking.phone,
        symptomsNote: booking.symptoms
      }, { ...holdResponseConfig, signal });
      if (signal.aborted) return;
      if (response.slotConflict) {
        await suggestAlternatives(booking, signal);
        return;
      }
      dispatch(selectDoctor({ id: booking.option.doctorId, doctorId: booking.option.doctorId, name: booking.option.doctorName, specialty: booking.option.specialty, fee: booking.option.fee }));
      dispatch(selectDate(booking.option.date)); dispatch(selectSlot(booking.option.timeSlot));
      dispatch(setPatientInfo({ fullName: user.fullName, phone: booking.phone, email: user.email || '', symptoms: booking.symptoms }));
      dispatch(setHoldingInfo({ ...response.data, paymentMode: 'demo' })); dispatch(setStep(3));
      setMessages((current) => [...current, { role: 'assistant', content: 'Đã giữ chỗ. Vui lòng xem thông tin và xác nhận cọc mô phỏng.', localOnly: true }]);
      setPendingBooking(null); setPhase('chat'); setOpen(false); navigate('/booking');
    } catch (err) {
      setError(`${err.message} Bạn có thể thử lại hoặc chọn lịch khác.`);
      setPendingBooking(booking); setPhase('holdError');
    } finally { setBusy(false); }
  };

  const confirmChoice = async (item, optionId) => {
    if (item.searchId !== activeSearch?.searchId) return;
    if (!isAuthenticated) { setError('Vui lòng đăng nhập bằng tài khoản bệnh nhân trước khi đặt lịch.'); return; }
    if (user?.role !== 'patient') { setError('Vui lòng dùng tài khoản bệnh nhân để đặt lịch.'); return; }
    setError(''); setRetryText('');
    try {
      const { data } = await axiosClient.post('/chat/availability/selections', { searchId: item.searchId, optionId }, { signal: sessionRequest.current.signal });
      const { option } = data;
      setSelectionContext({ searchId: item.searchId, doctorId: option.doctorId });
      setPendingBooking({ option, searchId: item.searchId, optionId }); setPhase('symptoms'); setInput('');
      setMessages((current) => [...current, { role: 'assistant', content: `Bạn chọn ${option.doctorName}, ${option.date} lúc ${option.timeSlot}. Bạn cho mình biết lý do khám hoặc triệu chứng nhé. Thông tin này sẽ được gửi trực tiếp đến hệ thống đặt lịch.`, localOnly: true }]);
    } catch (err) { setError(err.message); }
  };

  const send = async (text) => {
    const content = text.trim();
    if (!content || busy) return;
    if (phase === 'symptoms') {
      if (content.length > 500) { setError('Lý do khám tối đa 500 ký tự.'); return; }
      setMessages((current) => [...current, { role: 'user', content, localOnly: true }]);
      setInput(''); setError('');
      const booking = { ...pendingBooking, symptoms: content };
      if (!/^(0[35789])\d{8}$/.test(String(user?.phone || '').trim())) {
        setPendingBooking(booking); setPhase('phone');
        setMessages((current) => [...current, { role: 'assistant', content: 'Bạn cho mình số điện thoại liên hệ 10 chữ số để hoàn tất giữ chỗ nhé.', localOnly: true }]);
      } else { await createHold({ ...booking, phone: user.phone.trim() }); }
      return;
    }
    if (phase === 'phone') {
      if (!/^(0[35789])\d{8}$/.test(content)) { setError('Vui lòng nhập số điện thoại hợp lệ gồm 10 chữ số.'); return; }
      setMessages((current) => [...current, { role: 'user', content: 'Đã cung cấp số điện thoại liên hệ.', localOnly: true }]);
      setInput(''); setError(''); await createHold({ ...pendingBooking, phone: content }); return;
    }
    if (phase === 'holdError') return;
    const history = messages.filter((item) => !item.localOnly).slice(-8).map(({ role, content: body }) => ({ role, content: body }));
    const context = selectionContext?.searchId === activeSearch?.searchId ? selectionContext : null;
    setMessages((current) => [...current, { role: 'user', content }]);
    setInput(''); setError(''); setBusy(true); setRetryText('');
    try {
      const response = await axiosClient.post('/chat/messages', {
        message: content, history, hasDisplayedSlots: Boolean(activeSearch?.options.length), awaitingSelectionDetail: Boolean(context?.criteria)
      }, { timeout: 110000, signal: sessionRequest.current.signal });
      const { reply, options, nextPage, searchId, searchFilters, selection } = response.data;
      if (selection) {
        const match = resolveChatSelection(selection, activeSearch, context);
        if (match.optionId) {
          await confirmChoice(activeSearch, match.optionId);
        } else {
          setSelectionContext(activeSearch ? { searchId: activeSearch.searchId, criteria: match.criteria, doctorId: match.doctorId || context?.doctorId } : null);
          setMessages((current) => [...current, { role: 'assistant', content: match.reply }]);
        }
        return;
      }
      setSelectionContext(searchId || !context ? null : { searchId: context.searchId, doctorId: context.doctorId });
      setMessages((current) => [...current, { role: 'assistant', content: reply, options, nextPage, searchId, searchFilters }]);
    } catch (err) { setError(err.message); setRetryText(content); }
    finally { setBusy(false); }
  };

  const loadMore = async (item) => {
    if (busy || phase !== 'chat' || !item.nextPage || item.searchId !== activeSearch?.searchId) return;
    setLoadingPage(item); setBusy(true);
    try {
      const { data } = await axiosClient.post('/chat/availability/pages', item.nextPage, { signal: sessionRequest.current.signal });
      if (data.searchId !== item.searchId) throw new Error('Trang lịch không thuộc lần tra đang mở. Hãy thử lại.');
      setMessages((current) => current.map((message) => {
        if (message !== item) return message;
        const existing = new Set(message.options.map(slotKey));
        const additional = data.options.filter((option) => !existing.has(slotKey(option)));
        return {
          ...message,
          options: [...message.options, ...additional],
          nextPage: data.nextPage,
          pageError: '',
          pageExhausted: !additional.length && !data.nextPage
        };
      }));
    } catch (err) {
      setMessages((current) => current.map((message) => message === item ? { ...message, pageError: err.message } : message));
    } finally { setBusy(false); setLoadingPage(null); }
  };

  const choose = async (item, optionId) => {
    if (busy) return;
    setBusy(true);
    try { await confirmChoice(item, optionId); }
    finally { setBusy(false); }
  };
  const loadHolds = async () => {
    if (!isAuthenticated || user?.role !== 'patient') { setError('Đăng nhập bằng tài khoản bệnh nhân để xem lịch đang giữ.'); return; }
    setBusy(true); setError(''); setHoldsLoaded(false);
    try { const response = await axiosClient.get('/appointments/my-appointments', { signal: sessionRequest.current.signal }); setHolds((response.data || []).filter((item) => item.status === 'holding' && new Date(item.holdingExpiresAt).getTime() > Date.now())); setHoldsLoaded(true); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  const resume = (hold) => {
    dispatch(selectDoctor({ id: hold.doctorId?._id, doctorId: hold.doctorId?._id, name: hold.doctorId?.fullName, specialty: hold.doctorProfileId?.specialtyId?.name, fee: hold.fee }));
    dispatch(selectDate(hold.date)); dispatch(selectSlot(hold.timeSlot));
    dispatch(setPatientInfo({ fullName: hold.patientName, phone: hold.patientPhone }));
    dispatch(setHoldingInfo({ appointmentId: hold._id, holdingExpiresAt: hold.holdingExpiresAt, depositAmount: hold.depositAmount, paymentMode: 'demo' }));
    dispatch(setStep(3)); setOpen(false); navigate('/booking');
  };
  return <>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Mở trợ lý đặt lịch" className="fixed bottom-5 right-5 z-40 rounded-full bg-primary-600 p-4 text-white shadow-lg"><MessageCircle className="h-6 w-6" /></button>
    {open && <section aria-label="Trợ lý đặt lịch" className="fixed bottom-24 right-4 z-40 flex h-[min(70vh,550px)] w-[min(92vw,390px)] flex-col overflow-hidden rounded-2xl border bg-white shadow-xl dark:bg-slate-800">
      <header className="flex items-center justify-between border-b p-4"><div><strong>Trợ lý MedCare</strong><p className="text-xs text-slate-500">Tra cứu bác sĩ và lịch khám</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Đóng trợ lý"><X /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        <p className="text-sm">Chào bạn! Tôi là trợ lý Medcare, tôi có thể giúp gì được cho bạn?</p>
        {messages.map((item, index) => <div key={index} className={`rounded-xl p-3 text-sm ${item.role === 'user' ? 'ml-6 bg-primary-600 text-white' : 'mr-6 bg-slate-100 dark:bg-slate-700'}`}>
          <p className="whitespace-pre-wrap">{item.content}</p>
          {item.options?.length > 0 && <ChatAvailabilityResults item={item} active={item.searchId === activeSearch?.searchId} onChoose={choose} onLoadMore={loadMore} loading={loadingPage === item} busy={busy} canLoadMore={!busy && phase === 'chat'} />}
        </div>)}
        {busy && !loadingPage && <p className="text-sm">Đang xử lý...</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error} {retryText && <button type="button" className="underline" onClick={() => { setInput(retryText); setError(''); }}>Thử lại</button>}</p>}
        {phase === 'holdError' && pendingBooking?.phone && <button type="button" disabled={busy} className="text-sm text-primary-600 underline" onClick={() => createHold(pendingBooking)}>Thử giữ chỗ lại</button>}
        {phase !== 'chat' && <button type="button" disabled={busy} className="block text-sm text-slate-500 underline" onClick={() => { setPendingBooking(null); setPhase('chat'); setInput(''); setError(''); }}>Hủy chọn lịch</button>}
        {holds.map((hold) => <button type="button" key={hold._id} onClick={() => resume(hold)} className="block rounded-lg border p-2 text-left text-sm">Tiếp tục cọc: {hold.doctorId?.fullName} · {hold.date} · {hold.timeSlot}</button>)}
        {holdsLoaded && !holds.length && <p className="text-sm text-slate-500">Bạn không có lịch đang giữ còn hiệu lực.</p>}
      </div>
      <div className="border-t px-3 pt-2"><button type="button" onClick={loadHolds} disabled={busy} className="text-xs text-primary-600 underline">Xem lịch đang giữ để xác nhận cọc</button></div>
      <form onSubmit={(event) => { event.preventDefault(); send(input); }} className="flex gap-2 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} placeholder={phase === 'symptoms' ? 'Nhập lý do khám hoặc triệu chứng...' : phase === 'phone' ? 'Nhập số điện thoại...' : 'Nhập yêu cầu đặt lịch...'} aria-label="Tin nhắn" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm dark:bg-slate-900" /><button type="submit" disabled={busy || phase === 'holdError' || !input.trim()} aria-label="Gửi tin nhắn" className="rounded-lg bg-primary-600 p-2 text-white disabled:opacity-50"><Send className="h-5 w-5" /></button></form>
    </section>}
  </>;
};

const ChatWidget = () => {
  const { user, isAuthenticated } = useAuth();
  const accountKey = isAuthenticated ? `account:${user?._id || user?.id || ''}` : 'guest';
  return <ChatSession key={accountKey} user={user} isAuthenticated={isAuthenticated} />;
};
export default ChatWidget;
