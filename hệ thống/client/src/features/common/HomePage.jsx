import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Calendar, Activity, Pill, MessageSquare, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';

const MODULES = [
  {
    title: 'Phân hệ 1: Cổng Bác sĩ & Chuyên khoa (TV1)',
    desc: 'Tìm kiếm bác sĩ thông minh với useDebounce, lọc theo chuyên khoa và xem chi tiết ca làm việc.',
    path: '/doctors',
    icon: Stethoscope,
    color: 'from-blue-500 to-blue-700'
  },
  {
    title: 'Phân hệ 2: Booking Engine & Giữ chỗ 5p (TV2)',
    desc: 'Lưới chọn slot 30 phút trực quan, đếm ngược giữ slot useCountdown, chống trùng lịch Race Condition.',
    path: '/booking',
    icon: Calendar,
    color: 'from-amber-500 to-amber-700'
  },
  {
    title: 'Phân hệ 3: Bàn làm việc Bác sĩ & Bệnh án (TV3)',
    desc: 'Quản lý hàng đợi bệnh nhân ca sáng/chiều, lập bệnh án điện tử EHR và upload ảnh kết quả khám.',
    path: '/examination',
    icon: Activity,
    color: 'from-indigo-500 to-indigo-700'
  },
  {
    title: 'Phân hệ 4: Kê đơn thuốc & Kho Dược (TV4)',
    desc: 'Form kê đơn thuốc động, tự động tính tổng tiền bằng useMemo, quản lý tồn kho và in đơn PDF.',
    path: '/pharmacy',
    icon: Pill,
    color: 'from-emerald-500 to-emerald-700'
  },
  {
    title: 'Phân hệ 5: Hỏi - Đáp Y tế & Đánh giá (TV5)',
    desc: 'Diễn đàn y tế cộng đồng, bác sĩ trả lời chuyên môn, đánh giá 1-5 sao sau khi hoàn tất khám.',
    path: '/community',
    icon: MessageSquare,
    color: 'from-sky-500 to-sky-700'
  },
  {
    title: 'Phân hệ 6: Quản trị Admin & Thống kê (TV6)',
    desc: 'Dashboard biểu đồ doanh thu theo chuyên khoa, Aggregation Pipeline MongoDB và phân quyền RBAC.',
    path: '/admin',
    icon: Shield,
    color: 'from-purple-500 to-purple-700'
  }
];

const HomePage = () => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
          Bài Tập Lớn Cuối Kỳ – Nhóm 6 Thành Viên
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Hệ Thống Quản Trị Phòng Khám & Đặt Lịch Khám{' '}
          <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            MedCare
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
          Ứng dụng web Full-stack hoàn chỉnh (React, Vite, Node.js/Express, MongoDB) phân chia 6 module độc lập cho 6 thành viên, tuân thủ 100% 9 tiêu chuẩn kỹ thuật của giảng viên.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/booking">
            <Button variant="primary" size="lg" className="shadow-lg shadow-primary-500/20">
              Trải nghiệm Đặt lịch (TV2) <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/doctors">
            <Button variant="outline" size="lg">
              Tra cứu Bác sĩ (TV1)
            </Button>
          </Link>
        </div>
      </div>

      {/* 6 Modules Grid */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            6 Phân Hệ Độc Lập Cho 6 Thành Viên
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Mỗi thành viên sở hữu 1 module từ giao diện React đến API Express và Schema MongoDB.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${mod.color} flex items-center justify-center text-white shadow-md mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
                    {mod.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  <Link
                    to={mod.path}
                    className="inline-flex items-center text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 group-hover:translate-x-1 transition-transform"
                  >
                    Xem chi tiết phân hệ <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
