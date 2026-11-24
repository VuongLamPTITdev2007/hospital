import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetBooking } from '../../store/slices/bookingSlice';
import {
  CheckCircle2,
  Printer,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building,
  ArrowRight,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import Button from '../../components/common/Button';

const BookingConfirmationPass = ({ onGoToMyAppointments }) => {
  const dispatch = useDispatch();
  const { confirmedBooking, selectedDoctor, selectedDate, selectedSlot, patientInfo } = useSelector(
    (state) => state.booking
  );

  const bookingData = confirmedBooking?.appointment || confirmedBooking;
  const bookingCode =
    confirmedBooking?.bookingCode ||
    bookingData?._id?.toString().slice(-6).toUpperCase() ||
    'MED2026';

  const handlePrint = () => {
    window.print();
  };

  const handleNewBooking = () => {
    dispatch(resetBooking());
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Banner Thành công */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">
          Đặt Lịch Khám Thành Công!
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Lịch khám đã được đồng bộ vào hệ thống phòng khám. Vui lòng lưu lại phiếu khám bên dưới.
        </p>
      </div>

      {/* Phiếu Khám Bệnh Điện Tử (E-Appointment Pass) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-primary-500 shadow-xl overflow-hidden print:border-black">
        {/* Header Phiếu */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded">
              MEDCARE CLINIC PASS
            </span>
            <h3 className="text-xl font-black mt-1">PHIẾU HẸN KHÁM BỆNH ĐIỆN TỬ</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-primary-200 block">Mã số phiếu</span>
            <span className="font-mono font-black text-lg">#{bookingCode}</span>
          </div>
        </div>

        {/* Nội dung chi tiết */}
        <div className="p-6 space-y-5">
          {/* Thông tin Bác sĩ */}
          <div className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-primary-600 font-bold uppercase">
                {selectedDoctor?.specialty || 'Chuyên khoa Y tế'}
              </span>
              <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {selectedDoctor?.name || 'Bác sĩ MedCare'}
              </h4>
              <p className="text-xs text-slate-500 flex items-center mt-1">
                <Building className="w-3.5 h-3.5 mr-1" />
                {selectedDoctor?.hospital || 'Phòng khám Đa khoa MedCare'}
              </p>
            </div>
          </div>

          {/* Thời gian khám */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900 text-center">
              <span className="text-xs text-slate-500 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-primary-600" /> Ngày khám
              </span>
              <span className="block text-base font-bold text-primary-700 dark:text-primary-300 mt-1">
                {selectedDate}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-primary-50/50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-900 text-center">
              <span className="text-xs text-slate-500 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-primary-600" /> Khung giờ khám
              </span>
              <span className="block text-base font-bold text-primary-700 dark:text-primary-300 mt-1 font-mono">
                {selectedSlot}
              </span>
            </div>
          </div>

          {/* Thông tin Bệnh nhân & Tài chính */}
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Họ tên người khám:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{patientInfo.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số điện thoại liên hệ:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{patientInfo.phone}</span>
            </div>
            {patientInfo.symptoms && (
              <div className="flex justify-between">
                <span className="text-slate-500">Triệu chứng ban đầu:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 max-w-xs text-right truncate">
                  {patientInfo.symptoms}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
              <span className="text-slate-600 font-semibold">Tiền cọc giữ chỗ:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                50.000 đ (Đã thanh toán)
              </span>
            </div>
          </div>

          {/* Lời dặn */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Lưu ý quan trọng:</strong> Vui lòng có mặt tại Quầy tiếp đón trước giờ hẹn <strong>15 phút</strong> để làm thủ tục tiếp nhận và đo sinh hiệu (huyết áp, nhịp tim).
            </span>
          </div>
        </div>

        {/* Footer Phiếu */}
        <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span>Hệ thống Quản trị Y tế MedCare 2026</span>
          <span className="font-mono">STATUS: CONFIRMED</span>
        </div>
      </div>

      {/* Hành động */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrint}
          className="w-full sm:w-auto flex items-center justify-center"
        >
          <Printer className="w-4 h-4 mr-2" /> In phiếu khám bệnh
        </Button>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {onGoToMyAppointments && (
            <Button
              type="button"
              variant="secondary"
              onClick={onGoToMyAppointments}
              className="flex-1 sm:flex-initial"
            >
              Lịch hẹn của tôi
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            onClick={handleNewBooking}
            className="flex-1 sm:flex-initial flex items-center justify-center"
          >
            <span>Đặt ca khám mới</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPass;

