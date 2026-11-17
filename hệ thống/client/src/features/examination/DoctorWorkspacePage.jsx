import React, { useEffect, useState } from 'react';
import { CheckCircle, ClipboardList, FileText, PlayCircle, Save, User } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useFetch } from '../../hooks/useFetch';

const statusLabel = {
  confirmed: 'Đã xác nhận',
  waiting: 'Đang chờ',
  in_progress: 'Đang khám',
  completed: 'Đã hoàn tất'
};

const DoctorWorkspacePage = () => {
  const { data, loading, error, refetch } = useFetch('/appointments/doctor-queue');
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [form, setForm] = useState({ symptoms: '', medicalHistory: '', diagnosis: '', clinicalNotes: '' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const appointments = data?.data || [];

  useEffect(() => {
    if (!activeAppointment && appointments.length > 0) setActiveAppointment(appointments[0]);
  }, [appointments, activeAppointment]);

  const selectAppointment = (appointment) => {
    setActiveAppointment(appointment);
    setForm({ symptoms: appointment.symptomsNote || '', medicalHistory: '', diagnosis: '', clinicalNotes: '' });
    setMessage('');
  };

  const updateStatus = async (status) => {
    try {
      const response = await axiosClient.patch(`/appointments/${activeAppointment._id}/status`, { status });
      setActiveAppointment(response.data);
      setMessage(`Đã chuyển trạng thái thành ${statusLabel[status]}.`);
      refetch();
    } catch (requestError) {
      setMessage(requestError.message || 'Không thể cập nhật trạng thái khám.');
    }
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await axiosClient.post('/records', { appointmentId: activeAppointment._id, ...form });
      setMessage('Đã lưu bệnh án điện tử và hoàn tất ca khám.');
      refetch();
    } catch (requestError) {
      setMessage(requestError.message || 'Không thể lưu bệnh án.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader text="Đang tải danh sách khám..." />;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>;

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded-full text-xs font-semibold mb-2">Phân hệ TV 3: Bàn làm việc Bác sĩ & EHR</span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Phòng khám bác sĩ</h1>
        <p className="text-sm text-slate-500 mt-1">Tiếp nhận, khám và lưu bệnh án điện tử cho bệnh nhân theo lịch hẹn.</p>
      </section>
      {message && <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">{message}</div>}
      {appointments.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center text-slate-500">Chưa có lịch khám nào dành cho bác sĩ này.</div> : <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-primary-600" />Danh sách khám</h2>
          <div className="space-y-2">{appointments.map((appointment) => <button key={appointment._id} onClick={() => selectAppointment(appointment)} className={`w-full text-left p-3 rounded-xl border ${activeAppointment?._id === appointment._id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex justify-between text-sm"><strong>{appointment.patientName}</strong><span>{appointment.timeSlot.replace('-', ' - ')}</span></div>
            <p className="text-xs text-slate-500 mt-1 truncate">{appointment.symptomsNote || 'Chưa ghi nhận triệu chứng'}</p>
            <span className="inline-block mt-2 text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">{statusLabel[appointment.status]}</span>
          </button>)}</div>
        </aside>
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div><h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center"><User className="w-5 h-5 mr-2 text-primary-600" />{activeAppointment?.patientName}</h2><p className="text-xs text-slate-500">Lịch {activeAppointment?.date}, {activeAppointment?.timeSlot.replace('-', ' - ')}</p></div>
            {activeAppointment?.status === 'confirmed' && <Button size="sm" variant="outline" onClick={() => updateStatus('waiting')}>Tiếp nhận</Button>}
            {activeAppointment?.status === 'waiting' && <Button size="sm" variant="primary" onClick={() => updateStatus('in_progress')}><PlayCircle className="w-4 h-4 mr-1" />Bắt đầu khám</Button>}
          </div>
          {activeAppointment?.status === 'completed' ? <div className="py-12 text-center text-emerald-600"><CheckCircle className="w-10 h-10 mx-auto mb-2" />Ca khám này đã hoàn tất. Bệnh án đã được lưu.</div> : <form onSubmit={saveRecord} className="mt-5 space-y-4">
            <label className="block text-sm font-medium">Triệu chứng<textarea required rows={2} value={form.symptoms} onChange={(event) => setForm((current) => ({ ...current, symptoms: event.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border dark:bg-slate-900" /></label>
            <label className="block text-sm font-medium">Tiền sử bệnh và dị ứng<textarea rows={2} value={form.medicalHistory} onChange={(event) => setForm((current) => ({ ...current, medicalHistory: event.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border dark:bg-slate-900" /></label>
            <label className="block text-sm font-medium">Chẩn đoán<textarea required rows={3} value={form.diagnosis} onChange={(event) => setForm((current) => ({ ...current, diagnosis: event.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border dark:bg-slate-900" /></label>
            <label className="block text-sm font-medium">Ghi chú chuyên môn<textarea rows={2} value={form.clinicalNotes} onChange={(event) => setForm((current) => ({ ...current, clinicalNotes: event.target.value }))} className="mt-1 w-full px-3 py-2 rounded-lg border dark:bg-slate-900" /></label>
            <div className="flex justify-end"><Button type="submit" variant="primary" loading={saving}><Save className="w-4 h-4 mr-1.5" />Lưu bệnh án điện tử</Button></div>
          </form>}
        </section>
      </div>}
    </div>
  );
};

export default DoctorWorkspacePage;
