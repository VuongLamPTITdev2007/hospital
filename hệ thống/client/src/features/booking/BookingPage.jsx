import React, { useState } from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { Calendar, Clock, CheckCircle2, AlertTriangle, QrCode } from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

const SLOTS = [
  { time: '08:00 - 08:30', isBooked: false },
  { time: '08:30 - 09:00', isBooked: true }, // Đã có người đặt
  { time: '09:00 - 09:30', isBooked: false },
  { time: '09:30 - 10:00', isBooked: false },
  { time: '10:00 - 10:30', isBooked: false },
  { time: '14:00 - 14:30', isBooked: true },
  { time: '14:30 - 15:00', isBooked: false },
  { time: '15:00 - 15:30', isBooked: false },
];

const BookingPage = () => {
  const [selectedDate, setSelectedDate] = useState('2026-11-20');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isHoldingModalOpen, setIsHoldingModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Hook đếm ngược giữ slot 5 phút (300 giây)
  const { secondsLeft, isActive, start, reset, formatTime } = useCountdown(300, () => {
    alert('Đã hết 5 phút giữ chỗ! Khung giờ của bạn đã được giải phóng.');
    setIsHoldingModalOpen(false);
    setSelectedSlot(null);
  });

  const handleSelectSlot = (slot) => {
    if (slot.isBooked) return;
    setSelectedSlot(slot.time);
  };

  const handleStartBooking = () => {
    if (!selectedSlot) return;
    setIsHoldingModalOpen(true);
    reset(300);
    start();
  };

  const handleConfirmPayment = () => {
    setIsSuccess(true);
    setIsHoldingModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full text-xs font-semibold mb-2">
          Phân hệ TV 2: Booking Engine & Chống trùng ca khám
        </span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Chọn Khung Giờ & Đặt Hẹn Khám Bệnh
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Bác sĩ phụ trách: <strong className="text-primary-600">BSCKII. Nguyễn Văn An</strong> (Chuyên khoa Tim mạch)
        </p>

        {/* Date picker */}
        <div className="mt-6 flex items-center space-x-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-primary-600" /> Ngày khám:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Success banner */}
      {isSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>Đặt lịch thành công! Mã hẹn của bạn: <strong>#MED-2026-9921</strong>. Vui lòng đến trước 15 phút.</span>
        </div>
      )}

      {/* Slot Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary-600" /> Khung giờ khám khả dụng (30 phút/ca)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SLOTS.map((slot, idx) => {
            const isSelected = selectedSlot === slot.time;
            return (
              <button
                key={idx}
                type="button"
                disabled={slot.isBooked}
                onClick={() => handleSelectSlot(slot)}
                className={`p-3 rounded-xl border text-sm font-semibold transition-all text-center flex flex-col items-center justify-center ${
                  slot.isBooked
                    ? 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed line-through'
                    : isSelected
                    ? 'bg-primary-600 text-white border-primary-600 shadow-md ring-2 ring-primary-300'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{slot.time}</span>
                <span className="text-[11px] font-normal mt-1">
                  {slot.isBooked ? 'Đã kín' : isSelected ? 'Đang chọn' : 'Còn trống'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Bottom */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-500">Khung giờ đã chọn:</p>
            <p className="text-base font-bold text-primary-600">
              {selectedSlot ? `${selectedSlot} ngày ${selectedDate}` : 'Chưa chọn khung giờ'}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            disabled={!selectedSlot}
            onClick={handleStartBooking}
            className="w-full sm:w-auto"
          >
            Tiến hành giữ chỗ & Thanh toán cọc
          </Button>
        </div>
      </div>

      {/* Countdown Hold Modal */}
      <Modal
        isOpen={isHoldingModalOpen}
        onClose={() => setIsHoldingModalOpen(false)}
        title="Xác nhận giữ chỗ & Thanh toán cọc"
      >
        <div className="space-y-4">
          {/* Countdown Clock */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center text-amber-800 dark:text-amber-300 text-sm">
              <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>Thời gian giữ slot còn lại:</span>
            </div>
            <span className="text-lg font-mono font-bold text-red-600 dark:text-red-400 animate-pulse">
              {formatTime()}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Bác sĩ:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">BSCKII. Nguyễn Văn An</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thời gian:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tiền cọc giữ chỗ:</span>
              <span className="font-bold text-primary-600">50.000 VNĐ</span>
            </div>
          </div>

          {/* QR code simulation */}
          <div className="text-center p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            <div className="w-36 h-36 mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500">
              <QrCode className="w-16 h-16 text-slate-700 dark:text-slate-300" />
              <span className="text-[10px] mt-1">VietQR Giữ Chỗ</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Quét mã để chuyển khoản 50.000đ cọc (Demo)</p>
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <Button variant="outline" onClick={() => setIsHoldingModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirmPayment}>
              Xác nhận đã chuyển khoản
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingPage;
