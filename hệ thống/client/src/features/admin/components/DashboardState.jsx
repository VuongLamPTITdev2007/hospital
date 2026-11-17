import React from 'react';
import { AlertCircle, DatabaseZap, RefreshCw } from 'lucide-react';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';

export const DashboardLoading = () => <Loader text="Đang tổng hợp dữ liệu quản trị..." />;

export const DashboardError = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-6 text-center">
    <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
    <h2 className="mt-3 font-bold text-red-800 dark:text-red-200">Không thể tải báo cáo</h2>
    <p className="mt-1 text-sm text-red-700 dark:text-red-300">{message}</p>
    <Button variant="outline" size="sm" onClick={onRetry} className="mt-4"><RefreshCw className="w-4 h-4 mr-1.5" /> Thử lại</Button>
  </div>
);

export const DashboardEmpty = () => (
  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center">
    <DatabaseZap className="w-10 h-10 mx-auto text-slate-400" />
    <h2 className="mt-3 font-bold text-slate-700 dark:text-slate-200">Chưa có dữ liệu cho khoảng thời gian này</h2>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Dữ liệu sẽ xuất hiện khi các lịch khám được hoàn tất và thanh toán.</p>
  </div>
);
