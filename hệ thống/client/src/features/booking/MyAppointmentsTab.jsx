import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import {
  selectDoctor,
  selectDate,
  selectSlot,
  setPatientInfo,
  setHoldingInfo,
  setStep
} from '../../store/slices/bookingSlice';
import axiosClient from '../../api/axiosClient';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  CreditCard
} from 'lucide-react';
import Button from '../../components/common/Button';
import { Link } from 'react-router-dom';

const STATUS_BADGES = {
  holding: { label: 'Đang giữ chỗ 5p', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  confirmed: { label: 'Đã xác nhận cọc', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  waiting: { label: 'Đang chờ khám', bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  in_progress: { label: 'Đang trong ca khám', bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
  completed: { label: 'Đã hoàn thành', bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  cancelled: { label: 'Đã hủy', bg: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' }
};

const MyAppointmentsTab = ({ onStartBookingNew, onContinueHold }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const fetchAppointments = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axiosClient.get('/appointments/my-appointments');
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi tải lịch hẹn của bạn!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [isAuthenticated]);

  const handleContinuePayment = (appt) => {
    const bookingCode = appt._id.slice(-6).toUpperCase();
    const expiresAtMs = appt.holdingExpiresAt
      ? new Date(appt.holdingExpiresAt).getTime()
      : Date.now() + 300000;
    const secondsRemaining = Math.max(1, Math.floor((expiresAtMs - Date.now()) / 1000));
    const depositAmount = appt.depositAmount || 50000;
    const vietQrUrl = `https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=${depositAmount}&addInfo=MEDCARE%20${bookingCode}&accountName=MEDCARE%20CLINIC`;

    dispatch(
      selectDoctor({
        id: appt.doctorId?._id || appt.doctorId,
        doctorId: appt.doctorId?._id || appt.doctorId,
        doctorProfileId: appt.doctorProfileId?._id || appt.doctorProfileId,
        name: appt.doctorId?.fullName || 'Bác sĩ MedCare',
        specialty: appt.doctorProfileId?.specialtyId?.name || 'Đa khoa',
        hospital: appt.doctorProfileId?.hospital || 'Phòng khám Đa khoa MedCare',
        avatar: appt.doctorId?.avatar,
        fee: appt.fee || appt.doctorProfileId?.consultationFee || 350000
      })
    );
    dispatch(selectDate(appt.date));
    dispatch(selectSlot(appt.timeSlot));
    dispatch(
      setPatientInfo({
        fullName: appt.patientName || '',
        phone: appt.patientPhone || '',
        symptoms: appt.symptomsNote || ''
      })
    );
    dispatch(
      setHoldingInfo({
        appointmentId: appt._id,
        bookingCode,
        holdingExpiresAt: appt.holdingExpiresAt,
        secondsRemaining,
        depositAmount,
        vietQrUrl,
        appointment: appt
      })
    );
    dispatch(setStep(3));
    if (onContinueHold) {
      onContinueHold();
    }
  };

  const handleCancel = async (apptId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn khám này không? Khung giờ sẽ được giải phóng cho bệnh nhân khác.')) {
      return;
    }
    try {
      setCancellingId(apptId);
      const res = await axiosClient.post(`/appointments/${apptId}/cancel`);
      if (res.success) {
        fetchAppointments();
      }
    } catch (err) {
      alert(err.message || 'Không thể hủy lịch hẹn!');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4 shadow-sm">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Vui lòng đăng nhập để xem lịch hẹn của bạn
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Đăng nhập bằng tài khoản Bệnh nhân để quản lý lịch hẹn, theo dõi trạng thái tiếp nhận và xem kết quả hồ sơ bệnh án điện tử.
        </p>
        <Link to="/login">
          <Button variant="primary">Đăng nhập ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Lịch Hẹn Của Tôi ({appointments.length})
          </h2>
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-600' : ''}`} />
          </button>
        </div>

        <Button variant="outline" size="sm" onClick={onStartBookingNew}>
          + Đặt thêm ca mới
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" /> {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
          <span>Đang tải lịch hẹn...</span>
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 space-y-3">
          <Calendar className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm">Bạn chưa có lịch hẹn khám nào.</p>
          <Button variant="primary" size="sm" onClick={onStartBookingNew}>
            Đặt lịch khám ngay
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const badge = STATUS_BADGES[appt.status] || STATUS_BADGES.confirmed;
            const doctorName = appt.doctorId?.fullName || 'Bác sĩ MedCare';
            const specialtyName = appt.doctorProfileId?.specialtyId?.name || 'Đa khoa';
            const bookingCode = appt._id.slice(-6).toUpperCase();
            const canCancel = ['holding', 'confirmed'].includes(appt.status);
            const isValidHolding =
              appt.status === 'holding' &&
              (!appt.holdingExpiresAt || new Date(appt.holdingExpiresAt).getTime() > Date.now());

            return (
              <div
                key={appt._id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:border-primary-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={appt.doctorId?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80'}
                    alt={doctorName}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{bookingCode}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      {doctorName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center">
                        <Stethoscope className="w-3.5 h-3.5 mr-1 text-primary-600" />
                        {specialtyName}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-primary-600" />
                        {appt.date}
                      </span>
                      <span className="flex items-center font-mono font-bold text-primary-600">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {appt.timeSlot}
                      </span>
                    </div>

                    {appt.symptomsNote && (
                      <p className="text-xs text-slate-500 line-clamp-1 italic">
                        Triệu chứng: {appt.symptomsNote}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-end">
                  <div className="text-right mr-2 hidden sm:block">
                    <span className="text-[11px] text-slate-400 block">Tiền cọc</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {(appt.depositAmount || 50000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {isValidHolding && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleContinuePayment(appt)}
                      className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      Tiếp tục thanh toán cọc
                    </Button>
                  )}

                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={cancellingId === appt._id}
                      onClick={() => handleCancel(appt._id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {cancellingId === appt._id
                        ? 'Đang hủy...'
                        : appt.status === 'holding'
                        ? 'Hủy giữ chỗ'
                        : 'Hủy hẹn'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAppointmentsTab;

