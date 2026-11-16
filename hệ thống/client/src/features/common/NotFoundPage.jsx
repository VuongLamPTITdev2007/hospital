import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { AlertCircle, Home } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">404 - Không tìm thấy trang</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
        Đường dẫn bạn yêu cầu không tồn tại trên hệ thống MedCare hoặc đã được chuyển sang địa chỉ khác.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="primary" className="flex items-center">
            <Home className="w-4 h-4 mr-2" /> Về Trang Chủ
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
