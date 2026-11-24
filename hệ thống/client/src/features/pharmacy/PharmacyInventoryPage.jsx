import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Pill, ClipboardList, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import Loader from '../../components/common/Loader';

const PharmacyInventoryPage = () => {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role || '';

  const canPrescribe = role === 'doctor' || role === 'admin';
  const [activeTab, setActiveTab] = useState('inventory');

  const {
    data: medicinesRes,
    loading: medicinesLoading,
    error: medicinesError
  } = useFetch('/medicines');

  const medicines = medicinesRes?.data || [];

  const tabs = [
    { key: 'inventory', label: 'Kho thuốc phòng khám', icon: Package, visible: true },
    { key: 'prescribe', label: 'Kê đơn thuốc', icon: Pill, visible: canPrescribe },
    { key: 'prescriptions', label: 'Đơn thuốc & Xuất kho', icon: ClipboardList, visible: isAuthenticated }
  ].filter((tab) => tab.visible);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full text-xs font-semibold mb-2">
            Quản lý Dược phẩm
          </span>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Kho Thuốc & Kê Đơn Điện Tử
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tra cứu tồn kho, cảnh báo thuốc sắp hết, kê đơn thuốc và duyệt xuất kho.
          </p>
        </div>

        {!isAuthenticated && (
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors shrink-0"
          >
            <LogIn className="w-4 h-4 mr-2" /> Đăng nhập để kê đơn / xuất kho
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                isActive
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          {medicinesLoading ? (
            <Loader text="Đang tải danh sách thuốc trong kho..." />
          ) : medicinesError ? (
            <p className="text-sm text-red-500 text-center py-6">{medicinesError}</p>
          ) : medicines.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
              Hiện chưa có thuốc nào trong kho.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicines.map((med) => (
                <div
                  key={med._id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{med.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {med.price.toLocaleString('vi-VN')} đ / {med.unit}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      med.stockQuantity <= med.minStockAlert
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    Tồn: {med.stockQuantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'prescribe' && canPrescribe && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm text-sm text-slate-500 dark:text-slate-400">
          Chưa có mẫu kê đơn thuốc.
        </div>
      )}

      {activeTab === 'prescriptions' && isAuthenticated && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm text-sm text-slate-500 dark:text-slate-400">
          Chưa có đơn thuốc nào.
        </div>
      )}
    </div>
  );
};

export default PharmacyInventoryPage;
