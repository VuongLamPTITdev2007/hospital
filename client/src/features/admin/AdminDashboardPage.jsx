import React from 'react';
import { Shield, TrendingUp, Users, CalendarCheck, DollarSign, Activity } from 'lucide-react';

const REVENUE_BY_SPECIALTY = [
  { specialty: 'Tim mạch', revenue: 45500000, appointments: 130, percent: 38 },
  { specialty: 'Nhi khoa', revenue: 32000000, appointments: 105, percent: 27 },
  { specialty: 'Cơ xương khớp', revenue: 26000000, appointments: 65, percent: 22 },
  { specialty: 'Đa khoa & Khác', revenue: 15500000, appointments: 52, percent: 13 }
];

const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded-full text-xs font-semibold mb-2">
          Phân hệ TV 6: Quản trị Admin & Thống kê Analytics (Aggregation)
        </span>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Bảng Điều Khiển Quản Trị & Báo Cáo Y Tế
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Dữ liệu thống kê doanh thu, lưu lượng khám và quản lý phân quyền tài khoản (RBAC).
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tổng doanh thu tháng</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">119.000.000 đ</h3>
            <span className="text-[11px] text-emerald-500 font-semibold flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> +15.4% so với tháng trước
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Tổng ca khám thành công</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">352 ca</h3>
            <span className="text-[11px] text-slate-400 mt-1 block">Tỷ lệ lấp đầy ca: 87.5%</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-950 text-primary-600 flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Bệnh nhân đã đăng ký</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">1.420 người</h3>
            <span className="text-[11px] text-emerald-500 font-semibold mt-1 block">+82 tài khoản mới</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Bác sĩ & Dược sĩ</p>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">28 nhân viên</h3>
            <span className="text-[11px] text-purple-500 font-semibold mt-1 block">RBAC: 4 vai trò</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Revenue by Specialty Table & Progress */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-primary-600" />
          Báo Cáo Doanh Thu Theo Chuyên Khoa (MongoDB Aggregation Pipeline)
        </h2>

        <div className="space-y-4">
          {REVENUE_BY_SPECIALTY.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{item.specialty} ({item.appointments} ca khám)</span>
                <span className="font-bold text-primary-600">{item.revenue.toLocaleString('vi-VN')} đ ({item.percent}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full"
                  style={{ width: `${item.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
