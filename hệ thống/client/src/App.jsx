import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import HomePage from './features/common/HomePage';
import NotFoundPage from './features/common/NotFoundPage';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DoctorListPage from './features/doctors/DoctorListPage';
import DoctorDetailPage from './features/doctors/DoctorDetailPage';
import BookingPage from './features/booking/BookingPage';
import DoctorWorkspacePage from './features/examination/DoctorWorkspacePage';
import PharmacyInventoryPage from './features/pharmacy/PharmacyInventoryPage';
import QnAPage from './features/community/QnAPage';
import AdminDashboardPage from './features/admin/AdminDashboardPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import ChatWidget from './features/chat/ChatWidget';

// Layout chung bao gồm Navbar, ChatWidget và Footer
const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <ChatWidget />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 MedCare Clinic Management System – Bài tập lớn Cuối kỳ Lập trình Web (Nhóm 6 thành viên).</p>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        
        {/* Phân hệ TV 1: Danh sách bác sĩ & Chi tiết */}
        <Route path="doctors" element={<DoctorListPage />} />
        <Route path="doctors/:id" element={<DoctorDetailPage />} />
        
        {/* Phân hệ TV 2: Đặt lịch hẹn */}
        <Route path="booking" element={<BookingPage />} />
        
        {/* Phân hệ TV 3: Bàn làm việc bác sĩ */}
        <Route path="examination" element={<DoctorWorkspacePage />} />
        
        {/* Phân hệ TV 4: Kho dược phẩm */}
        <Route path="pharmacy" element={<PharmacyInventoryPage />} />
        
        {/* Phân hệ TV 5: Hỏi đáp & Đánh giá */}
        <Route path="community" element={<QnAPage />} />
        
        {/* Phân hệ TV 6: Quản trị Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="admin" element={<AdminDashboardPage />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
