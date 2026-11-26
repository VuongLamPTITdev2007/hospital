import React from 'react';
import { ClipboardList, Search, Clock, FileCheck, Activity, AlertCircle, CalendarX } from 'lucide-react';
import Loader from '../../../components/common/Loader';
import Button from '../../../components/common/Button';

const STATUS_TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting', label: 'Chờ khám' },
  { key: 'in_progress', label: 'Đang khám' },
  { key: 'completed', label: 'Đã xong' }
];

const PatientQueuePanel = ({
  patients,
  totalCount = 0,
  activePatient,
  loading = false,
  error = '',
  onRetry,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectPatient
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2 text-primary-600" /> Hàng Đợi Khám Bệnh
        </h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {patients.length} ca
        </span>
      </div>

      {/* Thanh tìm kiếm tiếng Việt không dấu */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, SĐT hoặc triệu chứng..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={loading || Boolean(error)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60"
        />
      </div>

      {/* Bộ lọc nhanh theo trạng thái ca khám */}
      <div className="grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-900/70 p-1 rounded-xl">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusFilterChange(tab.key)}
              disabled={loading || Boolean(error)}
              className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-60 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Trạng thái Loading / Lỗi / Danh sách rỗng / Danh sách ca khám */}
      <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-8">
            <Loader text="Đang tải hàng đợi khám..." />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">{error}</p>
            {onRetry && (
              <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                Thử tải lại
              </Button>
            )}
          </div>
        ) : totalCount === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <CalendarX className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Chưa có ca khám nào trong hàng đợi
            </p>
            <p className="text-xs text-slate-400">
              Khi bệnh nhân đặt lịch hẹn thành công, danh sách sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Không tìm thấy bệnh nhân phù hợp với bộ lọc hiện tại
          </div>
        ) : (
          patients.map((p) => {
            const pKey = p._id || p.appointmentId;
            const isCurrent = (activePatient?._id || activePatient?.appointmentId) === pKey;
            const pName = p.patientName || p.patientId?.fullName || 'Bệnh nhân';
            const pSlot = p.timeSlot || '08:00 - 08:30';
            const pSymptoms = p.symptomsNote || p.symptoms || 'Chưa ghi nhận triệu chứng';
            const isDone = p.status === 'completed' || p.hasMedicalRecord;

            return (
              <div
                key={pKey}
                onClick={() => onSelectPatient(p)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/50'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                    {pName}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center flex-shrink-0">
                    <Clock className="w-3 h-3 mr-1" /> {pSlot}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  Triệu chứng: {pSymptoms}
                </p>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    SĐT: {p.patientPhone || p.patientId?.phone || 'Chưa cập nhật'}
                  </span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : p.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <FileCheck className="w-3 h-3 mr-1" /> Đã Lập Bệnh Án
                      </>
                    ) : p.status === 'in_progress' ? (
                      <>
                        <Activity className="w-3 h-3 mr-1" /> Đang Khám
                      </>
                    ) : (
                      'Chờ Khám'
                    )}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PatientQueuePanel;
