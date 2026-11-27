import React, { useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, AlertTriangle, Package, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';

const UNIT_OPTIONS = ['Tất cả', 'Viên', 'Vỉ', 'Hộp', 'Chai', 'Gói', 'Ống'];

const MedicineTable = ({
  medicines,
  summary,
  loading,
  error,
  onRetry,
  canManage,
  canViewStock = false,
  onAdd,
  onEdit,
  onDelete,
  searchTerm = '',
  onSearchChange,
  selectedUnit = 'Tất cả',
  onUnitChange,
  onlyLowStock = false,
  onLowStockChange,
  pagination = { total: 0, page: 1, limit: 10, totalPages: 1 },
  onPageChange
}) => {
  const summaryCards = useMemo(() => {
    const totalMedicines = summary?.totalMedicines ?? pagination.total ?? medicines.length;
    if (!canViewStock) {
      return [
        { label: 'Tổng danh mục thuốc', value: totalMedicines, color: 'text-slate-800 dark:text-slate-100', icon: Package }
      ];
    }
    const lowStockCount = summary?.lowStockCount ?? medicines.filter((m) => m.stockQuantity <= m.minStockAlert).length;
    const totalUnits = summary?.totalUnits ?? medicines.reduce((sum, m) => sum + (m.stockQuantity || 0), 0);
    return [
      { label: 'Tổng danh mục thuốc', value: totalMedicines, color: 'text-slate-800 dark:text-slate-100', icon: Package },
      { label: 'Thuốc sắp hết hàng', value: lowStockCount, color: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
      { label: 'Tổng số lượng tồn', value: totalUnits.toLocaleString('vi-VN'), color: 'text-emerald-600 dark:text-emerald-400', icon: Package }
    ];
  }, [medicines, summary, pagination.total, canViewStock]);

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-red-200 dark:border-red-900 p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1.5" /> Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 ${canViewStock ? 'sm:grid-cols-3' : 'sm:grid-cols-1 max-w-sm'} gap-4`}>
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </div>
              <Icon className={`w-6 h-6 ${card.color}`} />
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Tìm tên thuốc hoặc hoạt chất..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>

            <select
              value={selectedUnit}
              onChange={(e) => onUnitChange?.(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>Đơn vị: {u}</option>
              ))}
            </select>

            {canViewStock && (
              <label className="inline-flex items-center space-x-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" checked={onlyLowStock} onChange={(e) => onLowStockChange?.(e.target.checked)} />
                <span>Sắp hết hàng</span>
              </label>
            )}
          </div>

          {canManage && (
            <Button onClick={onAdd}>
              <Plus className="w-4 h-4 mr-1.5" /> Thêm thuốc mới
            </Button>
          )}
        </div>

        {loading ? (
          <div className="py-8">
            <Loader text="Đang tải danh sách thuốc trong kho..." />
          </div>
        ) : medicines.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">Không tìm thấy thuốc nào phù hợp.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500">
                    <th className="py-3 px-3">Tên thuốc</th>
                    <th className="py-3 px-3">Đơn vị</th>
                    <th className="py-3 px-3 text-right">Đơn giá</th>
                    {canViewStock && <th className="py-3 px-3 text-center">Tồn kho</th>}
                    <th className="py-3 px-3">Cách dùng</th>
                    {canManage && <th className="py-3 px-3 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {medicines.map((med) => {
                    const isLow = canViewStock && med.stockQuantity <= med.minStockAlert;
                    return (
                      <tr key={med._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{med.name}</p>
                          {med.activeIngredient && <p className="text-xs text-slate-500">{med.activeIngredient}</p>}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{med.unit}</td>
                        <td className="py-3 px-3 text-right font-semibold text-primary-600 dark:text-primary-400">
                          {med.price.toLocaleString('vi-VN')} đ
                        </td>
                        {canViewStock && (
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isLow ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                              {med.stockQuantity} {med.unit}
                            </span>
                            {isLow && <span className="block text-[11px] text-red-500 mt-0.5">Sắp hết</span>}
                          </td>
                        )}
                        <td className="py-3 px-3 text-xs text-slate-500 max-w-xs">{med.usageInstructions}</td>
                        {canManage && (
                          <td className="py-3 px-3 text-right space-x-1">
                            <button onClick={() => onEdit(med)} className="p-1.5 text-slate-500 hover:text-primary-600" title="Sửa">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(med)} className="p-1.5 text-slate-500 hover:text-red-600" title="Xóa">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Trang <strong className="text-slate-800 dark:text-slate-100">{pagination.page}</strong> / {pagination.totalPages} (Tổng {pagination.total} thuốc)
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => onPageChange?.(pagination.page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => onPageChange?.(pagination.page + 1)}
                  >
                    Sau <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MedicineTable;
