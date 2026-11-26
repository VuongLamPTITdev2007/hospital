import React, { useMemo, useState } from 'react';
import { CalendarCheck, DollarSign, Shield, Users } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import AnalyticsFilter from './components/AnalyticsFilter';
import { DashboardEmpty, DashboardError, DashboardLoading } from './components/DashboardState';
import RevenueBySpecialty from './components/RevenueBySpecialty';
import StatsCard from './components/StatsCard';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentMonthFilters = () => {
  const now = new Date();
  return {
    from: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: formatDate(now)
  };
};

const AdminDashboardPage = () => {
  const initialFilters = getCurrentMonthFilters();
  const [formFilters, setFormFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [validationError, setValidationError] = useState('');

  const analyticsUrl = useMemo(() => {
    const query = new URLSearchParams(appliedFilters).toString();
    return `/admin/analytics?${query}`;
  }, [appliedFilters]);

  const { data, loading, error, refetch } = useFetch(analyticsUrl);
  const analytics = data?.data;

  const handleApplyFilters = (event) => {
    event.preventDefault();
    if (!formFilters.from || !formFilters.to || formFilters.from > formFilters.to) {
      setValidationError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }

    setValidationError('');
    setAppliedFilters({ ...formFilters });
  };

  const handleResetFilters = () => {
    const currentMonthFilters = getCurrentMonthFilters();
    setFormFilters(currentMonthFilters);
    setAppliedFilters(currentMonthFilters);
    setValidationError('');
  };

  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-full text-xs font-semibold mb-2">
          Phân hệ TV 6: Quản trị Admin & Thống kê Analytics
        </span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bảng Điều Khiển Quản Trị & Báo Cáo Y Tế</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tổng hợp từ MongoDB Aggregation Pipeline. Số liệu phí khám là phí dự kiến của các ca hoàn tất có xác nhận cọc mô phỏng (không phải doanh thu ngân hàng thực thu); tổng tài khoản tính trên toàn hệ thống.</p>
      </section>

      <AnalyticsFilter
        from={formFilters.from}
        to={formFilters.to}
        error={validationError}
        onFromChange={(from) => setFormFilters((current) => ({ ...current, from }))}
        onToChange={(to) => setFormFilters((current) => ({ ...current, to }))}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {loading && <DashboardLoading />}
      {!loading && error && <DashboardError message={error} onRetry={refetch} />}
      {!loading && !error && analytics && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Phí khám mô phỏng" value={`${analytics.summary.paidRevenue.toLocaleString('vi-VN')} đ`} helper={`Từ ${analytics.filters.from} đến ${analytics.filters.to}`} icon={DollarSign} tone="emerald" />
            <StatsCard label="Ca khám hoàn tất" value={`${analytics.summary.completedAppointments} ca`} helper="Lịch khám có trạng thái hoàn tất" icon={CalendarCheck} tone="primary" />
            <StatsCard label="Bệnh nhân đã đăng ký" value={`${analytics.summary.patientCount} người`} helper={`${analytics.usersByRole.patient} tài khoản patient`} icon={Users} tone="sky" />
            <StatsCard label="Bác sĩ & Dược sĩ" value={`${analytics.summary.staffCount} nhân sự`} helper={`RBAC: ${analytics.usersByRole.admin} admin`} icon={Shield} tone="purple" />
          </div>
          {analytics.revenueBySpecialty.length > 0 ? <RevenueBySpecialty items={analytics.revenueBySpecialty} /> : <DashboardEmpty />}
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
