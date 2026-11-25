import React, { useState, useMemo } from 'react';
import { Check, Clock, Printer, RefreshCw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';

const PrescriptionList = ({ prescriptions, loading, error, onRetry, canDispense, onDispense, onPrint }) => {
  const [filter, setFilter] = useState('all');
  const [dispensingId, setDispensingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const list = useMemo(() => {
    if (filter === 'pending') return prescriptions.filter((p) => !p.isDispensed);
    if (filter === 'dispensed') return prescriptions.filter((p) => p.isDispensed);
    return prescriptions;
  }, [prescriptions, filter]);

  const handleDispense = async (item) => {
    if (!window.confirm('Xác nhận duyệt xuất kho đơn thuốc này?')) return;
    setErrorMsg('');
    setDispensingId(item._id);
    try {
      await onDispense(item._id);
    } catch (err) {
      setErrorMsg(err.message || 'Không thể duyệt xuất kho!');
    } finally {
      setDispensingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <Loader text="Đang tải danh sách đơn thuốc..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 p-6 text-center space-y-3">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {[
            { key: 'all', label: `Tất cả (${prescriptions.length})` },
            { key: 'pending', label: 'Chờ xuất kho' },
            { key: 'dispensed', label: 'Đã xuất kho' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                filter === tab.key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Làm mới
        </Button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-300">
          {errorMsg}
        </div>
      )}

      {list.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Chưa có đơn thuốc nào.
        </div>
      ) : (
        list.map((item) => (
          <div key={item._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  Bệnh nhân: {item.patientId?.fullName || 'Chưa rõ'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bác sĩ: {item.doctorId?.fullName || 'Chưa rõ'} • {new Date(item.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="sm:text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.isDispensed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                  {item.isDispensed ? <><Check className="w-3.5 h-3.5 mr-1" /> Đã xuất kho</> : <><Clock className="w-3.5 h-3.5 mr-1" /> Chờ xuất kho</>}
                </span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {item.totalAmount.toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              {item.items.map((med, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:justify-between gap-1 text-slate-700 dark:text-slate-300">
                  <span>{med.medicineName} ({med.quantity} {med.unit}) — {med.dosage}</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400 shrink-0">{med.subTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              ))}
            </div>

            {item.doctorNotes && (
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg">
                Lời dặn: {item.doctorNotes}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => onPrint(item)}>
                <Printer className="w-4 h-4 mr-1" /> In đơn
              </Button>
              {canDispense && !item.isDispensed && (
                <Button size="sm" loading={dispensingId === item._id} onClick={() => handleDispense(item)}>
                  <Check className="w-4 h-4 mr-1" /> Duyệt xuất kho
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PrescriptionList;
