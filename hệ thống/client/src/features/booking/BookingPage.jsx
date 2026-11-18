import React, { useCallback, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, QrCode } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useCountdown } from '../../hooks/useCountdown';
import { useFetch } from '../../hooks/useFetch';
import { resetBooking, selectDoctor, selectSlot, setPatientInfo as setBookingPatientInfo } from '../../store/slices/bookingSlice';

const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientInfo, setPatientInfo] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', symptoms: '' });
  const [holdingAppointment, setHoldingAppointment] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { data: doctorResponse, loading: doctorLoading } = useFetch(doctorId ? `/doctors/${doctorId}` : null);
  const slotsUrl = doctorId ? `/doctors/${doctorId}/available-slots?date=${selectedDate}` : null;
  const { data: slotResponse, loading: slotsLoading, refetch: refetchSlots } = useFetch(slotsUrl);
  const doctor = doctorResponse?.data;
  const slots = slotResponse?.data || [];

  const cancelHolding = useCallback(async () => {
    if (!holdingAppointment?._id) return;
    try {
      await axiosClient.patch(`/appointments/${holdingAppointment._id}`, { action: 'cancel' });
      setMessage('Đã hết thời gian giữ chỗ. Khung giờ đã được giải phóng.');
      setHoldingAppointment(null);
      setSelectedSlot('');
      refetchSlots();
    } catch (requestError) {
      setError(requestError.message || 'Không thể giải phóng khung giờ.');
    }
  }, [holdingAppointment, refetchSlots]);

  const { formatTime, reset, start } = useCountdown(300, cancelHolding);

  const selectedSlotLabel = useMemo(() => selectedSlot.replace('-', ' - '), [selectedSlot]);

  const handleStartHolding = async () => {
    setError('');
    setMessage('');
    if (!doctorId || !selectedSlot || !patientInfo.fullName.trim() || !patientInfo.phone.trim()) {
      setError('Hãy chọn khung giờ và nhập đủ họ tên, số điện thoại.');
      return;
    }
    try {
      dispatch(selectDoctor(doctor));
      dispatch(selectSlot({ date: selectedDate, timeSlot: selectedSlot }));
      dispatch(setBookingPatientInfo({ fullName: patientInfo.fullName, phone: patientInfo.phone, symptoms: patientInfo.symptoms }));
      const response = await axiosClient.post('/appointments', {
        doctorId,
        date: selectedDate,
        timeSlot: selectedSlot,
        patientName: patientInfo.fullName,
        patientPhone: patientInfo.phone,
        symptomsNote: patientInfo.symptoms
      });
      setHoldingAppointment(response.data);
      reset(300);
      start();
      refetchSlots();
    } catch (requestError) {
      setError(requestError.message || 'Không thể giữ chỗ.');
      refetchSlots();
    }
  };

  const handleConfirmPayment = async () => {
    try {
      const response = await axiosClient.patch(`/appointments/${holdingAppointment._id}`, { action: 'confirm' });
      setHoldingAppointment(null);
      setMessage(`Đặt lịch thành công. Mã hẹn: ${response.data._id.slice(-6).toUpperCase()}.`);
      setSelectedSlot('');
      dispatch(resetBooking());
      refetchSlots();
    } catch (requestError) {
      setError(requestError.message || 'Không thể xác nhận thanh toán.');
    }
  };

  if (!doctorId) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">Hãy chọn một bác sĩ từ trang Bác sĩ trước khi đặt lịch.</div>;
  if (doctorLoading) return <Loader text="Đang tải thông tin bác sĩ..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full text-xs font-semibold mb-2">Phân hệ TV 2: Booking Engine & Giữ chỗ 5 phút</span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Đặt lịch khám</h1>
        <p className="text-sm text-slate-500 mt-1">Bác sĩ: <strong className="text-primary-600">{doctor?.degree} {doctor?.fullName}</strong> — {doctor?.specialty}</p>
      </section>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" />{message}</div>}

      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <label htmlFor="booking-date" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center"><Calendar className="w-4 h-4 mr-2 text-primary-600" />Ngày khám</label>
          <input id="booking-date" type="date" min={formatDate(new Date())} value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setSelectedSlot(''); }} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-primary-600" />Khung giờ khả dụng</h2>
          {slotsLoading ? <Loader text="Đang tải khung giờ..." /> : <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{slots.map((slot) => {
            const isSelected = selectedSlot === slot.timeSlot;
            return <button key={slot.timeSlot} type="button" disabled={slot.isBooked || slot.isPast || Boolean(holdingAppointment)} onClick={() => setSelectedSlot(slot.timeSlot)} className={`p-3 rounded-xl border text-sm font-semibold ${slot.isBooked || slot.isPast ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through' : isSelected ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-primary-400'}`}>
              <span>{slot.timeSlot.replace('-', ' - ')}</span><span className="block text-[11px] font-normal mt-1">{slot.isPast ? 'Đã qua' : slot.isBooked ? 'Đã kín' : isSelected ? 'Đang chọn' : 'Còn trống'}</span>
            </button>;
          })}</div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <input value={patientInfo.fullName} onChange={(event) => setPatientInfo((current) => ({ ...current, fullName: event.target.value }))} placeholder="Họ và tên bệnh nhân" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
          <input value={patientInfo.phone} onChange={(event) => setPatientInfo((current) => ({ ...current, phone: event.target.value }))} placeholder="Số điện thoại" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
          <textarea value={patientInfo.symptoms} onChange={(event) => setPatientInfo((current) => ({ ...current, symptoms: event.target.value }))} placeholder="Triệu chứng hoặc lý do khám" rows={3} className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">Đã chọn: <strong className="text-primary-600">{selectedSlot ? `${selectedSlotLabel}, ${selectedDate}` : 'Chưa chọn slot'}</strong></p>
          <Button variant="primary" disabled={!selectedSlot || Boolean(holdingAppointment)} onClick={handleStartHolding}>Giữ chỗ & thanh toán cọc</Button>
        </div>
      </section>

      <Modal isOpen={Boolean(holdingAppointment)} onClose={cancelHolding} title="Xác nhận giữ chỗ & thanh toán cọc">
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex justify-between text-amber-800"><span>Thời gian giữ slot còn lại</span><strong className="font-mono text-red-600">{formatTime()}</strong></div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 text-sm"><p>Bác sĩ: <strong>{doctor?.fullName}</strong></p><p>Thời gian: <strong>{selectedSlotLabel}, {selectedDate}</strong></p><p>Tiền cọc: <strong className="text-primary-600">50.000 đ</strong></p></div>
          <div className="text-center p-4 border border-dashed rounded-xl"><QrCode className="w-16 h-16 mx-auto text-slate-600" /><p className="text-xs text-slate-500 mt-2">VietQR giữ chỗ — môi trường demo</p></div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={cancelHolding}>Hủy</Button><Button variant="primary" onClick={handleConfirmPayment}>Xác nhận đã chuyển khoản</Button></div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingPage;
