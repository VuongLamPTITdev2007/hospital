import React, { useState, useEffect } from 'react';
import Modal from '../../../components/common/Modal';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const UNITS = ['Viên', 'Vỉ', 'Hộp', 'Chai', 'Gói', 'Ống'];

const EMPTY_FORM = {
  name: '',
  activeIngredient: '',
  unit: 'Viên',
  price: '',
  stockQuantity: '',
  minStockAlert: '20',
  usageInstructions: 'Uống sau bữa ăn'
};

const MedicineFormModal = ({ isOpen, onClose, initialData, onSubmit, submitting }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (initialData) {
      setForm({
        name: initialData.name || '',
        activeIngredient: initialData.activeIngredient || '',
        unit: initialData.unit || 'Viên',
        price: String(initialData.price ?? ''),
        stockQuantity: String(initialData.stockQuantity ?? ''),
        minStockAlert: String(initialData.minStockAlert ?? '20'),
        usageInstructions: initialData.usageInstructions || 'Uống sau bữa ăn'
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Vui lòng nhập tên thuốc.');
      return;
    }
    if (form.price === '' || Number(form.price) < 0 || form.stockQuantity === '' || Number(form.stockQuantity) < 0) {
      setError('Đơn giá và số lượng tồn kho phải lớn hơn hoặc bằng 0.');
      return;
    }

    try {
      await onSubmit({
        name: form.name.trim(),
        activeIngredient: form.activeIngredient.trim(),
        unit: form.unit,
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        minStockAlert: Number(form.minStockAlert || 20),
        usageInstructions: form.usageInstructions.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể lưu thông tin thuốc!');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Cập nhật thuốc' : 'Thêm thuốc mới'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <Input label="Tên thuốc" name="name" value={form.name} onChange={handleChange} placeholder="Panadol Extra 500mg" required />
        <Input label="Hoạt chất chính" name="activeIngredient" value={form.activeIngredient} onChange={handleChange} placeholder="Paracetamol 500mg" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Đơn vị tính</label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <Input label="Đơn giá (VNĐ)" name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Số lượng tồn kho" name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={handleChange} required />
          <Input label="Ngưỡng cảnh báo" name="minStockAlert" type="number" min="0" value={form.minStockAlert} onChange={handleChange} />
        </div>

        <Input label="Hướng dẫn sử dụng" name="usageInstructions" value={form.usageInstructions} onChange={handleChange} />

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button type="submit" loading={submitting}>{initialData ? 'Lưu thay đổi' : 'Thêm vào kho'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default MedicineFormModal;
