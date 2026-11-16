import React, { useState, useMemo } from 'react';
import { Pill, Plus, Trash2, Printer, Check, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';

const INITIAL_MEDICINES = [
  { id: 'med1', name: 'Panadol Extra 500mg', unit: 'Vỉ', price: 18000, stock: 150 },
  { id: 'med2', name: 'Amlodipine 5mg (Huyết áp)', unit: 'Hộp', price: 95000, stock: 45 },
  { id: 'med3', name: 'Atorvastatin 20mg (Mỡ máu)', unit: 'Hộp', price: 140000, stock: 12 }, // Gần hết hàng
  { id: 'med4', name: 'Berberin 50mg', unit: 'Lọ', price: 15000, stock: 200 },
];

const PharmacyInventoryPage = () => {
  const [medicines] = useState(INITIAL_MEDICINES);
  const [prescriptionItems, setPrescriptionItems] = useState([
    { medicineId: 'med2', name: 'Amlodipine 5mg', quantity: 2, unit: 'Hộp', price: 95000, dosage: 'Sáng 1 viên sau ăn' },
    { medicineId: 'med3', name: 'Atorvastatin 20mg', quantity: 1, unit: 'Hộp', price: 140000, dosage: 'Tối 1 viên trước ngủ' }
  ]);
  const [isDispensed, setIsDispensed] = useState(false);

  // Tính tổng tiền đơn thuốc bằng useMemo (Tiêu chí 4 & 6 của đề bài)
  const totalAmount = useMemo(() => {
    return prescriptionItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [prescriptionItems]);

  const handleAddItem = () => {
    const defaultMed = medicines[0];
    setPrescriptionItems(prev => [
      ...prev,
      {
        medicineId: defaultMed.id,
        name: defaultMed.name,
        quantity: 1,
        unit: defaultMed.unit,
        price: defaultMed.price,
        dosage: '1 viên / lần'
      }
    ]);
  };

  const handleRemoveItem = (index) => {
    setPrescriptionItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleQuantityChange = (index, qty) => {
    const validQty = Math.max(1, parseInt(qty) || 1);
    setPrescriptionItems(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: validQty } : item))
    );
  };

  const handleDispense = () => {
    setIsDispensed(true);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-xs font-semibold mb-2">
          Phân hệ TV 4: Kê đơn thuốc & Quản lý Kho Dược
        </span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Kê Đơn Thuốc Điện Tử & Quản Lý Tồn Kho
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Hỗ trợ bác sĩ thêm bớt thuốc động, tự động tính tổng tiền bằng useMemo và cảnh báo tồn kho.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescription Builder */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-primary-600" /> Đơn thuốc cho bệnh nhân: Lê Thị Thu
            </h2>
            <Button variant="outline" size="sm" onClick={handleAddItem} className="flex items-center">
              <Plus className="w-4 h-4 mr-1" /> Thêm thuốc
            </Button>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            {prescriptionItems.map((item, index) => (
              <div
                key={index}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-12 gap-2 items-center text-sm"
              >
                <div className="col-span-4 font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {item.name}
                  <span className="block text-xs font-normal text-slate-400">{item.unit}</span>
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrescriptionItems(prev => prev.map((it, i) => i === index ? { ...it, dosage: val } : it));
                    }}
                    placeholder="Liều dùng..."
                    className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-1">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    className="w-16 px-2 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div className="col-span-2 text-right font-mono text-xs font-semibold text-primary-600">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded"
                    title="Xóa thuốc"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total & Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Tổng tiền thuốc (useMemo):</p>
              <p className="text-xl font-bold text-emerald-600">
                {totalAmount.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-1.5" /> In Đơn PDF
              </Button>
              <Button
                variant={isDispensed ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleDispense}
                disabled={isDispensed}
              >
                {isDispensed ? <Check className="w-4 h-4 mr-1.5 text-emerald-500" /> : null}
                {isDispensed ? 'Đã xuất kho' : 'Dược sĩ duyệt xuất kho'}
              </Button>
            </div>
          </div>
        </div>

        {/* Pharmacy Inventory Quick View */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Kho Thuốc Phòng Khám
          </h2>
          <div className="space-y-3">
            {medicines.map((m) => (
              <div key={m.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</p>
                  <p className="text-slate-400">{m.price.toLocaleString('vi-VN')} đ / {m.unit}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    m.stock <= 20
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    Tồn: {m.stock} {m.unit}
                  </span>
                  {m.stock <= 20 && (
                    <span className="block text-[10px] text-red-500 mt-1 flex items-center justify-end">
                      <AlertCircle className="w-3 h-3 mr-0.5" /> Sắp hết
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PharmacyInventoryPage;
