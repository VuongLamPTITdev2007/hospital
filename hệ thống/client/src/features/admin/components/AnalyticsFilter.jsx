import React from 'react';
import { CalendarDays, RotateCcw } from 'lucide-react';
import Button from '../../../components/common/Button';

const AnalyticsFilter = ({ from, to, error, onFromChange, onToChange, onApply, onReset }) => (
  <form onSubmit={onApply} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
    <div className="flex flex-col lg:flex-row lg:items-end gap-4">
      <div className="flex-1">
        <label htmlFor="analytics-from" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Từ ngày</label>
        <input id="analytics-from" type="date" value={from} max={to} onChange={(event) => onFromChange(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
      </div>
      <div className="flex-1">
        <label htmlFor="analytics-to" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Đến ngày</label>
        <input id="analytics-to" type="date" value={to} min={from} onChange={(event) => onToChange(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="primary" className="flex items-center"><CalendarDays className="w-4 h-4 mr-1.5" /> Áp dụng</Button>
        <Button type="button" variant="outline" onClick={onReset} className="flex items-center"><RotateCcw className="w-4 h-4 mr-1.5" /> Tháng này</Button>
      </div>
    </div>
    {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
  </form>
);

export default AnalyticsFilter;
