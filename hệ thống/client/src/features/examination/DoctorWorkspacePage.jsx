import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle,
  Upload,
  History,
  Search,
  Clock,
  AlertCircle,
  Activity,
  FileCheck,
  RefreshCw,
  Plus,
  Trash2,
  Stethoscope,
  PlayCircle,
  Eye
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import axiosClient from '../../api/axiosClient';

// Dữ liệu mẫu dùng khi chưa kết nối database hoặc chưa có lịch hẹn trong ngày
const FALLBACK_PATIENTS = [
  {
    _id: 'app_demo_01',
    appointmentId: 'app_demo_01',
    patientId: { _id: 'pat_01', fullName: 'Trần Văn Bình', email: 'binh.tran@gmail.com', phone: '0912345678' },
    patientName: 'Trần Văn Bình',
    patientPhone: '0912345678',
    date: '2026-11-22',
    timeSlot: '08:00 - 08:30',
    status: 'in_progress',
    symptomsNote: 'Đau tức ngực trái khi gắng sức, hồi hộp khó thở nhẹ',
    hasMedicalRecord: false
  },
  {
    _id: 'app_demo_02',
    appointmentId: 'app_demo_02',
    patientId: { _id: 'pat_02', fullName: 'Lê Thị Thu', email: 'thu.le@gmail.com', phone: '0987654321' },
    patientName: 'Lê Thị Thu',
    patientPhone: '0987654321',
    date: '2026-11-22',
    timeSlot: '09:00 - 09:30',
    status: 'waiting',
    symptomsNote: 'Khó thở về đêm, tim đập nhanh kèm đau đầu thoáng qua',
    hasMedicalRecord: false
  },
  {
    _id: 'app_demo_03',
    appointmentId: 'app_demo_03',
    patientId: { _id: 'pat_03', fullName: 'Phạm Minh Đức', email: 'duc.pham@gmail.com', phone: '0903112233' },
    patientName: 'Phạm Minh Đức',
    patientPhone: '0903112233',
    date: '2026-11-22',
    timeSlot: '09:30 - 10:00',
    status: 'completed',
    symptomsNote: 'Tái khám định kỳ tăng huyết áp vô căn',
    hasMedicalRecord: true
  }
];

// Chuẩn hóa tiếng Việt (bỏ dấu & viết thường) để tìm được cả "Thùy", "Thuỳ" lẫn "thuy"
const normalizeText = (str = '') =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

const DoctorWorkspacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // State danh sách hàng đợi khám
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Trì hoãn từ khóa tìm kiếm 350ms để tránh lọc lại liên tục mỗi lần gõ phím
  const debouncedSearch = useDebounce(searchTerm, 350);

  // State các trường của form bệnh án điện tử (controlled inputs)
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // State xử lý lưu, chuyển trạng thái và thông báo
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // State Modal lịch sử khám cũ và Modal phóng to ảnh xét nghiệm
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Lấy danh sách bệnh nhân chờ khám từ server
  const fetchDoctorQueue = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await axiosClient.get('/records/doctor-queue');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setPatients(res.data);
        setActivePatient(res.data[0]);
        setSymptoms(res.data[0]?.symptomsNote || '');
      } else {
        setPatients([]); setActivePatient(null);
      }
    } catch (err) {
      setPatients([]); setActivePatient(null);
      setStatusMessage({ type: 'error', text: err.message || 'Không thể tải hàng đợi khám.' });
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      fetchDoctorQueue();
    }
    // Cleanup tránh cập nhật state khi component đã unmount
    return () => {
      isMounted = false;
    };
  }, [fetchDoctorQueue]);

  const handleSelectPatient = (patient) => {
    setActivePatient(patient);
    setSymptoms(patient.symptomsNote || patient.symptoms || '');
    setDiagnosis(''); setMedicalHistory(''); setClinicalNotes(''); setAttachedImages([]);
    setStatusMessage(null);
  };

  // Tính nhanh thống kê ca khám trong ngày bằng useMemo
  const stats = useMemo(() => {
    const total = patients.length;
    const waiting = patients.filter((p) => p.status === 'waiting' || p.status === 'confirmed').length;
    const inProgress = patients.filter((p) => p.status === 'in_progress').length;
    const completed = patients.filter((p) => p.status === 'completed' || p.hasMedicalRecord).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, waiting, inProgress, completed, rate };
  }, [patients]);

  // Lọc danh sách bệnh nhân theo từ khóa đã debounce (hỗ trợ tiếng Việt không dấu & khác kiểu bỏ dấu)
  const filteredPatients = useMemo(() => {
    const term = normalizeText(debouncedSearch);
    if (!term) return patients;
    return patients.filter((p) => {
      const name = normalizeText(p.patientName || p.patientId?.fullName || '');
      const phone = normalizeText(p.patientPhone || p.patientId?.phone || '');
      const sym = normalizeText(p.symptomsNote || p.symptoms || '');
      return name.includes(term) || phone.includes(term) || sym.includes(term);
    });
  }, [patients, debouncedSearch]);

  // Chuyển trạng thái ca khám từ Chờ khám (waiting) sang Đang khám (in_progress)
  const handleStartExamination = async () => {
    if (!activePatient) return;
    const targetId = activePatient._id || activePatient.appointmentId;
    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      await axiosClient.patch(`/records/appointments/${targetId}/status`, {
        status: 'in_progress'
      });
      setStatusMessage({
        type: 'success',
        text: `Đã tiếp nhận bệnh nhân ${activePatient.patientName || activePatient.patientId?.fullName} vào phòng khám!`
      });
      setPatients((prev) => prev.map((p) => (p._id || p.appointmentId) === targetId ? { ...p, status: 'in_progress' } : p));
      setActivePatient((prev) => ({ ...prev, status: 'in_progress' }));
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Không thể chuyển trạng thái ca khám.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Lưu hồ sơ bệnh án điện tử (POST /api/records)
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (!activePatient) { setStatusMessage({ type: 'error', text: 'Vui lòng chọn lịch khám.' }); return; }
    if (!symptoms.trim() || !diagnosis.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Vui lòng nhập đầy đủ triệu chứng và kết luận chẩn đoán!'
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const payload = {
      appointmentId: activePatient?._id || activePatient?.appointmentId,
      patientId: activePatient?.patientId?._id || activePatient?.patientId,
      doctorId: user?.id,
      symptoms: symptoms.trim(),
      diagnosis: diagnosis.trim(),
      medicalHistory: medicalHistory.trim(),
      clinicalNotes: clinicalNotes.trim(),
      attachedImages
    };

    try {
      const res = await axiosClient.post('/records', payload);
      setStatusMessage({
        type: 'success',
        text: res.message || 'Đã lưu hồ sơ bệnh án điện tử thành công!'
      });

      setPatients((prev) =>
        prev.map((p) =>
          p._id === activePatient._id
            ? { ...p, status: 'completed', hasMedicalRecord: true }
            : p
        )
      );
      setActivePatient((prev) => ({ ...prev, status: 'completed', hasMedicalRecord: true }));
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Không thể lưu bệnh án. Vui lòng kiểm tra kết nối máy chủ!'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xem lịch sử các lần khám trước của bệnh nhân
  const handleViewPatientHistory = async () => {
    const pId = activePatient?.patientId?._id || activePatient?.patientId;
    if (!pId) return;
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const res = await axiosClient.get(`/records/patient/${pId}`);
      if (res.success && Array.isArray(res.data)) {
        setPatientHistory(res.data);
      } else {
        setPatientHistory([]);
      }
    } catch (err) {
      setPatientHistory([]);
      setStatusMessage({ type: 'error', text: err.message || 'Không thể tải lịch sử khám.' });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Chọn file ảnh kết quả xét nghiệm từ máy tính và xem trước
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WEBP)!' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Dung lượng ảnh không được vượt quá 5MB!' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAttachedImages((prev) => [...prev, reader.result]);
        setStatusMessage(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (newImageUrl.trim()) {
      setAttachedImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Chuyển thông tin bệnh nhân sang phân hệ Kê đơn thuốc (TV4)
  const handleForwardToPharmacy = async () => {
    if (!activePatient?.hasMedicalRecord) { setStatusMessage({ type: 'error', text: 'Hãy lưu bệnh án trước khi kê đơn.' }); return; }
    try {
      const record = await axiosClient.get(`/records/appointment/${activePatient._id}`);
      navigate('/pharmacy', {
      state: {
        recordId: record.data._id,
        appointmentId: activePatient?._id || activePatient?.appointmentId,
        patientId: activePatient?.patientId?._id || activePatient?.patientId,
        patientName: activePatient?.patientName || activePatient?.patientId?.fullName,
        diagnosis: diagnosis.trim()
      }
      });
    } catch (err) { setStatusMessage({ type: 'error', text: err.message || 'Không thể tải bệnh án.' }); }
  };

  const isWaitingPatient =
    activePatient?.status === 'waiting' || activePatient?.status === 'confirmed';

  return (
    <div className="space-y-6">
      {/* Header & Thống kê ca trực */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-full text-xs font-semibold">
                Phân hệ TV 3: Bàn làm việc Bác sĩ & Hồ sơ Bệnh án (EHR)
              </span>
              <span className="text-xs text-slate-400">
                | Phụ trách: <strong>Vương Gia Khánh</strong>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2 flex items-center">
              <Stethoscope className="w-7 h-7 mr-2.5 text-primary-600" />
              Phòng Khám Bác Sĩ – Tiếp Nhận & Lập Bệnh Án Điện Tử
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Theo dõi hàng đợi khám, gọi bệnh nhân vào khám, lưu chẩn đoán và kết quả cận lâm sàng.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDoctorQueue}
            className="flex items-center self-start md:self-center"
            disabled={loadingQueue}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingQueue ? 'animate-spin' : ''}`} />
            Làm mới hàng đợi
          </Button>
        </div>

        {/* Thống kê ca khám trong ngày */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
            <span className="text-xs text-slate-500">Tổng ca khám</span>
            <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
            <span className="text-xs text-amber-700 dark:text-amber-400">Đang chờ khám</span>
            <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{stats.waiting}</div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
            <span className="text-xs text-blue-700 dark:text-blue-400">Đang khám</span>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{stats.inProgress}</div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
            <span className="text-xs text-emerald-700 dark:text-emerald-400">Đã hoàn thành</span>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {stats.completed} <span className="text-xs font-normal">({stats.rate}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột trái: Hàng đợi bệnh nhân */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <ClipboardList className="w-5 h-5 mr-2 text-primary-600" /> Hàng Đợi Khám Bệnh
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {filteredPatients.length} ca
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT hoặc triệu chứng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Không tìm thấy bệnh nhân phù hợp
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isCurrent =
                  (activePatient?._id || activePatient?.appointmentId) === (p._id || p.appointmentId);
                const pName = p.patientName || p.patientId?.fullName || 'Bệnh nhân';
                const pSlot = p.timeSlot || '08:00 - 08:30';
                const pSymptoms = p.symptomsNote || p.symptoms || 'Chưa ghi nhận triệu chứng';
                const isDone = p.status === 'completed' || p.hasMedicalRecord;

                return (
                  <div
                    key={p._id || p.appointmentId}
                    onClick={() => handleSelectPatient(p)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/50'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{pName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center">
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

        {/* Cột phải: Form lập hồ sơ bệnh án điện tử */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Hồ Sơ Bệnh Án: {activePatient?.patientName || activePatient?.patientId?.fullName || 'Chưa chọn'}
                </h2>
                {activePatient?.hasMedicalRecord && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                    Đã lưu CSDL
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mã hồ sơ: #EHR-{activePatient?._id?.slice(-6) || '2026'} | Ngày khám: {activePatient?.date || 'Hôm nay'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isWaitingPatient && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleStartExamination}
                  disabled={isUpdatingStatus}
                  className="flex items-center text-xs"
                >
                  <PlayCircle className="w-3.5 h-3.5 mr-1" />
                  {isUpdatingStatus ? 'Đang chuyển...' : 'Bắt đầu khám'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleViewPatientHistory}
                className="flex items-center text-xs"
              >
                <History className="w-3.5 h-3.5 mr-1 text-primary-600" />
                Lịch sử khám cũ
              </Button>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                {activePatient?.timeSlot || '08:00 - 08:30'}
              </span>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border text-sm flex items-center justify-between ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-xs font-bold underline opacity-80 hover:opacity-100 ml-3"
              >
                Đóng
              </button>
            </div>
          )}

          <form onSubmit={handleSaveRecord} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lý do khám / Triệu chứng lâm sàng ban đầu <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                required
                placeholder="Ghi nhận triệu chứng người bệnh khai báo..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tiền sử bệnh án & Dị ứng thuốc
              </label>
              <textarea
                rows={2}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="Tiền sử bệnh lý gia đình, bệnh nền, dị ứng thuốc..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kết luận chẩn đoán chuyên môn (ICD-10) <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
                placeholder="Ví dụ: I10 - Tăng huyết áp vô căn..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Hướng điều trị & Dặn dò y lệnh
              </label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Dặn dò sinh hoạt, dinh dưỡng hoặc chỉ định xét nghiệm thêm..."
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            {/* Upload và xem trước ảnh kết quả xét nghiệm / siêu âm */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Hình ảnh cận lâm sàng (Siêu âm, Điện tim, X-Quang)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center text-xs"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Tải ảnh từ máy
                </Button>
              </div>

              {attachedImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {attachedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 h-24 bg-slate-100 dark:bg-slate-900"
                    >
                      <img src={img} alt={`Kết quả ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img)}
                          className="p-1.5 bg-white/90 text-slate-800 rounded-md hover:bg-white"
                          title="Xem phóng to"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1.5 bg-red-600 text-white rounded-md hover:bg-red-700"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Hoặc dán URL ảnh chụp xét nghiệm / siêu âm..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleAddImageUrl}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm link
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700 gap-3">
              <span className="text-xs text-slate-400">
                * Hồ sơ bệnh án được bảo mật và lưu trữ điện tử theo mã lịch hẹn.
              </span>
              <div className="flex space-x-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleForwardToPharmacy}
                  className="flex-1 sm:flex-none"
                >
                  Chuyển Kê Đơn Thuốc (TV4)
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none flex items-center justify-center min-w-[170px]"
                >
                  {isSubmitting ? (
                    'Đang Lưu...'
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4 mr-1.5" /> Lưu Bệnh Án Điện Tử
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Lịch sử khám bệnh */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Lịch Sử Khám Bệnh: ${activePatient?.patientName || activePatient?.patientId?.fullName || ''}`}
        maxWidth="max-w-2xl"
      >
        {loadingHistory ? (
          <Loader text="Đang tải lịch sử bệnh án..." />
        ) : patientHistory.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm">
            Bệnh nhân chưa có lịch sử bệnh án trước đây.
          </div>
        ) : (
          <div className="space-y-4">
            {patientHistory.map((rec) => (
              <div
                key={rec._id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    Ngày khám: {new Date(rec.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Bác sĩ: {rec.doctorId?.fullName || 'Bác sĩ phụ trách'}
                  </span>
                </div>
                <div className="text-sm">
                  <strong className="text-slate-800 dark:text-slate-200">Chẩn đoán: </strong>
                  <span className="text-slate-700 dark:text-slate-300">{rec.diagnosis}</span>
                </div>
                <div className="text-xs text-slate-500">
                  <strong>Triệu chứng: </strong> {rec.symptoms}
                </div>
                {rec.clinicalNotes && (
                  <div className="text-xs text-slate-500">
                    <strong>Ghi chú: </strong> {rec.clinicalNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Modal xem phóng to ảnh xét nghiệm */}
      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="Xem trước hình ảnh cận lâm sàng"
        maxWidth="max-w-3xl"
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Ảnh kết quả cận lâm sàng"
            className="w-full max-h-[70vh] object-contain rounded-lg"
          />
        )}
      </Modal>
    </div>
  );
};

export default DoctorWorkspacePage;
