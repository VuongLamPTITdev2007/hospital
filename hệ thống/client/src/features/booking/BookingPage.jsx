import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { resetBooking } from '../../store/slices/bookingSlice';
import BookingStepWizard from './BookingStepWizard';
import DoctorSlotSelector from './DoctorSlotSelector';
import PatientInfoForm from './PatientInfoForm';
import HoldPaymentStep from './HoldPaymentStep';
import BookingConfirmationPass from './BookingConfirmationPass';
import MyAppointmentsTab from './MyAppointmentsTab';
import { CalendarCheck, History, Sparkles, Clock, ShieldCheck } from 'lucide-react';

const BookingPage = () => {
  const dispatch = useDispatch();
  const { step } = useSelector((state) => state.booking);
  const [activeTab, setActiveTab] = useState('booking'); // 'booking' | 'history'

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'booking' && step === 4) {
      dispatch(resetBooking());
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Đặt Lịch Khám Bệnh */}
      <div className="bg-gradient-to-r from-teal-600 via-primary-600 to-primary-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-primary-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Phòng Khám Đa Khoa MedCare
              </span>
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-900">
                <Sparkles className="w-3 h-3 mr-1" /> Đặt lịch trực tuyến 24/7
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              Đặt Lịch Khám & Chăm Sóc Sức Khỏe
            </h1>
            <p className="mt-2 text-primary-100 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Chủ động chọn bác sĩ chuyên khoa và khung giờ khám phù hợp với lịch trình của bạn. Đặt hẹn nhanh chóng, giữ chỗ tức thì và nhận phiếu khám điện tử mà không cần xếp hàng chờ đợi.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-white/15 backdrop-blur-md p-1.5 rounded-2xl self-start md:self-center">
            <button
              onClick={() => handleTabChange('booking')}
              className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'booking'
                  ? 'bg-white text-primary-700 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <CalendarCheck className="w-4 h-4 mr-1.5" /> Đặt lịch mới
            </button>
            <button
              onClick={() => handleTabChange('history')}
              className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-primary-700 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <History className="w-4 h-4 mr-1.5" /> Lịch hẹn của tôi
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'booking' ? (
        <div className="space-y-6">
          {/* Multi-step Stepper */}
          <BookingStepWizard currentStep={step} />

          {/* Step 1: Chọn Bác sĩ, Ngày & Khung giờ Slot */}
          {step === 1 && <DoctorSlotSelector />}

          {/* Step 2: Form thông tin người khám */}
          {step === 2 && <PatientInfoForm />}

          {/* Step 3: Giữ chỗ 5 phút & Thanh toán cọc VietQR */}
          {step === 3 && <HoldPaymentStep />}

          {/* Step 4: Phiếu xác nhận đặt lịch & E-Ticket Pass */}
          {step === 4 && (
            <BookingConfirmationPass onGoToMyAppointments={() => setActiveTab('history')} />
          )}
        </div>
      ) : (
        <MyAppointmentsTab
          onStartBookingNew={() => {
            setActiveTab('booking');
            dispatch(resetBooking());
          }}
        />
      )}
    </div>
  );
};

export default BookingPage;
