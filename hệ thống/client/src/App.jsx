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
import ChatWidget from './features/chatbot/ChatWidget';

                                        
const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500">
        <p>© 2026 MedCare Clinic Management System – Bài tập lớn Cuối kỳ Lập trình Web (Nhóm 6 thành viên).</p>
      </footer>
      <ChatWidget />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {                   }
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        
        {                                               }
        <Route path="doctors" element={<DoctorListPage />} />
        <Route path="doctors/:id" element={<DoctorDetailPage />} />
        
        {                                }
        <Route element={<ProtectedRoute allowedRoles={['patient']} />}><Route path="booking" element={<BookingPage />} /></Route>
        
        {                                       }
        <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}><Route path="examination" element={<DoctorWorkspacePage />} /></Route>
        
        {                                 }
        <Route path="pharmacy" element={<PharmacyInventoryPage />} />
        
        {                                      }
        <Route path="community" element={<QnAPage />} />
        
        {                                  }
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}><Route path="admin" element={<AdminDashboardPage />} /></Route>

        {               }
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
