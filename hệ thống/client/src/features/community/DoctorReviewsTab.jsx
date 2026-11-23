import React, { useState, useMemo } from 'react';
import { 
  Star, 
  Award, 
  ShieldCheck, 
  Filter, 
  UserCircle, 
  Calendar, 
  CheckCircle2, 
  MessageSquare,
  ThumbsUp,
  Stethoscope
} from 'lucide-react';
import StarRating from './StarRating';

/**
 * Component: DoctorReviewsTab
 * Tab quản lý và hiển thị đánh giá công khai chất lượng dịch vụ của từng bác sĩ
 * - useMemo tính toán điểm trung bình và tổng lượt đánh giá cho từng bác sĩ
 * - Hiển thị thẻ tổng quan thống kê ở trên
 * - Danh sách phản hồi công khai của bệnh nhân có lọc theo bác sĩ ở dưới
 */
const DoctorReviewsTab = ({ reviews = [] }) => {
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('ALL');
  const [ratingFilter, setRatingFilter] = useState('ALL');

  // 1. Dùng useMemo tính toán thống kê cho từng bác sĩ (tránh tính toán lại thừa thãi)
  const doctorStats = useMemo(() => {
    const statsMap = {};

    reviews.forEach((r) => {
      const docId = r.doctorId || 'unknown';
      if (!statsMap[docId]) {
        statsMap[docId] = {
          doctorId: docId,
          doctorName: r.doctorName || 'Bác sĩ MedCare',
          specialty: r.specialty || 'Đa khoa',
          totalStars: 0,
          count: 0
        };
      }
      statsMap[docId].totalStars += Number(r.rating);
      statsMap[docId].count += 1;
    });

    return Object.values(statsMap).map((doc) => ({
      ...doc,
      averageRating: doc.count > 0 ? Number((doc.totalStars / doc.count).toFixed(1)) : 5.0
    }));
  }, [reviews]);

  // Thống kê tổng hợp toàn phòng khám
  const overallStats = useMemo(() => {
    if (reviews.length === 0) return { avg: 5.0, count: 0 };
    const total = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
    return {
      avg: Number((total / reviews.length).toFixed(1)),
      count: reviews.length
    };
  }, [reviews]);

  // Bác sĩ đang được chọn để xem chi tiết phân bố (hoặc toàn bộ nếu ALL)
  const activeDoctor = useMemo(() => {
    if (selectedDoctorFilter === 'ALL') return null;
    return doctorStats.find((d) => d.doctorId === selectedDoctorFilter);
  }, [doctorStats, selectedDoctorFilter]);

  // Thống kê cho đối tượng đang chọn (Bác sĩ cụ thể hoặc Toàn phòng khám)
  const activeStats = useMemo(() => {
    const targetReviews = selectedDoctorFilter === 'ALL'
      ? reviews
      : reviews.filter((r) => r.doctorId === selectedDoctorFilter);

    const count = targetReviews.length;
    if (count === 0) {
      return { avg: 5.0, count: 0, recommendPercent: 100 };
    }

    const totalStars = targetReviews.reduce((sum, r) => sum + Number(r.rating || 5), 0);
    const positiveReviews = targetReviews.filter((r) => Number(r.rating) >= 4).length;

    return {
      avg: Number((totalStars / count).toFixed(1)),
      count,
      recommendPercent: Math.round((positiveReviews / count) * 100)
    };
  }, [reviews, selectedDoctorFilter]);

  // Thống kê phân bố số sao (Rating Breakdown: 5 sao -> 1 sao)
  const ratingBreakdown = useMemo(() => {
    const targetReviews = selectedDoctorFilter === 'ALL'
      ? reviews
      : reviews.filter((r) => r.doctorId === selectedDoctorFilter);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    targetReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      counts[star] = (counts[star] || 0) + 1;
    });

    const total = targetReviews.length;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      percent: total > 0 ? Math.round((counts[star] / total) * 100) : 0
    }));
  }, [reviews, selectedDoctorFilter]);

  // 2. Lọc danh sách đánh giá theo bác sĩ và số sao
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesDoc = selectedDoctorFilter === 'ALL' || r.doctorId === selectedDoctorFilter;
      const matchesRating = ratingFilter === 'ALL' || Number(r.rating) === Number(ratingFilter);
      return matchesDoc && matchesRating;
    });
  }, [reviews, selectedDoctorFilter, ratingFilter]);

  return (
    <div className="space-y-6">
      {/* Khối Thống Kê Tổng Quan & Thẻ Điểm Số Bác Sĩ */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Award className="w-5 h-5 mr-2 text-amber-500" />
            Điểm Uy Tín & Đánh Giá Chất Lượng Bác Sĩ
          </h2>
        </div>

        {/* Khối Tóm Tắt & Phân Bố Sao (Rating Breakdown) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Cột Trái: Điểm trung bình tổng quan */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700/60 space-y-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {activeDoctor ? `Điểm đánh giá: ${activeDoctor.doctorName}` : 'Đánh giá toàn phòng khám'}
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {activeStats.avg.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-slate-400">/ 5.0</span>
              </div>
              <StarRating rating={Math.round(activeStats.avg)} size="md" interactive={false} showScore={false} />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dựa trên <span className="font-semibold text-slate-700 dark:text-slate-200">{activeStats.count}</span> lượt khám thực tế
              </p>
              {activeStats.count > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                  ✓ {activeStats.recommendPercent}% bệnh nhân hài lòng
                </span>
              )}
            </div>

            {/* Cột Phải: 5 thanh phân bố sao (5 sao -> 1 sao) */}
            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center justify-between pb-1 text-xs text-slate-400">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Phân bố số sao</span>
                <span>(Bấm vào mức sao để lọc nhận xét)</span>
              </div>

              {ratingBreakdown.map((item) => {
                const isFilterActive = ratingFilter === item.star.toString();
                return (
                  <div
                    key={item.star}
                    onClick={() => setRatingFilter(isFilterActive ? 'ALL' : item.star.toString())}
                    className={`flex items-center space-x-3 p-1.5 rounded-xl cursor-pointer transition-all ${
                      isFilterActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-400/50'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                    }`}
                    title={`Lọc xem các đánh giá ${item.star} sao`}
                  >
                    <div className="flex items-center space-x-1 w-14 shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{item.star}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>

                    {/* Thanh Progress bar */}
                    <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.star >= 4
                            ? 'bg-amber-400'
                            : item.star === 3
                            ? 'bg-amber-500'
                            : 'bg-rose-400'
                        }`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>

                    {/* Số lượng và % */}
                    <div className="w-20 text-right text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.count}</span>
                      <span className="text-[11px] ml-1">({item.percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lưới các thẻ tổng quan bác sĩ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctorStats.map((doc) => {
            const isSelected = selectedDoctorFilter === doc.doctorId;
            return (
              <div
                key={doc.doctorId}
                onClick={() =>
                  setSelectedDoctorFilter(isSelected ? 'ALL' : doc.doctorId)
                }
                className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/40 dark:bg-primary-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-slate-600 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      Khoa {doc.specialty}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {doc.doctorName}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300">
                        {doc.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {doc.count} đánh giá
                    </span>
                  </div>
                </div>

                {/* Progress bar mức độ hài lòng */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[11px]">Độ hài lòng:</span>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${(doc.averageRating / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      {Math.round((doc.averageRating / 5) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Thanh Lọc Đánh Giá Công Khai */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Lọc theo Bác sĩ:
            </span>
          </div>

          {/* Lọc nhanh theo số sao */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400 text-xs mr-1">Xếp hạng:</span>
            {['ALL', '5', '4', '3', '2', '1'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setRatingFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  ratingFilter === st
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Tất cả sao' : `${st} sao`}
              </button>
            ))}
          </div>
        </div>

        {/* Nút lọc theo từng bác sĩ */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedDoctorFilter('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedDoctorFilter === 'ALL'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Tất cả bác sĩ ({reviews.length})
          </button>
          {doctorStats.map((doc) => (
            <button
              key={doc.doctorId}
              type="button"
              onClick={() => setSelectedDoctorFilter(doc.doctorId)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDoctorFilter === doc.doctorId
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {doc.doctorName} ({doc.count})
            </button>
          ))}
        </div>
      </div>

      {/* Danh Sách Công Khai Các Đánh Giá Của Bệnh Nhân */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Nhận xét từ bệnh nhân ({filteredReviews.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            * 100% đánh giá từ ca khám thực tế tại MedCare
          </span>
        </div>

        {filteredReviews.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-10 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Chưa có đánh giá nào cho tiêu chí này
            </h4>
            <p className="text-xs text-slate-400">
              Hãy chọn bộ lọc khác hoặc là bệnh nhân đầu tiên gửi phản hồi!
            </p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow"
            >
              {/* Header của Đánh giá */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 flex items-center justify-center font-bold text-xs">
                    {rev.patientName ? rev.patientName.charAt(0).toUpperCase() : 'B'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {rev.patientName}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3 mr-0.5" /> Đã khám thực tế
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Ngày đánh giá: {rev.createdAt}
                    </span>
                  </div>
                </div>

                {/* Tag Bác sĩ được đánh giá */}
                <div className="flex items-center space-x-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <Stethoscope className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  <span className="text-slate-500 dark:text-slate-400">Bác sĩ:</span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    {rev.doctorName}
                  </strong>
                  <span className="text-[10px] text-primary-600">({rev.specialty})</span>
                </div>
              </div>

              {/* Số sao & Nhận xét */}
              <div className="space-y-1.5">
                <StarRating rating={rev.rating} size="sm" interactive={false} />
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>
              </div>

              {/* Footer thẻ review */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span className="italic">
                  Mã ca khám: {rev.appointmentId || 'Khám nội viện MedCare'}
                </span>
                <span className="flex items-center text-slate-400 hover:text-primary-600 transition-colors cursor-pointer">
                  <ThumbsUp className="w-3.5 h-3.5 mr-1" /> Hữu ích
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorReviewsTab;
