import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';

const PrescriptionPanel = ({ mode, role, record, medicines = [], onDispensed }) => {
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const total = useMemo(() => items.reduce((sum, item) => sum + (medicines.find((medicine) => medicine._id === item.medicineId)?.price || 0) * Number(item.quantity || 0), 0), [items, medicines]);
  const load = async () => { setLoading(true); setMessage(''); try { const response = await axiosClient.get('/prescriptions'); setPrescriptions(response.data || []); } catch (error) { setMessage(error.message); } finally { setLoading(false); } };
  useEffect(() => { if (mode === 'list') load(); }, [mode]);
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setMessage('');
    try { await axiosClient.post('/prescriptions', { recordId: record.recordId, patientId: record.patientId, items, doctorNotes: notes }); setItems([]); setMessage('Đã lưu đơn thuốc.'); } catch (error) { setMessage(error.message); } finally { setLoading(false); }
  };
  const dispense = async (id) => { setLoading(true); setMessage(''); try { await axiosClient.patch(`/prescriptions/${id}/dispense`); await Promise.all([load(), onDispensed?.()]); setMessage('Đã xuất thuốc và cập nhật tồn kho.'); } catch (error) { setMessage(error.message); } finally { setLoading(false); } };
  return <section className="space-y-4 rounded-2xl border bg-white p-6 dark:bg-slate-800">
    {message && <p role="status" className="text-sm text-primary-700">{message}</p>}
    {mode === 'prescribe' ? !record?.recordId || !record?.patientId ? <p>Hãy mở bệnh án đã lưu tại phòng khám và chọn kê đơn.</p> : <form onSubmit={submit} className="space-y-4">
      <h2 className="font-bold">Đơn thuốc: {record.patientName}</h2><p className="text-sm">Chẩn đoán: {record.diagnosis || 'Xem bệnh án'}</p>
      {items.map((item, index) => <div key={index} className="grid gap-2 sm:grid-cols-4"><select className="rounded border p-2 dark:bg-slate-900" value={item.medicineId} onChange={(e) => setItems((current) => current.map((value, i) => i === index ? { ...value, medicineId: e.target.value } : value))}>{medicines.map((medicine) => <option key={medicine._id} value={medicine._id}>{medicine.name}</option>)}</select><input className="rounded border p-2 dark:bg-slate-900" type="number" min="1" step="1" required value={item.quantity} onChange={(e) => setItems((current) => current.map((value, i) => i === index ? { ...value, quantity: Number(e.target.value) } : value))} /><input className="rounded border p-2 dark:bg-slate-900" placeholder="Liều dùng" required value={item.dosage} onChange={(e) => setItems((current) => current.map((value, i) => i === index ? { ...value, dosage: e.target.value } : value))} /><Button type="button" variant="outline" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>Xóa</Button></div>)}
      <Button type="button" variant="outline" disabled={!medicines.length} onClick={() => setItems((current) => [...current, { medicineId: medicines[0]._id, quantity: 1, dosage: '' }])}>Thêm thuốc</Button>
      <textarea className="w-full rounded border p-2 dark:bg-slate-900" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dặn dò" />
      <p>Tổng tiền: {total.toLocaleString('vi-VN')} đ</p><Button type="submit" disabled={!items.length || loading}>Lưu đơn</Button>
    </form> : <div className="space-y-3"><h2 className="font-bold">Danh sách đơn thuốc</h2>{loading ? <p>Đang tải...</p> : !prescriptions.length ? <p>Chưa có đơn thuốc.</p> : prescriptions.map((prescription) => <div key={prescription._id} className="space-y-2 rounded-xl border p-4"><strong>{prescription.patientId?.fullName || 'Bệnh nhân'}</strong><p className="text-sm">{prescription.items.map((item) => `${item.medicineName} × ${item.quantity} (${item.dosage})`).join(', ')}</p><p>{prescription.totalAmount.toLocaleString('vi-VN')} đ · {prescription.isDispensed ? 'Đã xuất' : 'Chờ xuất'}</p>{!prescription.isDispensed && ['pharmacist', 'admin'].includes(role) && <Button disabled={loading} onClick={() => dispense(prescription._id)}>Xuất thuốc</Button>}</div>)}<Button variant="outline" onClick={load} disabled={loading}>Làm mới</Button></div>}
  </section>;
};
export default PrescriptionPanel;
