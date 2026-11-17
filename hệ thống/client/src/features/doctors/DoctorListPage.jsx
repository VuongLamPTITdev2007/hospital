import React, { useMemo, useState } from 'react';
import { Calendar, Search, Star, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useDebounce } from '../../hooks/useDebounce';
import { useFetch } from '../../hooks/useFetch';

const DoctorListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);
  const { data: doctorResponse, loading: doctorLoading, error: doctorError, refetch } = useFetch('/doctors');
  const { data: specialtyResponse } = useFetch('/specialties');

  const doctors = useMemo(() => {
    const normalizedSearch = debouncedSearch.trim().toLowerCase();
    return (doctorResponse?.data || []).filter((doctor) => {
      const matchesSpecialty = !selectedSpecialty || doctor.specialtyId === selectedSpecialty;
      const searchable = `${doctor.fullName} ${doctor.specialty} ${doctor.hospital}`.toLowerCase();
      return matchesSpecialty && (!normalizedSearch || searchable.includes(normalizedSearch));
    });
  }, [doctorResponse, debouncedSearch, selectedSpecialty]);

  if (doctorLoading) return <Loader text="Đang tải danh sách bác sĩ..." />;

  if (doctorError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <p>{doctorError}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="mt-3">Tải lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-primary-500/10">
        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">Phân hệ TV 1: Cổng Bác sĩ & Chuyên khoa</span>
        <h1 className="text-2xl sm:text-3xl font-bold">Tìm kiếm Bác sĩ & Đặt lịch hẹn</h1>
        <p className="mt-2 text-primary-100 max-w-2xl text-sm sm:text-base">Tra cứu hồ sơ chuyên môn, chuyên khoa, lịch làm việc và đánh giá từ bệnh nhân.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
            <input type="search" placeholder="Tìm theo bác sĩ, chuyên khoa hoặc bệnh viện..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full pl-11 pr-4 py-2.5 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white text-sm" />
          </div>
          <select value={selectedSpecialty} onChange={(event) => setSelectedSpecialty(event.target.value)} className="px-4 py-2.5 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-white text-sm font-medium">
            <option value="">Tất cả chuyên khoa</option>
            {(specialtyResponse?.data || []).map((specialty) => <option key={specialty._id} value={specialty._id}>{specialty.name}</option>)}
          </select>
        </div>
      </section>

      {doctors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center text-slate-500">Không tìm thấy bác sĩ phù hợp.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <article key={doctor.profileId} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start space-x-4">
                  <img src={doctor.avatar} alt={doctor.fullName} className="w-16 h-16 rounded-xl object-cover border-2 border-primary-100 dark:border-primary-900" />
                  <div className="min-w-0">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">{doctor.specialty}</span>
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">{doctor.degree} {doctor.fullName}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{doctor.hospital}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{doctor.bio || `${doctor.experienceYears} năm kinh nghiệm khám và điều trị.`}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center text-amber-500 font-semibold"><Star className="w-4 h-4 fill-amber-400 mr-1" />{doctor.averageRating.toFixed(1)} <span className="text-slate-400 ml-1">({doctor.reviewCount})</span></div>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{doctor.consultationFee.toLocaleString('vi-VN')} đ/lượt</span>
                </div>
              </div>
              <Link to={`/booking?doctorId=${doctor.id}`} className="mt-5"><Button variant="primary" className="w-full flex items-center justify-center"><Calendar className="w-4 h-4 mr-2" /> Đặt lịch khám</Button></Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorListPage;
