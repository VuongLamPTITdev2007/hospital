import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Star, 
  FileText, 
  Stethoscope, 
  Filter, 
  Check,
  UserCheck
} from 'lucide-react';
import Button from '../../components/common/Button';

// Định dạng mã ca khám: 8 ký tự cuối viết hoa dạng #CAC2C76F
const formatAppointmentCode = (rawId) => {
  if (!rawId) return '#MEDCARE';
  const str = String(rawId);
  return '#' + str.slice(-8).toUpperCase();
};

// Đồng bộ định dạng ngày tháng sang chuẩn Việt Nam DD/MM/YYYY (ví dụ: 26/11/2026)
const formatDateVN = (rawDate) => {
  if (!rawDate) return '';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Component: AppointmentHistory
 * Quản lý tab "Lịch sử khám của tôi" của Bệnh nhân
 * - Hiển thị danh sách ca khám với 3 trạng thái: Đã hoàn thành, Đã đặt lịch, Đã hủy
 * - Lọc theo trạng thái
 * - Nghiệp vụ chống spam: Chỉ ca khám Đã hoàn thành và Chưa đánh giá mới mở nút "Đánh giá bác sĩ"
 * - Khi đã đánh giá: Đổi nút thành "Đã đánh giá" và vô hiệu hóa nút
 */
const AppointmentHistory = ({ appointments = [], onReviewDoctor }) => {
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Thống kê nhanh số lượng theo trạng thái
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      completed: appointments.filter((a) => a.status === 'completed').length,
      confirmed: appointments.filter((a) => a.status === 'confirmed').length,
      cancelled: appointments.filter((a) => a.status === 'cancelled').length
    };
  }, [appointments]);

  // Lọc danh sách ca khám theo trạng thái
  const filteredAppointments = useMemo(() => {
    if (statusFilter === 'ALL') return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  // Cấu hình hiển thị theo từng trạng thái
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
            Đã hoàn thành
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Clock className="w-3.5 h-3.5 mr-1 text-sky-600 dark:text-sky-400" />
            Đã đặt lịch (Sắp tới)
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600 dark:text-rose-400" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Giới thiệu tab */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <UserCheck className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
            Hồ Sơ & Lịch Sử Các Buổi Khám Của Tôi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến trình ca khám, kết quả chẩn đoán của bác sĩ và đóng góp đánh giá dịch vụ sau khi buổi khám kết thúc.
          </p>
        </div>
      </div>

      {/* Thanh bộ lọc nhanh trạng thái */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mr-2 shrink-0">
          <Filter className="w-3.5 h-3.5" />
          <span>Trạng thái:</span>
        </div>

        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            statusFilter === 'ALL'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Tất cả ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            statusFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Đã hoàn thành ({counts.completed})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            statusFilter === 'confirmed'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Đã đặt lịch ({counts.confirmed})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
            statusFilter === 'cancelled'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          Đã hủy ({counts.cancelled})
        </button>
      </div>

      {/* Danh sách các ca khám */}
      <div className="space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Không tìm thấy ca khám nào
            </h4>
            <p className="text-xs text-slate-400">
              Hiện không có ca khám nào thuộc trạng thái này trong hồ sơ bệnh án của bạn.
            </p>
          </div>
        ) : (
          filteredAppointments.map((app) => {
            const isCompleted = app.status === 'completed';
            const isReviewed = Boolean(app.isReviewed);

            return (
              <div
                key={app.id || app._id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header ca khám: Mã + Ngày giờ + Trạng thái */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3.5">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Mã: {formatAppointmentCode(app.id || app._id)}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {formatDateVN(app.date)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {app.timeSlot}
                      </span>
                    </div>
                  </div>

                  <div>{renderStatusBadge(app.status)}</div>
                </div>

                {/* Thông tin bác sĩ và chuyên khoa */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {app.doctorName}
                      </h3>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Chuyên khoa:</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          {app.specialty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động đánh giá */}
                  <div className="flex items-center sm:self-center">
                    {isCompleted ? (
                      isReviewed ? (
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-600 select-none">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>Đã đánh giá</span>
                        </div>
                      ) : app.canReview ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onReviewDoctor(app)}
                          className="shadow-sm shadow-primary-500/20"
                        >
                          <Star className="w-3.5 h-3.5 mr-1.5 fill-amber-300 text-amber-300" />
                          Đánh giá bác sĩ
                        </Button>
                      ) : (
                        <span className="text-[11px] text-amber-700 italic">Ca khám chưa có bệnh án hợp lệ. Vui lòng liên hệ phòng khám.</span>
                      )
                    ) : ['confirmed', 'waiting', 'in_progress', 'holding'].includes(app.status) ? (
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 italic">
                        * Đánh giá sẽ mở sau khi hoàn tất buổi khám
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        * Ca khám đã hủy, không thể đánh giá
                      </span>
                    )}
                  </div>
                </div>

                {/* Khối chẩn đoán / Ghi chú ca khám */}
                <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    <FileText className="w-3.5 h-3.5 mr-1.5 text-primary-600 dark:text-primary-400" />
                    Chẩn đoán & Ghi chú của Bác sĩ:
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-5">
                    {app.diagnosis}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AppointmentHistory;
