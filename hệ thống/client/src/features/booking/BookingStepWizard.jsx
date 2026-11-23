import React from 'react';
import { Calendar, UserCheck, CreditCard, CheckCircle2 } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Chọn Lịch Khám', icon: Calendar },
  { id: 2, label: 'Thông Tin Bệnh Nhân', icon: UserCheck },
  { id: 3, label: 'Giữ Chỗ & Cọc VietQR', icon: CreditCard },
  { id: 4, label: 'Phiếu Khám Xác Nhận', icon: CheckCircle2 }
];

const BookingStepWizard = ({ currentStep }) => {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {STEPS.map((s, index) => {
          const Icon = s.icon;
          const isDone = currentStep > s.id;
          const isCurrent = currentStep === s.id;

          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 font-bold text-sm sm:text-base ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : isCurrent
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 ring-4 ring-primary-100 dark:ring-primary-950 scale-105'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`mt-2 text-center text-xs font-semibold hidden sm:block ${
                    isCurrent
                      ? 'text-primary-600 dark:text-primary-400'
                      : isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
                <span className="sm:hidden text-[10px] mt-1 font-medium text-slate-500">
                  Bước {s.id}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`h-0.5 sm:h-1 flex-1 mx-2 sm:mx-4 transition-all duration-300 rounded ${
                    currentStep > s.id
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStepWizard;

