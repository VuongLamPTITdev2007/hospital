import React, { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, Stethoscope, Star, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';

// Mock danh sách bác sĩ ban đầu
const MOCK_DOCTORS = [
  {
    id: 'doc1',
    name: 'BSCKII. Nguyễn Văn An',
    specialty: 'Tim mạch',
    hospital: 'Bệnh viện Bạch Mai - MedCare Clinic',
    rating: 4.9,
    reviewCount: 128,
    fee: 350000,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=250&q=80',
    availableDays: 'T2, T4, T6'
  },
  {
    id: 'doc2',
    name: 'ThS.BS. Trần Thị Mai',
    specialty: 'Nhi khoa',
    hospital: 'Bệnh viện Nhi TW - MedCare Clinic',
    rating: 5.0,
    reviewCount: 94,
    fee: 300000,
    avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=250&q=80',
    availableDays: 'T3, T5, T7'
  },
  {
    id: 'doc3',
    name: 'TS.BS. Lê Hoàng Nam',
    specialty: 'Cơ xương khớp',
    hospital: 'Viện Chấn thương Chỉnh hình',
    rating: 4.8,
    reviewCount: 65,
    fee: 400000,
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=250&q=80',
    availableDays: 'T2 - T7'
  }
];

const DoctorListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  // Áp dụng custom hook useDebounce cho ô tìm kiếm
  const debouncedSearch = useDebounce(searchTerm, 300);

  const filteredDoctors = MOCK_DOCTORS.filter(doc => {
    const matchName = doc.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                      doc.specialty.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchSpecialty = selectedSpecialty === 'all' || doc.specialty === selectedSpecialty;
    return matchName && matchSpecialty;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-primary-500/10">
        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
          Phân hệ TV 1: Cổng Bác sĩ & Chuyên khoa
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold">Tìm kiếm Bác sĩ & Đặt lịch hẹn</h1>
        <p className="mt-2 text-primary-100 max-w-2xl text-sm sm:text-base">
          Tra cứu hồ sơ chuyên môn, lịch làm việc và đánh giá thực tế từ bệnh nhân. Sử dụng custom hook useDebounce để lọc dữ liệu mượt mà.
        </p>

        {/* Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white text-sm"
            />
          </div>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-2.5 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-white text-sm font-medium"
          >
            <option value="all">Tất cả chuyên khoa</option>
            <option value="Tim mạch">Tim mạch</option>
            <option value="Nhi khoa">Nhi khoa</option>
            <option value="Cơ xương khớp">Cơ xương khớp</option>
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDoctors.map(doctor => (
          <div
            key={doctor.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start space-x-4">
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-primary-100 dark:border-primary-900"
                />
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                    {doctor.specialty}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate mt-1">
                    {doctor.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{doctor.hospital}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center text-amber-500 font-semibold">
                  <Star className="w-4 h-4 fill-amber-400 mr-1" />
                  <span>{doctor.rating}</span>
                  <span className="text-slate-400 ml-1">({doctor.reviewCount})</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-medium">
                  {doctor.fee.toLocaleString('vi-VN')} đ / lượt
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Link to="/booking">
                <Button variant="primary" className="w-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" /> Đặt lịch khám
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorListPage;
