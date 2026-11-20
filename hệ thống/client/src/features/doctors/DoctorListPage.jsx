import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { selectDoctor } from '../../store/slices/bookingSlice';
import { useDebounce } from '../../hooks/useDebounce';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import {
  Search,
  Stethoscope,
  Star,
  Calendar,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Hospital,
  Award,
  Sparkles
} from 'lucide-react';

// Dữ liệu dự phòng mẫu (Fallback khi máy chưa bật MongoDB)
const FALLBACK_DOCTORS = [
  {
    _id: 'doc1',
    degree: 'Bác sĩ Chuyên khoa II',
    hospital: 'Bệnh viện Bạch Mai - MedCare',
    consultationFee: 350000,
    experienceYears: 18,
    averageRating: 4.9,
    reviewCount: 142,
    userId: {
      fullName: 'BSCKII. Nguyễn Văn An',
      email: 'doctor.an@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'
    },
    specialtyId: { name: 'Tim mạch' },
    bio: 'Chuyên gia đầu ngành trong điều trị tăng huyết áp vô căn và rối loạn nhịp tim.'
  },
  {
    _id: 'doc2',
    degree: 'Thạc sĩ Bác sĩ Nhi',
    hospital: 'Bệnh viện Nhi Trung Ương',
    consultationFee: 300000,
    experienceYears: 12,
    averageRating: 5.0,
    reviewCount: 98,
    userId: {
      fullName: 'ThS.BS. Trần Thị Mai',
      email: 'doctor.mai@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=300&q=80'
    },
    specialtyId: { name: 'Nhi khoa' },
    bio: 'Bác sĩ tận tâm với hơn 12 năm kinh nghiệm khám chữa các bệnh lý đường hô hấp cho trẻ nhỏ.'
  },
  {
    _id: 'doc3',
    degree: 'Tiến sĩ Y khoa',
    hospital: 'Viện Chấn thương Chỉnh hình',
    consultationFee: 400000,
    experienceYears: 20,
    averageRating: 4.8,
    reviewCount: 76,
    userId: {
      fullName: 'TS.BS. Lê Hoàng Nam',
      email: 'doctor.nam@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80'
    },
    specialtyId: { name: 'Cơ xương khớp' },
    bio: 'Từng tu nghiệp chuyên sâu tại Pháp về phẫu thuật nội soi khớp và phục hồi chức năng.'
  }
];

const DoctorListPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Áp dụng Custom Hook useDebounce cho ô tìm kiếm (Tiêu chí 4)
  const debouncedSearch = useDebounce(searchTerm, 400);

  // 1. Tải danh mục Chuyên khoa
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await axiosClient.get('/specialties');
        if (res.success && res.data.length > 0) {
          setSpecialties(res.data);
        }
      } catch (err) {
        // Fallback danh mục mặc định
        setSpecialties([
          { _id: 's1', name: 'Tim mạch' },
          { _id: 's2', name: 'Nhi khoa' },
          { _id: 's3', name: 'Cơ xương khớp' },
          { _id: 's4', name: 'Thần kinh' },
          { _id: 's5', name: 'Tiêu hóa' },
          { _id: 's6', name: 'Da liễu' }
        ]);
      }
    };
    fetchSpecialties();
  }, []);

  // 2. Tải danh sách Bác sĩ từ Server API (Tiêu chí 7 & 8)
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch,
        specialty: selectedSpecialty,
        sortBy,
        page: currentPage,
        limit: 6
      };
      const res = await axiosClient.get('/doctors', { params });
      if (res.success && res.data.length > 0) {
        setDoctors(res.data);
        setTotalPages(res.totalPages);
        setTotalDoctors(res.total);
      } else {
        // Fallback filter client-side nếu database rỗng
        setDoctors(FALLBACK_DOCTORS);
        setTotalPages(1);
        setTotalDoctors(FALLBACK_DOCTORS.length);
      }
    } catch (err) {
      // Fallback khi server chưa bật MongoDB
      let filtered = [...FALLBACK_DOCTORS];
      if (debouncedSearch) {
        filtered = filtered.filter(d =>
          d.userId.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          d.specialtyId.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
      }
      if (selectedSpecialty !== 'all') {
        filtered = filtered.filter(d => d.specialtyId.name === selectedSpecialty);
      }
      setDoctors(filtered);
      setTotalPages(1);
      setTotalDoctors(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSpecialty, sortBy, currentPage]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Điều hướng nhanh sang module Đặt lịch của TV 2
  const handleQuickBook = (doctor) => {
    dispatch(selectDoctor(doctor));
    navigate('/booking');
  };

  return (
    <div className="space-y-6">
      {/* Banner giới thiệu Phân hệ 1 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-700 via-primary-600 to-sky-600 p-6 sm:p-10 text-white shadow-xl shadow-primary-500/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Phân hệ TV 1: Nguyễn Thọ Việt Dũng</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Cổng Tra Cứu Bác Sĩ & Chuyên Khoa
          </h1>
          <p className="text-xs sm:text-sm text-primary-100 leading-relaxed">
            Hệ thống lọc thông minh với <code className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">useDebounce</code>,
            phân trang dữ liệu và tìm kiếm toán tử <code className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono">$regex</code> từ MongoDB.
          </p>
        </div>

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Ô tìm kiếm */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ, học vị, hoặc bệnh viện..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-white text-sm shadow-sm"
            />
          </div>

          {/* Chọn chuyên khoa */}
          <div className="sm:col-span-3">
            <select
              value={selectedSpecialty}
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-white text-sm font-medium shadow-sm"
            >
              <option value="all">Tất cả chuyên khoa</option>
              {specialties.map(spec => (
                <option key={spec._id} value={spec.name}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-white text-sm font-medium shadow-sm"
            >
              <option value="rating_desc">Đánh giá cao nhất</option>
              <option value="fee_asc">Giá khám: Thấp → Cao</option>
              <option value="fee_desc">Giá khám: Cao → Thấp</option>
              <option value="exp_desc">Kinh nghiệm nhiều nhất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Specialty Quick Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedSpecialty('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedSpecialty === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          Tất cả ({totalDoctors})
        </button>
        {specialties.map(spec => (
          <button
            key={spec._id}
            onClick={() => setSelectedSpecialty(spec.name)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSpecialty === spec.name
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            {spec.name}
          </button>
        ))}
      </div>

      {/* Doctor Cards Grid */}
      {loading ? (
        <Loader text="Đang tìm kiếm bác sĩ phù hợp..." />
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Stethoscope className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Không tìm thấy bác sĩ nào phù hợp
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng thử tìm với từ khóa khác hoặc bỏ bớt bộ lọc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <div
              key={doctor._id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Doctor Avatar & Top Info */}
                <div className="flex items-start space-x-3.5">
                  <img
                    src={doctor.userId?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'}
                    alt={doctor.userId?.fullName}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-primary-100 dark:border-primary-900 flex-shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 mb-1">
                      {doctor.specialtyId?.name || 'Đa khoa'}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                      {doctor.userId?.fullName || 'Bác sĩ'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center mt-0.5">
                      <Award className="w-3.5 h-3.5 mr-1 text-primary-500 flex-shrink-0" />
                      {doctor.degree || 'Bác sĩ Chuyên khoa'}
                    </p>
                  </div>
                </div>

                {/* Hospital & Bio */}
                <div className="mt-3.5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p className="truncate flex items-center">
                    <Hospital className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                    {doctor.hospital || 'Phòng khám MedCare'}
                  </p>
                  <p className="line-clamp-2 text-slate-600 dark:text-slate-300 pt-1">
                    {doctor.bio}
                  </p>
                </div>

                {/* Rating & Fee */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 mr-1" />
                    <span>{doctor.averageRating || 5.0}</span>
                    <span className="text-slate-400 font-normal ml-1">
                      ({doctor.reviewCount || 0} đánh giá)
                    </span>
                  </div>
                  <div className="text-primary-600 font-bold">
                    {(doctor.consultationFee || 300000).toLocaleString('vi-VN')} đ
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-2 gap-2 pt-1">
                <Link to={`/doctors/${doctor._id}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Xem hồ sơ
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleQuickBook(doctor)}
                  className="w-full text-xs flex items-center justify-center"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" /> Đặt lịch
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls (Tiêu chí 8) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Trang trước
          </Button>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Trang sau <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DoctorListPage;
