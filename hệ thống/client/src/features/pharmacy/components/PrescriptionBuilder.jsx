import React, { useState, useMemo, useEffect } from 'react';
import { Pill, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '../../../components/common/Button';

const PrescriptionBuilder = ({ medicines, patients, onCreatePrescription }) => {
  const availableMedicines = useMemo(
    () => medicines.filter((m) => m.stockQuantity > 0),
    [medicines]
  );

  const [patientId, setPatientId] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('Uống thuốc đúng liều lượng, tái khám khi có dấu hiệu bất thường.');
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(patients[0]._id);
    }
  }, [patients, patientId]);

  useEffect(() => {
    if (items.length === 0 && availableMedicines.length > 0) {
      const first = availableMedicines[0];
      setItems([{ medicineId: first._id, quantity: 1, dosage: first.usageInstructions || 'Sáng 1 viên, tối 1 viên' }]);
    }
  }, [availableMedicines, items.length]);

  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const med = medicines.find((m) => m._id === item.medicineId);
      return sum + (med ? med.price * item.quantity : 0);
    }, 0);
  }, [items, medicines]);

  const handleAddRow = () => {
    if (availableMedicines.length === 0) return;
    const first = availableMedicines[0];
    setItems((prev) => [
      ...prev,
      { medicineId: first._id, quantity: 1, dosage: first.usageInstructions || '1 viên / lần' }
    ]);
  };

  const handleRemoveRow = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'medicineId') {
          const med = medicines.find((m) => m._id === value);
          return { ...item, medicineId: value, dosage: med?.usageInstructions || item.dosage };
        }
        if (field === 'quantity') {
          return { ...item, quantity: Math.max(1, Number(value) || 1) };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!patientId || items.length === 0) {
      setMessage({ type: 'error', text: 'Vui lòng chọn bệnh nhân và thêm ít nhất 1 loại thuốc.' });
      return;
    }

    if (items.some((item) => !item.dosage.trim())) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ liều dùng cho từng loại thuốc.' });
      return;
    }

    setSubmitting(true);
    try {
      await onCreatePrescription({
        patientId,
        doctorNotes: doctorNotes.trim(),
        items: items.map((item) => ({
          medicineId: item.medicineId,
          quantity: Number(item.quantity),
          dosage: item.dosage.trim()
        }))
      });
      setMessage({ type: 'success', text: 'Kê đơn thuốc thành công và đã chuyển xuống kho dược!' });
      const first = availableMedicines[0];
      setItems(first ? [{ medicineId: first._id, quantity: 1, dosage: first.usageInstructions || 'Sáng 1 viên, tối 1 viên' }] : []);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Không thể lưu đơn thuốc!' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Pill className="w-5 h-5 mr-2 text-primary-600" /> Kê Đơn Thuốc Điện Tử
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={handleAddRow} disabled={availableMedicines.length === 0}>
          <Plus className="w-4 h-4 mr-1" /> Thêm thuốc
        </Button>
      </div>

      {message.text && (
        <div className={`p-3 rounded-xl border text-sm flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/50 border-red-200 text-red-700 dark:text-red-300'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bệnh nhân</label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          >
            {patients.length === 0 ? (
              <option value="">Chưa có danh sách bệnh nhân</option>
            ) : (
              patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.email})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Lời dặn của bác sĩ</label>
          <input
            type="text"
            value={doctorNotes}
            onChange={(e) => setDoctorNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {availableMedicines.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">Kho hiện chưa có thuốc còn tồn kho để kê đơn.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const med = medicines.find((m) => m._id === item.medicineId);
            const overStock = med && item.quantity > med.stockQuantity;
            return (
              <div key={index} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-4">
                  <select
                    value={item.medicineId}
                    onChange={(e) => handleItemChange(index, 'medicineId', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    {availableMedicines.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} (Tồn: {m.stockQuantity} {m.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) => handleItemChange(index, 'dosage', e.target.value)}
                    placeholder="Liều dùng..."
                    className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-sm text-center font-semibold rounded-lg border bg-white dark:bg-slate-800 ${overStock ? 'border-red-500 text-red-600' : 'border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100'}`}
                  />
                  {overStock && <span className="block text-[11px] text-red-500 mt-0.5">Vượt tồn kho</span>}
                </div>

                <div className="md:col-span-2 flex items-center justify-between md:justify-end space-x-2">
                  <span className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {((med?.price || 0) * item.quantity).toLocaleString('vi-VN')} đ
                  </span>
                  <button type="button" onClick={() => handleRemoveRow(index)} className="p-1 text-slate-400 hover:text-red-500" title="Xóa thuốc">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Tổng tiền đơn thuốc:</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalAmount.toLocaleString('vi-VN')} VNĐ
          </p>
        </div>
        <Button type="submit" loading={submitting} disabled={items.length === 0 || patients.length === 0}>
          Lưu & Gửi xuống Kho Dược
        </Button>
      </div>
    </form>
  );
};

export default PrescriptionBuilder;
