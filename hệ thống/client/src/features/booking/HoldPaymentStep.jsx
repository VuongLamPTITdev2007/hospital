import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import { clearHoldingInfo, nextStep, setConfirmedBooking, setStep } from '../../store/slices/bookingSlice';

const HoldPaymentStep = () => {
  const dispatch = useDispatch();
  const { selectedDoctor, selectedDate, selectedSlot, patientInfo, holdingInfo, depositAmount } = useSelector((state) => state.booking);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const expiry = new Date(holdingInfo?.holdingExpiresAt || 0).getTime();
  const seconds = Math.max(0, Math.ceil((expiry - now) / 1000));
  const appointmentId = holdingInfo?.appointmentId;

  const confirm = async () => {
    setBusy(true); setError('');
    try { const response = await axiosClient.post(`/appointments/${appointmentId}/confirm`, { paymentMethod: 'demo' }); dispatch(setConfirmedBooking(response.data)); dispatch(nextStep()); }
    catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  const cancel = async () => {
    setBusy(true); setError('');
    try { if (appointmentId) await axiosClient.post(`/appointments/${appointmentId}/cancel`); dispatch(clearHoldingInfo()); dispatch(setStep(1)); }
    catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  return <section className="mx-auto max-w-2xl space-y-5 rounded-2xl border bg-white p-6 dark:bg-slate-800">
    <h2 className="text-lg font-bold">Xác nhận cọc mô phỏng</h2>
    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Đây là chức năng demo, không thực hiện chuyển tiền và không xác minh giao dịch ngân hàng.</p>
    <p>Thời gian giữ chỗ còn lại: <strong>{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</strong></p>
    <p>Bác sĩ: {selectedDoctor?.name} · {selectedDate} · {selectedSlot}</p><p>Bệnh nhân: {patientInfo.fullName}</p><p>Tiền cọc mô phỏng: {Number(depositAmount).toLocaleString('vi-VN')} đ</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {seconds === 0 && <p className="text-red-600">Thời gian giữ chỗ đã hết. Hãy chọn lại lịch.</p>}
    <div className="flex gap-3"><Button variant="outline" disabled={busy} onClick={cancel}>Hủy giữ chỗ</Button><Button disabled={busy || seconds === 0 || !appointmentId} onClick={confirm}>Xác nhận cọc demo</Button></div>
  </section>;
};
export default HoldPaymentStep;
