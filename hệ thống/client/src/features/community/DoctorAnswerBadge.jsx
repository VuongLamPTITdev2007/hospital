import React from 'react';
import { CheckCircle2, Stethoscope } from 'lucide-react';

/**
 * Component: DoctorAnswerBadge
 * Hiển thị khối phản hồi y khoa chính thức từ Bác sĩ chuyên khoa
 * @param {string} doctorName - Họ tên bác sĩ
 * @param {string} specialty - Chuyên khoa
 * @param {string} answer - Nội dung tư vấn của bác sĩ
 * @param {string} date - Ngày phản hồi
 */
const DoctorAnswerBadge = ({
  doctorName = 'Bác sĩ chuyên khoa',
  specialty = '',
  answer,
  date
}) => {
  if (!answer) return null;

  return (
    <div className="relative p-4 sm:p-5 bg-gradient-to-r from-sky-50/90 to-blue-50/70 dark:from-sky-950/40 dark:to-slate-800/60 border-l-4 border-primary-500 rounded-r-2xl space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 rounded-lg">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center text-xs sm:text-sm font-bold text-primary-900 dark:text-primary-200">
              <CheckCircle2 className="w-4 h-4 mr-1 text-primary-600 dark:text-primary-400 shrink-0" />
              <span>{doctorName}</span>
            </div>
            {specialty && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Khoa: {specialty}
              </p>
            )}
          </div>
        </div>
        {date && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {date}
          </span>
        )}
      </div>

      <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pl-1 whitespace-pre-line">
        {answer}
      </div>

      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
        <span className="italic">* Lời khuyên mang tính chất tham khảo, không thay thế chẩn đoán trực tiếp tại viện.</span>
      </div>
    </div>
  );
};

export default DoctorAnswerBadge;
