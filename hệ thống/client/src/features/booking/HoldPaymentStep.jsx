import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useCountdown } from '../../hooks/useCountdown';
import {
  setConfirmedBooking,
  clearHoldingInfo,
  nextStep,
  setStep
} from '../../store/slices/bookingSlice';
import axiosClient from '../../api/axiosClient';
import {
  Clock,
  AlertTriangle,
  QrCode,
  Copy,
  CheckCircle,
  XCircle,
  CreditCard,
  Building,
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import Button from '../../components/common/Button';

const HoldPaymentStep = () => {
  const dispatch = useDispatch();
  const { selectedDoctor, selectedDate, selectedSlot, patientInfo, holdingInfo, depositAmount } =
    useSelector((state) => state.booking);
  const demoPayment = holdingInfo?.paymentMode === 'demo';

  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  // Tính số giây còn lại thực tế từ holdingExpiresAt (chống reset khi F5)
  const calculateInitialSeconds = () => {
    if (holdingInfo?.holdingExpiresAt) {
      const diffMs = new Date(holdingInfo.holdingExpiresAt).getTime() - Date.now();
      const secs = Math.floor(diffMs / 1000);
      return secs > 0 ? secs : 0;
    }
    return holdingInfo?.secondsRemaining || 300;
  };

  const initialSecs = calculateInitialSeconds();

  // Custom Hook useCountdown với callback khi hết 5 phút
  const { secondsLeft, formatTime, start } = useCountdown(initialSecs, () => {
    setIsExpired(true);
  });

  // Bắt đầu đếm ngược ngay khi mount
  useEffect(() => {
    start();
  }, []);

  const bookingCode = holdingInfo?.bookingCode || holdingInfo?.appointmentId?.slice(-6).toUpperCase() || 'MED2026';
  const qrUrl =
    holdingInfo?.vietQrUrl ||
    `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=50000&addInfo=MEDCARE%20${bookingCode}&accountName=MEDCARE%20CLINIC`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Xác nhận đã chuyển khoản cọc
  const handleConfirmPayment = async () => {
    if (isExpired) return;
    try {
      setConfirming(true);
      setErrorMessage('');
      const apptId = holdingInfo?.appointmentId || holdingInfo?.appointment?._id;
      const res = await axiosClient.post(`/appointments/${apptId}/confirm`, {
        transactionCode: `${demoPayment ? 'DEMO' : 'QR'}-${Date.now()}`,
        paymentMethod: demoPayment ? 'demo' : 'VietQR'
      });

      if (res.success) {
        dispatch(setConfirmedBooking(res.data));
        dispatch(nextStep());
      }
    } catch (err) {
      setErrorMessage(err.message || 'Xác nhận thanh toán thất bại. Vui lòng thử lại!');
    } finally {
      setConfirming(false);
    }
  };

  // Chủ động hủy giữ chỗ để giải phóng slot
  const handleCancelHold = async () => {
    try {
      setCancelling(true);
      const apptId = holdingInfo?.appointmentId || holdingInfo?.appointment?._id;
      if (apptId) {
        await axiosClient.post(`/appointments/${apptId}/cancel`);
      }
    } catch (err) {
      console.warn('Lỗi khi hủy giữ chỗ:', err);
    } finally {
      dispatch(clearHoldingInfo());
      dispatch(setStep(1));
    }
  };

  // Nếu đã hết hạn 5 phút
  if (isExpired || secondsLeft <= 0) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900/60 p-8 shadow-sm text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Đã Hết Thời Gian 5 Phút Giữ Chỗ!
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Khung giờ <strong>{selectedSlot}</strong> ngày <strong>{selectedDate}</strong> đã được giải phóng tự động vào hệ thống để bệnh nhân khác có thể đặt.
        </p>
        <div className="pt-2">
          <Button variant="primary" onClick={() => {
            dispatch(clearHoldingInfo());
            dispatch(setStep(1));
          }}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại chọn khung giờ mới
          </Button>
        </div>
      </div>
    );
  }

  const isWarning = secondsLeft < 60;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Đồng hồ đếm ngược giữ chỗ */}
      <div
        className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
          isWarning
            ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 animate-pulse'
            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isWarning ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-800'
            }`}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center justify-center sm:justify-start">
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Khung giờ đang được khóa độc quyền cho bạn
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              Sau khi hết thời gian đếm ngược, khung giờ sẽ tự động giải phóng cho bệnh nhân khác.
            </p>
          </div>
        </div>

        <div className="text-center bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm">
          <span className="text-[11px] uppercase tracking-wider block font-bold text-slate-400">
            Thời gian còn lại
          </span>
          <span
            className={`text-2xl font-mono font-black ${
              isWarning ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {formatTime()}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm flex items-center">
          <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Chi tiết thanh toán & Mã VietQR */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {demoPayment ? 'Xác nhận cọc mô phỏng' : 'Quét Mã VietQR Chuyển Khoản Cọc (50.000 VNĐ)'}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            Mã hẹn: #{bookingCode}
          </span>
        </div>

        {demoPayment ? (
          <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <p>Đây là cọc mô phỏng. Bạn chỉ cần bấm xác nhận trên trang này.</p>
            <p>Bác sĩ <strong>{selectedDoctor?.name}</strong></p>
            <p>Thời gian khám <strong>{selectedSlot}</strong> ngày <strong>{selectedDate}</strong></p>
            <p>Người khám <strong>{patientInfo.fullName}</strong></p>
            <p>Tiền cọc mô phỏng <strong>{Number(holdingInfo.depositAmount ?? depositAmount).toLocaleString('vi-VN')} VNĐ</strong></p>
          </div>
        ) : <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Ảnh VietQR chuẩn */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative p-2 bg-white rounded-xl shadow-md border border-slate-200">
              <img
                src={qrUrl}
                alt="Mã QR VietQR MedCare"
                className="w-56 h-auto object-contain rounded-lg"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-3 text-center">
              Mở App Ngân hàng hoặc Ví MoMo/ZaloPay để quét mã QR thanh toán nhanh
            </p>
          </div>

          {/* Chi tiết thông tin chuyển khoản */}
          <div className="space-y-3.5 text-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Ngân hàng thụ hưởng:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center space-x-1.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                  <span>0987654321</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('0987654321')}
                    className="text-primary-600 hover:text-primary-700"
                    title="Sao chép STK"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">MEDCARE CLINIC</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Số tiền cọc giữ chỗ:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {Number(depositAmount).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Nội dung chuyển khoản:</span>
                <div className="flex items-center space-x-1.5 font-mono font-bold text-primary-600">
                  <span>MEDCARE {bookingCode}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`MEDCARE ${bookingCode}`)}
                    className="text-primary-600 hover:text-primary-700"
                    title="Sao chép nội dung"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {copiedText && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã sao chép vào bộ nhớ tạm!
              </p>
            )}

            {/* Tóm tắt ca hẹn */}
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
              <p>• Bác sĩ: <strong>{selectedDoctor?.name}</strong></p>
              <p>• Thời gian: <strong>{selectedSlot}</strong> ngày <strong>{selectedDate}</strong></p>
              <p>• Người khám: <strong>{patientInfo.fullName}</strong> ({patientInfo.phone})</p>
            </div>
          </div>
        </div>}

        {/* Action Buttons */}
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            loading={cancelling}
            onClick={handleCancelHold}
            className="w-full sm:w-auto"
          >
            <XCircle className="w-4 h-4 mr-2 text-red-500" /> Hủy giữ chỗ
          </Button>

          <Button
            type="button"
            variant="primary"
            size="lg"
            loading={confirming}
            onClick={handleConfirmPayment}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> {demoPayment ? 'Xác nhận cọc demo' : 'Xác nhận đã chuyển khoản cọc'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HoldPaymentStep;

