import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, Pill, Plus, Trash2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';

const money = (value) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

const PharmacyInventoryPage = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const { data: medicineResponse, loading: medicinesLoading, error: medicinesError, refetch: reloadMedicines } = useFetch('/medicines');
  const { data: recordsResponse, loading: recordsLoading, error: recordsError, refetch: reloadRecords } = useFetch(isDoctor ? '/records/my' : null);
  const { data: prescriptionResponse, loading: prescriptionsLoading, error: prescriptionsError, refetch: reloadPrescriptions } = useFetch('/prescriptions');
  const medicines = medicineResponse?.data || [];
  const records = recordsResponse?.data || [];
  const prescriptions = prescriptionResponse?.data || [];
  const [recordId, setRecordId] = useState('');
  const [items, setItems] = useState([]);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!recordId && records.length) setRecordId(records.find((record) => !record.prescriptionId)?._id || '');
  }, [recordId, records]);

  const totalAmount = useMemo(() => items.reduce((total, item) => {
    const medicine = medicines.find((candidate) => candidate._id === item.medicineId);
    return total + (medicine?.price || 0) * Number(item.quantity || 0);
  }, 0), [items, medicines]);

  const addItem = () => {
    if (medicines.length) setItems((current) => [...current, { medicineId: medicines[0]._id, quantity: 1, dosage: '' }]);
  };
  const updateItem = (index, patch) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const removeItem = (index) => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const createPrescription = async (event) => {
    event.preventDefault(); setMessage('');
    if (!recordId || !items.length) { setMessage('Chọn bệnh án và thêm tối thiểu một thuốc.'); return; }
    setSubmitting(true);
    try {
      await axiosClient.post('/prescriptions', { recordId, items, doctorNotes });
      setMessage('Đã tạo đơn thuốc, đang chờ dược sĩ xuất kho.');
      setItems([]); setDoctorNotes(''); setRecordId(''); reloadRecords(); reloadPrescriptions();
    } catch (error) { setMessage(error.message); } finally { setSubmitting(false); }
  };
  const dispense = async (id) => {
    setMessage(''); setSubmitting(true);
    try { await axiosClient.patch(`/prescriptions/${id}/dispense`); setMessage('Đã xuất thuốc và cập nhật tồn kho.'); reloadMedicines(); reloadPrescriptions(); } catch (error) { setMessage(error.message); } finally { setSubmitting(false); }
  };

  const busy = medicinesLoading || recordsLoading || prescriptionsLoading;
  const error = medicinesError || recordsError || prescriptionsError;
  if (busy) return <Loader text="Đang tải dữ liệu kho dược..." />;
  if (error) return <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"><p>{error}</p><Button variant="outline" onClick={() => { reloadMedicines(); reloadRecords(); reloadPrescriptions(); }}>Thử lại</Button></div>;

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"><span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Phân hệ Dược phẩm</span><h1 className="mt-2 text-2xl font-bold">Kê đơn và xuất kho thuốc</h1><p className="mt-1 text-sm text-slate-500">Dữ liệu thuốc, bệnh án và đơn thuốc đều được lấy từ API.</p></section>
    {message && <div className="rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm text-primary-800">{message}</div>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"><h2 className="mb-4 font-bold">Kho thuốc</h2><div className="space-y-3">{medicines.length ? medicines.map((medicine) => <div key={medicine._id} className="flex justify-between rounded-xl border p-3 text-sm"><div><strong>{medicine.name}</strong><p className="text-xs text-slate-500">{money(medicine.price)} / {medicine.unit}</p></div><div className={`text-right ${medicine.stockQuantity <= medicine.minStockAlert ? 'text-red-600' : ''}`}>Tồn: {medicine.stockQuantity}<br />{medicine.stockQuantity <= medicine.minStockAlert && <span className="text-xs"><AlertCircle className="mr-1 inline h-3 w-3" />Sắp hết</span>}</div></div>) : <p className="text-sm text-slate-500">Chưa có thuốc trong kho.</p>}</div></section>
      <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {isDoctor ? <form onSubmit={createPrescription} className="space-y-4"><div className="flex items-center justify-between"><h2 className="flex items-center font-bold"><Pill className="mr-2 h-5 w-5 text-primary-600" />Tạo đơn thuốc</h2><Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-4 w-4" />Thêm thuốc</Button></div><label className="block text-sm font-medium">Bệnh án<select required value={recordId} onChange={(event) => setRecordId(event.target.value)} className="mt-1 w-full rounded-lg border p-2 dark:bg-slate-900"><option value="">Chọn bệnh án chưa kê đơn</option>{records.filter((record) => !record.prescriptionId).map((record) => <option key={record._id} value={record._id}>{record.patientId?.fullName || 'Bệnh nhân'} — {record.diagnosis}</option>)}</select></label>{items.map((item, index) => { const selected = medicines.find((medicine) => medicine._id === item.medicineId); return <div key={`${item.medicineId}-${index}`} className="grid grid-cols-1 gap-2 rounded-xl border bg-slate-50 p-3 sm:grid-cols-12 dark:bg-slate-900"><select value={item.medicineId} onChange={(event) => updateItem(index, { medicineId: event.target.value })} className="rounded border p-2 text-sm sm:col-span-4">{medicines.map((medicine) => <option key={medicine._id} value={medicine._id}>{medicine.name}</option>)}</select><input required placeholder="Liều dùng" value={item.dosage} onChange={(event) => updateItem(index, { dosage: event.target.value })} className="rounded border p-2 text-sm sm:col-span-4" /><input required type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} className="rounded border p-2 text-sm sm:col-span-2" /><div className="flex items-center justify-between text-sm sm:col-span-2"><span>{money((selected?.price || 0) * item.quantity)}</span><button type="button" onClick={() => removeItem(index)} className="text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>; })}<label className="block text-sm font-medium">Dặn dò<textarea value={doctorNotes} onChange={(event) => setDoctorNotes(event.target.value)} className="mt-1 w-full rounded-lg border p-2 dark:bg-slate-900" rows="2" /></label><div className="flex items-center justify-between border-t pt-4"><strong>Tổng tiền: {money(totalAmount)}</strong><Button type="submit" loading={submitting}>Tạo đơn thuốc</Button></div></form> : <div><h2 className="mb-4 font-bold">Đơn chờ xuất kho</h2><div className="space-y-3">{prescriptions.length ? prescriptions.map((prescription) => <div key={prescription._id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><div><strong>{prescription.patientId?.fullName || 'Bệnh nhân'}</strong><p className="text-xs text-slate-500">{prescription.items.map((item) => `${item.medicineName} × ${item.quantity}`).join(', ')}</p></div><Button size="sm" disabled={submitting} onClick={() => dispense(prescription._id)}><Check className="mr-1 h-4 w-4" />Xuất kho</Button></div><p className="mt-2 text-sm font-semibold text-emerald-600">{money(prescription.totalAmount)}</p></div>) : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">Không có đơn thuốc chờ xuất kho.</p>}</div></div>}
      </section>
    </div>
  </div>;
};

export default PharmacyInventoryPage;
