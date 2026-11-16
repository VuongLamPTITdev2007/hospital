import React from 'react';

const Loader = ({ size = 'md', text = 'Đang tải dữ liệu...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-3">
      <div className={`animate-spin rounded-full border-primary-600 border-t-transparent ${sizeClasses[size] || sizeClasses.md}`}></div>
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
};

export default Loader;
