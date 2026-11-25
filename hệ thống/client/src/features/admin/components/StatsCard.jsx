import React from 'react';

const toneClasses = {
  emerald: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600',
  primary: 'bg-primary-100 dark:bg-primary-950 text-primary-600',
  sky: 'bg-sky-100 dark:bg-sky-950 text-sky-600',
  purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600'
};

const StatsCard = ({ label, value, helper, icon: Icon, tone }) => (
  <article className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">{helper}</span>
    </div>
    <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${toneClasses[tone]}`}><Icon className="w-6 h-6" /></div>
  </article>
);

export default StatsCard;
