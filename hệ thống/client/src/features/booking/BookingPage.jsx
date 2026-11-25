import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import { resetBooking } from '../../store/slices/bookingSlice';
import BookingStepWizard from './BookingStepWizard';
import DoctorSlotSelector from './DoctorSlotSelector';
import PatientInfoForm from './PatientInfoForm';
import HoldPaymentStep from './HoldPaymentStep';

const BookingPage = () => {
  const dispatch = useDispatch();
  const { step, confirmedBooking, selectedDoctor, selectedDate, selectedSlot } = useSelector((state) => state.booking);
  return <div className="mx-auto max-w-5xl space-y-6">
    <header><h1 className="text-2xl font-bold">Đặt lịch khám</h1><p className="text-sm text-slate-500">Chọn bác sĩ, khung giờ và xác nhận cọc mô phỏng.</p></header>
    <BookingStepWizard currentStep={step} />
    {step === 1 && <DoctorSlotSelector />}
    {step === 2 && <PatientInfoForm />}
    {step === 3 && <HoldPaymentStep />}
    {step === 4 && <section className="space-y-4 rounded-2xl border bg-white p-6 dark:bg-slate-800"><h2 className="text-xl font-bold text-emerald-600">Đã xác nhận lịch hẹn</h2><p>Bác sĩ: {selectedDoctor?.name}</p><p>Ngày khám: {selectedDate} · {selectedSlot}</p><p className="text-sm text-slate-500">Mã lịch: {confirmedBooking?.appointment?._id || confirmedBooking?._id || confirmedBooking?.appointmentId || 'Xem trong lịch hẹn cá nhân'}</p><p className="text-sm text-slate-500">Thanh toán cọc chỉ là mô phỏng, không có giao dịch ngân hàng.</p><Button onClick={() => dispatch(resetBooking())}>Đặt lịch khác</Button></section>}
  </div>;
};
export default BookingPage;
