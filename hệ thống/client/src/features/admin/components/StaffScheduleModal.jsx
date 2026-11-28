import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  RefreshCw,
  Stethoscope,
  User as UserIcon
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import Modal from '../../../components/common/Modal';
import { fetchAdminUserSchedule } from '../adminApi';

const DAY_SHORT_LABELS = {
  1: 'T2',
  2: 'T3',
  3: 'T4',
  4: 'T5',
  5: 'T6',
  6: 'T7',
  7: 'CN'
};

const DAY_FULL_LABELS = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật'
};

const ROLE_LABELS = {
  doctor: 'Bác sĩ',
  pharmacist: 'Dược sĩ',
  admin: 'Quản trị viên'
};

const SLOT_STATUS_META = {
  available: {
    label: 'Trống',
    cardClass:
      'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300',
    dotClass: 'bg-slate-400'
  },
  holding: {
    label: 'Đang giữ chỗ 5p',
    cardClass:
      'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:border-amber-400',
    dotClass: 'bg-amber-500'
  },
  confirmed: {
    label: 'Đã xác nhận',
    cardClass:
      'border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 hover:border-sky-400',
    dotClass: 'bg-sky-500'
  },
  waiting: {
    label: 'Chờ khám',
    cardClass:
      'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 hover:border-indigo-400',
    dotClass: 'bg-indigo-500'
  },
  in_progress: {
    label: 'Đang khám',
    cardClass:
      'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 hover:border-purple-400',
    dotClass: 'bg-purple-500'
  },
  completed: {
    label: 'Hoàn tất',
    cardClass:
      'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:border-emerald-400',
    dotClass: 'bg-emerald-500'
  }
};

const getVietnamToday = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

const addDaysToIso = (dateStr, days) => {
  const base = new Date(`${dateStr}T00:00:00Z`);
  return new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);
};

const formatDisplayDate = (dateStr) =>
  dateStr ? dateStr.split('-').reverse().join('/') : '';

const StaffScheduleModal = ({ isOpen, user, onClose }) => {
  const [dateBySession, setDateBySession] = useState(() => ({
    userId: null,
    date: getVietnamToday()
  }));
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const selectedDate =
    user?._id && dateBySession.userId === user._id ? dateBySession.date : getVietnamToday();

  const quickDates = useMemo(() => {
    const today = getVietnamToday();
    return {
      today,
      tomorrow: addDaysToIso(today, 1)
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setDateBySession({ userId: null, date: getVietnamToday() });
      setScheduleData(null);
      setError('');
      setSelectedSlot(null);
    } else if (user?._id) {
      setDateBySession({ userId: user._id, date: getVietnamToday() });
      setSelectedSlot(null);
    }
  }, [isOpen, user?._id]);

  useEffect(() => {
    if (!isOpen || !user?._id) return undefined;

    const controller = new AbortController();
    const loadSchedule = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchAdminUserSchedule(user._id, selectedDate, controller.signal);
        if (controller.signal.aborted) return;
        setScheduleData(res?.data || null);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message || 'Không thể tải lịch làm việc nhân sự.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSchedule();
    return () => controller.abort();
  }, [isOpen, user?._id, selectedDate, reloadKey]);

  const { morningSlots, afternoonSlots } = useMemo(() => {
    const slots = scheduleData?.daily?.slots || [];
    return {
      morningSlots: slots.filter((slot) => slot.timeSlot.slice(0, 5) < '12:00'),
      afternoonSlots: slots.filter((slot) => slot.timeSlot.slice(0, 5) >= '12:00')
    };
  }, [scheduleData]);

  const handleDateChange = (nextDate) => {
    if (!nextDate || !user?._id) return;
    setDateBySession({ userId: user._id, date: nextDate });
    setSelectedSlot(null);
  };

  if (!user) return null;

  const staffUser = scheduleData?.user || user;
  const activeDayOfWeek = scheduleData?.dayOfWeek;

  const renderSlotGroup = (title, slots) => {
    if (slots.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> {title} ({slots.length} ca)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {slots.map((slot) => {
            const meta = SLOT_STATUS_META[slot.status] || SLOT_STATUS_META.available;
            const isBooked = slot.status !== 'available' && slot.appointment;
            const isSelected = selectedSlot?.timeSlot === slot.timeSlot;

            return (
              <button
                key={slot.timeSlot}
                type="button"
                disabled={!isBooked}
                onClick={() =>
                  setSelectedSlot((current) =>
                    current?.timeSlot === slot.timeSlot ? null : slot
                  )
                }
                className={`rounded-xl border px-3 py-2 text-left transition-all ${meta.cardClass} ${
                  isSelected ? 'ring-2 ring-primary-500' : ''
                } ${isBooked ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold">{slot.timeSlot}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
                </div>
                <p className="text-[11px] font-medium mt-0.5 truncate">{meta.label}</p>
                {isBooked && (
                  <p className="text-[11px] opacity-85 truncate mt-0.5">
                    {slot.appointment.patientName}
                  </p>
                )}
                {slot.isOffSchedule && (
                  <p className="text-[10px] font-semibold mt-0.5">Ngoài lịch chuẩn</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lịch làm việc nhân sự"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {staffUser.fullName}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                {ROLE_LABELS[staffUser.role] || staffUser.role}
              </span>
              {staffUser.isActive === false && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  Đã khóa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{staffUser.email}</p>
          </div>

          {staffUser.role === 'doctor' && (
            <div className="text-xs sm:text-right space-y-0.5 text-slate-600 dark:text-slate-300">
              <p className="font-semibold flex items-center sm:justify-end gap-1 text-sky-700 dark:text-sky-300">
                <Stethoscope className="w-3.5 h-3.5" />
                {scheduleData?.user?.specialtyName || user.doctorProfile?.specialtyName || 'Chưa phân khoa'}
              </p>
              <p>
                Giá khám:{' '}
                <strong>
                  {Number(
                    scheduleData?.user?.consultationFee ??
                      user.doctorProfile?.consultationFee ??
                      0
                  ).toLocaleString('vi-VN')}{' '}
                  đ
                </strong>
              </p>
            </div>
          )}
        </div>

        {loading && <Loader text="Đang tải lịch làm việc..." />}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-5 text-center">
            <AlertCircle className="w-7 h-7 mx-auto text-red-500" />
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadKey((current) => current + 1)}
              className="mt-3 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Thử lại
            </Button>
          </div>
        )}

        {!loading && !error && scheduleData && (
          <>
            <section className="space-y-2.5">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary-600" /> Lịch làm việc định kỳ theo tuần
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {scheduleData.weeklySchedule.map((day) => {
                  const isSelectedDay = day.dayOfWeek === activeDayOfWeek;
                  return (
                    <div
                      key={day.dayOfWeek}
                      className={`rounded-xl border p-2.5 text-center transition-colors ${
                        day.isWorking
                          ? 'border-primary-200 dark:border-primary-800 bg-primary-50/70 dark:bg-primary-950/30'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/30 opacity-65'
                      } ${isSelectedDay ? 'ring-2 ring-primary-500' : ''}`}
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {DAY_SHORT_LABELS[day.dayOfWeek]}
                      </p>
                      <p className="text-[11px] mt-1 font-medium text-slate-600 dark:text-slate-300">
                        {day.isWorking
                          ? scheduleData.scheduleType === 'doctor'
                            ? `${day.slots.length} ca khám`
                            : 'Hành chính'
                          : 'Nghỉ'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {scheduleData.scheduleType === 'doctor' && scheduleData.daily ? (
              <section className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Ca khám ngày {formatDisplayDate(scheduleData.date)} (
                      {DAY_FULL_LABELS[scheduleData.dayOfWeek]})
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Đối chiếu lịch cấu hình với các lịch hẹn thực tế của bác sĩ. Bấm vào ca đã đặt để xem chi tiết bệnh nhân.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(event) => handleDateChange(event.target.value)}
                      aria-label="Chọn ngày xem lịch"
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedDate === quickDates.today ? 'primary' : 'outline'}
                      onClick={() => handleDateChange(quickDates.today)}
                    >
                      Hôm nay
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedDate === quickDates.tomorrow ? 'primary' : 'outline'}
                      onClick={() => handleDateChange(quickDates.tomorrow)}
                    >
                      Ngày mai
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setReloadKey((current) => current + 1)}
                      aria-label="Làm mới lịch"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      Tổng {scheduleData.daily.stats.totalSlots} ca · Đã đặt/giữ:{' '}
                      {scheduleData.daily.stats.bookedCount} · Còn trống:{' '}
                      {scheduleData.daily.stats.availableCount}
                    </span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      Tỷ lệ lấp đầy: {scheduleData.daily.stats.occupancyRate}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${scheduleData.daily.stats.occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-slate-600 dark:text-slate-300">
                    {Object.entries(SLOT_STATUS_META).map(([key, meta]) => (
                      <span key={key} className="inline-flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                        {meta.label}
                      </span>
                    ))}
                  </div>
                </div>

                {scheduleData.daily.slots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Bác sĩ không có lịch làm việc cố định vào {DAY_FULL_LABELS[scheduleData.dayOfWeek]}.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {renderSlotGroup('Buổi sáng', morningSlots)}
                    {renderSlotGroup('Buổi chiều', afternoonSlots)}
                  </div>
                )}

                {selectedSlot?.appointment && (
                  <div className="rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/60 dark:bg-primary-950/30 p-4 space-y-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-primary-600" />
                        Chi tiết ca {selectedSlot.timeSlot}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {SLOT_STATUS_META[selectedSlot.status]?.label || selectedSlot.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <p>
                        Bệnh nhân: <strong className="text-slate-800 dark:text-slate-100">{selectedSlot.appointment.patientName}</strong>
                      </p>
                      <p>
                        Số điện thoại: <strong className="text-slate-800 dark:text-slate-100">{selectedSlot.appointment.patientPhone}</strong>
                      </p>
                      <p>
                        Thanh toán cọc:{' '}
                        <strong className="text-slate-800 dark:text-slate-100">
                          {selectedSlot.appointment.paymentStatus === 'paid'
                            ? 'Đã xác nhận cọc'
                            : 'Chờ thanh toán'}
                        </strong>
                      </p>
                      {selectedSlot.appointment.symptomsNote && (
                        <p className="sm:col-span-2">
                          Lý do khám / Triệu chứng: <strong className="text-slate-800 dark:text-slate-100">{selectedSlot.appointment.symptomsNote}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Khung giờ làm việc hành chính
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(scheduleData.officeHours?.shifts || []).map((shift) => (
                    <div
                      key={shift.label}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center justify-between text-sm"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {shift.label}
                      </span>
                      <span className="font-bold text-primary-600 dark:text-primary-400">
                        {shift.time}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {scheduleData.officeHours?.note}
                </p>
              </section>
            )}
          </>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default StaffScheduleModal;
