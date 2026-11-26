import React from 'react';
import { Activity } from 'lucide-react';

const RevenueBySpecialty = ({ items }) => (
  <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary-600" /> Phí khám mô phỏng theo chuyên khoa</h2>
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.specialty} className="space-y-1.5">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{item.specialty} ({item.appointments} ca)</span>
            <span className="font-bold text-primary-600">{item.revenue.toLocaleString('vi-VN')} đ ({item.percent}%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full" style={{ width: `${item.percent}%` }} /></div>
        </div>
      ))}
    </div>
  </section>
);

export default RevenueBySpecialty;
