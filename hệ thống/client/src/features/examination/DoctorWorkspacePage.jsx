import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Upload,
  History,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Plus,
  Trash2,
  Stethoscope,
  PlayCircle,
  Eye,
  Edit3,
  Pill,
  ClipboardList,
  ShieldAlert
} from 'lucide-react';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import axiosClient from '../../api/axiosClient';
import PatientQueuePanel from './components/PatientQueuePanel';
import PatientHistoryModal from './components/PatientHistoryModal';

const DEFAULT_MEDICAL_HISTORY = 'Không có tiền sử dị ứng hoặc bệnh nền đặc biệt';

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

  // State danh sách hàng đợi thực từ server & bộ lọc
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Trì hoãn từ khóa tìm kiếm 350ms để tránh lọc lại liên tục mỗi lần gõ phím
  const debouncedSearch = useDebounce(searchTerm, 350);

  // State các trường của form bệnh án điện tử (controlled inputs)
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicalHistory, setMedicalHistory] = useState(DEFAULT_MEDICAL_HISTORY);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // State xử lý lưu, xóa, chuyển trạng thái và thông báo
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // State các Modal phụ
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Tải danh sách hàng đợi khám bệnh từ server (không che giấu lỗi bằng dữ liệu giả)
  const fetchDoctorQueue = useCallback(async () => {
    setLoadingQueue(true);
    setQueueError('');
    try {
      const res = await axiosClient.get('/records/doctor-queue');
      const list = res.success && Array.isArray(res.data) ? res.data : [];
      setPatients(list);
      setActivePatient((prev) => {
        if (list.length === 0) return null;
        const prevId = prev?._id || prev?.appointmentId;
        const matched = list.find((item) => (item._id || item.appointmentId) === prevId);
        return matched || list[0];
      });
    } catch (err) {
      setPatients([]);
      setActivePatient(null);
      setQueueError(
        err.message || 'Không thể tải danh sách hàng đợi khám. Vui lòng kiểm tra quyền truy cập (Bác sĩ/Admin)!'
      );
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (isMounted) {
      fetchDoctorQueue();
    }
    return () => {
      isMounted = false;
    };
  }, [fetchDoctorQueue]);

  // Tự động nạp hồ sơ bệnh án cũ lên form nếu ca khám đã có bệnh án (hỗ trợ xem & chỉnh sửa PUT)
  useEffect(() => {
    let isMounted = true;
    const appointmentId = activePatient?._id || activePatient?.appointmentId;

    if (!appointmentId) {
      setEditingRecordId(null);
      setSymptoms('');
      setDiagnosis('');
      setMedicalHistory(DEFAULT_MEDICAL_HISTORY);
      setClinicalNotes('');
      setAttachedImages([]);
      return () => {};
    }

    const defaultSymptoms = activePatient?.symptomsNote || activePatient?.symptoms || '';

    const loadExistingRecord = async () => {
      if (!activePatient?.hasMedicalRecord) {
        setEditingRecordId(null);
        setSymptoms(defaultSymptoms);
        setDiagnosis('');
        setMedicalHistory(DEFAULT_MEDICAL_HISTORY);
        setClinicalNotes('');
        setAttachedImages([]);
        return;
      }

      setLoadingRecord(true);
      try {
        const res = await axiosClient.get(`/records/appointment/${appointmentId}`);
        if (isMounted && res.success && res.data) {
          const rec = res.data;
          setEditingRecordId(rec._id);
          setSymptoms(rec.symptoms || defaultSymptoms);
          setDiagnosis(rec.diagnosis || '');
          setMedicalHistory(rec.medicalHistory || DEFAULT_MEDICAL_HISTORY);
          setClinicalNotes(rec.clinicalNotes || '');
          setAttachedImages(Array.isArray(rec.attachedImages) ? rec.attachedImages : []);
        }
      } catch (err) {
        if (isMounted) {
          setEditingRecordId(null);
          setSymptoms(defaultSymptoms);
          setDiagnosis('');
          setMedicalHistory(DEFAULT_MEDICAL_HISTORY);
          setClinicalNotes('');
          setAttachedImages([]);
          setStatusMessage({
            type: 'error',
            text: err.message || 'Không thể tải nội dung hồ sơ bệnh án đã lưu!'
          });
        }
      } finally {
        if (isMounted) {
          setLoadingRecord(false);
        }
      }
    };

    loadExistingRecord();

    // Cleanup tránh ghi đè form bằng response cũ khi bác sĩ bấm chuyển bệnh nhân nhanh
    return () => {
      isMounted = false;
    };
  }, [activePatient?._id, activePatient?.appointmentId, activePatient?.hasMedicalRecord]);

  const handleSelectPatient = (patient) => {
    setActivePatient(patient);
    setStatusMessage(null);
  };

  // Tính thống kê ca khám trong ngày bằng useMemo
  const stats = useMemo(() => {
    const total = patients.length;
    const waiting = patients.filter((p) => p.status === 'waiting' || p.status === 'confirmed').length;
    const inProgress = patients.filter((p) => p.status === 'in_progress').length;
    const completed = patients.filter((p) => p.status === 'completed' || p.hasMedicalRecord).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, waiting, inProgress, completed, rate };
  }, [patients]);

  // Lọc danh sách theo trạng thái + từ khóa đã debounce (hỗ trợ tiếng Việt không dấu)
  const filteredPatients = useMemo(() => {
    const term = normalizeText(debouncedSearch);
    return patients.filter((p) => {
      const isDone = p.status === 'completed' || p.hasMedicalRecord;
      const isWaiting = p.status === 'waiting' || p.status === 'confirmed';

      if (statusFilter === 'waiting' && !isWaiting) return false;
      if (statusFilter === 'in_progress' && p.status !== 'in_progress') return false;
      if (statusFilter === 'completed' && !isDone) return false;

      if (!term) return true;
      const name = normalizeText(p.patientName || p.patientId?.fullName || '');
      const phone = normalizeText(p.patientPhone || p.patientId?.phone || '');
      const sym = normalizeText(p.symptomsNote || p.symptoms || '');
      return name.includes(term) || phone.includes(term) || sym.includes(term);
    });
  }, [patients, debouncedSearch, statusFilter]);

  // Chuyển trạng thái ca khám: waiting/confirmed -> in_progress (chỉ cập nhật UI khi API thành công)
  const handleStartExamination = async () => {
    if (!activePatient) return;
    const targetId = activePatient._id || activePatient.appointmentId;
    setIsUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const res = await axiosClient.patch(`/records/appointments/${targetId}/status`, {
        status: 'in_progress'
      });

      setPatients((prev) =>
        prev.map((p) =>
          (p._id || p.appointmentId) === targetId ? { ...p, status: 'in_progress' } : p
        )
      );
      setActivePatient((prev) => (prev ? { ...prev, status: 'in_progress' } : prev));
      setStatusMessage({
        type: 'success',
        text:
          res.message ||
          `Đã tiếp nhận bệnh nhân ${activePatient.patientName || activePatient.patientId?.fullName} vào phòng khám!`
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Không thể chuyển trạng thái ca khám. Vui lòng thử lại!'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Lưu mới (POST /api/records) hoặc Cập nhật bệnh án đã có (PUT /api/records/:id)
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    const appointmentId = activePatient?._id || activePatient?.appointmentId;
    const patientId = activePatient?.patientId?._id || activePatient?.patientId;

    if (!appointmentId || !patientId) {
      setStatusMessage({
        type: 'error',
        text: 'Không xác định được mã lịch hẹn hoặc mã bệnh nhân hợp lệ!'
      });
      return;
    }

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
      appointmentId,
      patientId,
      doctorId: user?.id,
      symptoms: symptoms.trim(),
      diagnosis: diagnosis.trim(),
      medicalHistory: medicalHistory.trim() || DEFAULT_MEDICAL_HISTORY,
      clinicalNotes: clinicalNotes.trim(),
      attachedImages
    };

    try {
      if (editingRecordId) {
        const res = await axiosClient.put(`/records/${editingRecordId}`, payload);
        setStatusMessage({
          type: 'success',
          text: res.message || 'Cập nhật hồ sơ bệnh án thành công!'
        });
      } else {
        const res = await axiosClient.post('/records', payload);
        const createdId = res.data?._id || null;
        setEditingRecordId(createdId);
        setStatusMessage({
          type: 'success',
          text: res.message || 'Đã lưu hồ sơ bệnh án điện tử thành công!',
          showPrescribeAction: Boolean(createdId)
        });

        setPatients((prev) =>
          prev.map((p) =>
            (p._id || p.appointmentId) === appointmentId
              ? { ...p, status: 'completed', hasMedicalRecord: true, medicalRecordId: createdId }
              : p
          )
        );
        setActivePatient((prev) =>
          prev
            ? {
                ...prev,
                status: 'completed',
                hasMedicalRecord: true,
                medicalRecordId: createdId
              }
            : prev
        );
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Không thể lưu bệnh án. Vui lòng kiểm tra kết nối máy chủ!'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa hồ sơ bệnh án (DELETE /api/records/:id) và đưa ca khám về trạng thái Đang khám
  const handleConfirmDeleteRecord = async () => {
    if (!editingRecordId) return;
    setIsDeleting(true);
    setStatusMessage(null);

    try {
      const res = await axiosClient.delete(`/records/${editingRecordId}`);
      const targetAppId = activePatient?._id || activePatient?.appointmentId;

      setEditingRecordId(null);
      setDiagnosis('');
      setClinicalNotes('');
      setAttachedImages([]);
      setIsDeleteModalOpen(false);

      setPatients((prev) =>
        prev.map((p) =>
          (p._id || p.appointmentId) === targetAppId
            ? { ...p, status: 'in_progress', hasMedicalRecord: false, medicalRecordId: null }
            : p
        )
      );
      setActivePatient((prev) =>
        prev
          ? {
              ...prev,
              status: 'in_progress',
              hasMedicalRecord: false,
              medicalRecordId: null
            }
          : prev
      );

      setStatusMessage({
        type: 'success',
        text: res.message || 'Đã xóa hồ sơ bệnh án. Bạn có thể lập lại bệnh án mới cho ca khám này.'
      });
    } catch (err) {
      setIsDeleteModalOpen(false);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Không thể xóa hồ sơ bệnh án!'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Xem lịch sử các lần khám trước của bệnh nhân
  const handleViewPatientHistory = async () => {
    const pId = activePatient?.patientId?._id || activePatient?.patientId;
    if (!pId) return;

    setIsHistoryOpen(true);
    setLoadingHistory(true);
    setHistoryError('');
    try {
      const res = await axiosClient.get(`/records/patient/${pId}`);
      setPatientHistory(res.success && Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setPatientHistory([]);
      setHistoryError(err.message || 'Không thể tải lịch sử khám bệnh của bệnh nhân!');
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

  // Chuyển nhanh từ bàn khám sang tab Kê đơn thuốc (TV 4) kèm sẵn patientId và recordId
  const handleForwardToPharmacy = () => {
    const patientId = activePatient?.patientId?._id || activePatient?.patientId;
    const recordId = editingRecordId || activePatient?.medicalRecordId || '';
    const params = new URLSearchParams({ tab: 'prescribe' });
    if (patientId) params.set('patientId', patientId);
    if (recordId) params.set('recordId', recordId);

    navigate(`/pharmacy?${params.toString()}`, {
      state: {
        tab: 'prescribe',
        appointmentId: activePatient?._id || activePatient?.appointmentId,
        recordId,
        medicalRecordId: recordId,
        patientId,
        patientName: activePatient?.patientName || activePatient?.patientId?.fullName,
        diagnosis: diagnosis.trim()
      }
    });
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
              Theo dõi hàng đợi khám, tiếp nhận ca khám, lập hoặc cập nhật hồ sơ bệnh án điện tử.
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
        {/* Cột trái: Component Hàng đợi bệnh nhân */}
        <PatientQueuePanel
          patients={filteredPatients}
          totalCount={patients.length}
          activePatient={activePatient}
          loading={loadingQueue}
          error={queueError}
          onRetry={fetchDoctorQueue}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onSelectPatient={handleSelectPatient}
        />

        {/* Cột phải: Form lập / cập nhật hồ sơ bệnh án điện tử */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
          {loadingQueue ? (
            <div className="py-16">
              <Loader text="Đang tải dữ liệu bàn làm việc bác sĩ..." />
            </div>
          ) : queueError ? (
            <div className="py-14 px-6 text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                Không thể truy cập hàng đợi khám bệnh
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 max-w-md mx-auto">
                {queueError}
              </p>
              <div className="pt-2">
                <Button type="button" variant="primary" size="sm" onClick={fetchDoctorQueue}>
                  Thử kết nối lại
                </Button>
              </div>
            </div>
          ) : !activePatient ? (
            <div className="py-16 px-6 text-center space-y-3">
              <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">
                Chưa có bệnh nhân nào được chọn
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Hiện tại hàng đợi khám đang trống. Khi có lịch hẹn mới được xác nhận, hãy bấm{' '}
                <strong>Làm mới hàng đợi</strong> hoặc chọn bệnh nhân ở danh sách bên trái để lập hồ sơ bệnh án điện tử.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Hồ Sơ Bệnh Án: {activePatient.patientName || activePatient.patientId?.fullName}
                    </h2>
                    {editingRecordId && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                        Đã lưu (#{editingRecordId.slice(-6)})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã lịch hẹn: #APP-{activePatient._id?.slice(-6)} | Ngày khám: {activePatient.date}
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
                    {activePatient.timeSlot}
                  </span>
                </div>
              </div>

              {statusMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
                      : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900'
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
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {statusMessage.type === 'success' && editingRecordId && (
                      <button
                        type="button"
                        onClick={handleForwardToPharmacy}
                        className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                      >
                        <Pill className="w-3.5 h-3.5 mr-1" /> Kê đơn thuốc cho bệnh án này
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setStatusMessage(null)}
                      className="text-xs font-bold underline opacity-80 hover:opacity-100"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}

              {loadingRecord ? (
                <Loader text="Đang tải hồ sơ bệnh án đã lưu..." />
              ) : (
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
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {editingRecordId ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40 flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa bệnh án
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          * Lưu bệnh án trước để liên kết kê đơn thuốc cho bệnh nhân.
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2.5 w-full sm:w-auto">
                      {editingRecordId && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleForwardToPharmacy}
                          className="flex-1 sm:flex-none flex items-center justify-center border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                        >
                          <Pill className="w-4 h-4 mr-1.5" /> Kê đơn thuốc cho bệnh án này
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none flex items-center justify-center min-w-[175px]"
                      >
                        {isSubmitting ? (
                          'Đang xử lý...'
                        ) : editingRecordId ? (
                          <>
                            <Edit3 className="w-4 h-4 mr-1.5" /> Cập Nhật Bệnh Án
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4 mr-1.5" /> Lưu Bệnh Án Điện Tử
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Lịch sử khám bệnh */}
      <PatientHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        patientName={activePatient?.patientName || activePatient?.patientId?.fullName}
        loading={loadingHistory}
        error={historyError}
        history={patientHistory}
      />

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

      {/* Modal xác nhận xóa bệnh án */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa hồ sơ bệnh án"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Bạn có chắc chắn muốn xóa hồ sơ bệnh án của bệnh nhân{' '}
            <strong>{activePatient?.patientName || activePatient?.patientId?.fullName}</strong>? Trạng thái ca khám sẽ được chuyển về <strong>Đang khám</strong> để bạn có thể lập lại bệnh án mới.
          </p>
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isDeleting}
              onClick={handleConfirmDeleteRecord}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorWorkspacePage;
