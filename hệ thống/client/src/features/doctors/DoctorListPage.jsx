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
  Sparkles,
  MapPin
} from 'lucide-react';

// Dữ liệu Bác sĩ uy tín thực tế tại các Bệnh viện lớn ở Hà Nội
const HANOI_FALLBACK_DOCTORS = [
  {
    _id: 'doc_lanhieu',
    degree: 'Phó Giáo sư, Tiến sĩ, Bác sĩ Cao cấp',
    hospital: 'Bệnh viện Đại học Y Hà Nội (Tôn Thất Tùng, Đống Đa)',
    consultationFee: 450000,
    experienceYears: 25,
    averageRating: 5.0,
    reviewCount: 215,
    userId: {
      fullName: 'PGS.TS.BS. Nguyễn Lân Hiếu',
      email: 'lanhieu.nguyen@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Tim mạch' },
    bio: 'Giám đốc BV Đại học Y Hà Nội. Chuyên gia đầu ngành can thiệp tim bẩm sinh và tim mạch can thiệp tại Việt Nam.'
  },
  {
    _id: 'doc_tiendung',
    degree: 'Phó Giáo sư, Tiến sĩ Bác sĩ Nhi',
    hospital: 'Bệnh viện Bạch Mai (Số 78 Giải Phóng, Đống Đa)',
    consultationFee: 350000,
    experienceYears: 32,
    averageRating: 4.9,
    reviewCount: 180,
    userId: {
      fullName: 'PGS.TS.BS. Nguyễn Tiến Dũng',
      email: 'tiendung.nguyen@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Nhi khoa' },
    bio: 'Nguyên Trưởng khoa Nhi - Bệnh viện Bạch Mai. Chuyên gia điều trị viêm phổi nặng, dị ứng và hô hấp nhi khoa.'
  },
  {
    _id: 'doc_vinhngoc',
    degree: 'Phó Giáo sư, Tiến sĩ Y khoa',
    hospital: 'Bệnh viện Bạch Mai & Đại học Y Hà Nội',
    consultationFee: 400000,
    experienceYears: 28,
    averageRating: 4.9,
    reviewCount: 164,
    userId: {
      fullName: 'PGS.TS.BS. Nguyễn Vĩnh Ngọc',
      email: 'vinhngoc.nguyen@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Cơ xương khớp' },
    bio: 'Phó Chủ tịch Hội Thấp khớp học Hà Nội. Chuyên gia điều trị thoái hóa khớp gối, thoái hóa cột sống và gút.'
  },
  {
    _id: 'doc_vanlong',
    degree: 'Giáo sư, Tiến sĩ Y học',
    hospital: 'Bệnh viện Đại học Y Hà Nội (Nguyên Giám đốc BV)',
    consultationFee: 500000,
    experienceYears: 35,
    averageRating: 5.0,
    reviewCount: 240,
    userId: {
      fullName: 'GS.TS.BS. Đào Văn Long',
      email: 'vanlong.dao@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Tiêu hóa - Gan mật' },
    bio: 'Nguyên Trưởng khoa Tiêu hóa BV Bạch Mai. Chuyên gia hàng đầu về tầm soát ung thư sớm tiêu hóa và dạ dày HP.'
  },
  {
    _id: 'doc_vanlieu',
    degree: 'Phó Giáo sư, Bác sĩ Thần kinh',
    hospital: 'Bệnh viện Bạch Mai & Đại học Y Hà Nội',
    consultationFee: 400000,
    experienceYears: 30,
    averageRating: 4.8,
    reviewCount: 132,
    userId: {
      fullName: 'PGS.TS.BS. Nguyễn Văn Liệu',
      email: 'vanlieu.nguyen@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Thần kinh' },
    bio: 'Chuyên gia đầu ngành nội thần kinh. Chuyên khám chữa chứng đau nửa đầu, mất ngủ, rối loạn tiền đình và đột quỵ.'
  },
  {
    _id: 'doc_thilan',
    degree: 'Phó Giáo sư, Tiến sĩ Da liễu',
    hospital: 'Bệnh viện Da liễu Trung ương (Phương Mai, Đống Đa)',
    consultationFee: 350000,
    experienceYears: 22,
    averageRating: 4.9,
    reviewCount: 195,
    userId: {
      fullName: 'PGS.TS.BS. Phạm Thị Lan',
      email: 'thilan.pham@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Da liễu' },
    bio: 'Giảng viên cao cấp ĐH Y Hà Nội, Bác sĩ BV Da liễu TW. Chuyên trị mụn trứng cá nặng, viêm da cơ địa và thẩm mỹ da.'
  },
  {
    _id: 'doc_baquyet',
    degree: 'Phó Giáo sư, Tiến sĩ Sản phụ khoa',
    hospital: 'Bệnh viện Phụ sản Trung ương (Tràng Thi, Hoàn Kiếm)',
    consultationFee: 450000,
    experienceYears: 34,
    averageRating: 5.0,
    reviewCount: 220,
    userId: {
      fullName: 'PGS.TS.BS. Vũ Bá Quyết',
      email: 'baquyet.vu@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Sản phụ khoa' },
    bio: 'Nguyên Giám đốc BV Phụ sản TW. Chuyên gia phẫu thuật nội soi sản phụ khoa hàng đầu Việt Nam và vô sinh hiếm muộn.'
  },
  {
    _id: 'doc_thihanh',
    degree: 'Phó Giáo sư, Tiến sĩ Hô hấp',
    hospital: 'Trung tâm Hô hấp - Bệnh viện Bạch Mai',
    consultationFee: 380000,
    experienceYears: 26,
    averageRating: 4.8,
    reviewCount: 110,
    userId: {
      fullName: 'PGS.TS.BS. Chu Thị Hạnh',
      email: 'thihanh.chu@medcare.vn',
      avatar: 'https://images.unsplash.com/photo-1594824813572-98e841753947?auto=format&fit=crop&w=350&q=80'
    },
    specialtyId: { name: 'Hô hấp - Phổi' },
    bio: 'Phó Chủ tịch Hội Hô hấp VN, Phó GĐ Trung tâm Hô hấp BV Bạch Mai. Chuyên trị hen phế quản, COPD và viêm phổi.'
  }
];

const DEFAULT_SPECIALTIES = [
  { _id: 's1', name: 'Tim mạch' },
  { _id: 's2', name: 'Nhi khoa' },
  { _id: 's3', name: 'Cơ xương khớp' },
  { _id: 's4', name: 'Tiêu hóa - Gan mật' },
  { _id: 's5', name: 'Thần kinh' },
  { _id: 's6', name: 'Da liễu' },
  { _id: 's7', name: 'Sản phụ khoa' },
  { _id: 's8', name: 'Hô hấp - Phổi' }
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
        } else {
          setSpecialties(DEFAULT_SPECIALTIES);
        }
      } catch (err) {
        setSpecialties(DEFAULT_SPECIALTIES);
      }
    };
    fetchSpecialties();
  }, []);

  // 2. Tải danh sách Bác sĩ từ Server API hoặc Fallback
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
      if (res.success && Array.isArray(res.data)) {
        setDoctors(res.data);
        setTotalPages(res.totalPages || 1);
        setTotalDoctors(res.total ?? res.data.length);
      } else {
        filterClientData();
      }
    } catch (err) {
      filterClientData();
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSpecialty, sortBy, currentPage]);

  const filterClientData = () => {
    let filtered = [...HANOI_FALLBACK_DOCTORS];
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      filtered = filtered.filter(d =>
        d.userId.fullName.toLowerCase().includes(s) ||
        d.hospital.toLowerCase().includes(s) ||
        d.specialtyId.name.toLowerCase().includes(s) ||
        d.degree.toLowerCase().includes(s)
      );
    }
    if (selectedSpecialty !== 'all') {
      filtered = filtered.filter(d => d.specialtyId.name === selectedSpecialty);
    }

    // Sort
    if (sortBy === 'fee_asc') filtered.sort((a, b) => a.consultationFee - b.consultationFee);
    else if (sortBy === 'fee_desc') filtered.sort((a, b) => b.consultationFee - a.consultationFee);
    else if (sortBy === 'exp_desc') filtered.sort((a, b) => b.experienceYears - a.experienceYears);
    else filtered.sort((a, b) => b.averageRating - a.averageRating);

    // Pagination
    const limit = 6;
    const pages = Math.ceil(filtered.length / limit) || 1;
    const startIndex = (currentPage - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    setDoctors(paginated);
    setTotalPages(pages);
    setTotalDoctors(filtered.length);
  };

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
      {/* Banner giới thiệu Phân hệ 1 với Bác sĩ Hà Nội */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-800 via-primary-700 to-sky-700 p-6 sm:p-10 text-white shadow-xl shadow-primary-500/10">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>Mạng Lưới Chuyên Gia & Bác Sĩ Hàng Đầu Tại Hà Nội</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Cổng Tra Cứu Bác Sĩ Chuyên Khoa Hà Nội
          </h1>
          <p className="text-xs sm:text-sm text-primary-100 leading-relaxed">
            Kết nối trực tiếp với các Giáo sư, Phó Giáo sư, Bác sĩ đầu ngành từ các bệnh viện tuyến Trung ương:
            <strong> Bạch Mai, Việt Đức, Đại học Y Hà Nội, Nhi Trung ương, Da liễu TW, Phụ sản TW</strong>.
          </p>
        </div>

        {/* Thanh tìm kiếm & bộ lọc */}
        <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Ô tìm kiếm */}
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên bác sĩ (VD: Nguyễn Lân Hiếu, Đào Văn Long) hoặc bệnh viện..."
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
          onClick={() => { setSelectedSpecialty('all'); setCurrentPage(1); }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedSpecialty === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
          }`}
        >
          Tất cả chuyên khoa ({totalDoctors})
        </button>
        {specialties.map(spec => (
          <button
            key={spec._id}
            onClick={() => { setSelectedSpecialty(spec.name); setCurrentPage(1); }}
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
        <Loader text="Đang tìm kiếm bác sĩ chuyên khoa Hà Nội..." />
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Stethoscope className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Không tìm thấy bác sĩ nào phù hợp tại Hà Nội
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Vui lòng thử tìm với từ khóa khác (ví dụ: "Bạch Mai", "Nguyễn Lân Hiếu") hoặc chọn "Tất cả chuyên khoa".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <div
              key={doctor._id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Doctor Avatar & Top Info */}
                <div className="flex items-start space-x-3.5">
                  <img
                    src={doctor.userId?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=350&q=80'}
                    alt={doctor.userId?.fullName}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-primary-100 dark:border-primary-900 flex-shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 mb-1">
                      {doctor.specialtyId?.name || 'Đa khoa'}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate" title={doctor.userId?.fullName}>
                      {doctor.userId?.fullName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center mt-0.5" title={doctor.degree}>
                      <Award className="w-3.5 h-3.5 mr-1 text-primary-500 flex-shrink-0" />
                      {doctor.degree}
                    </p>
                  </div>
                </div>

                {/* Hospital & Bio */}
                <div className="mt-3.5 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p className="truncate flex items-center font-medium text-slate-700 dark:text-slate-300" title={doctor.hospital}>
                    <Hospital className="w-3.5 h-3.5 mr-1.5 text-primary-600 flex-shrink-0" />
                    {doctor.hospital}
                  </p>
                  <p className="line-clamp-2 text-slate-600 dark:text-slate-300 pt-1 leading-relaxed">
                    {doctor.bio}
                  </p>
                </div>

                {/* Rating & Fee */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-400 mr-1" />
                    <span>{doctor.averageRating || 5.0}</span>
                    <span className="text-slate-400 font-normal ml-1">
                      ({doctor.reviewCount || 0} lượt khám)
                    </span>
                  </div>
                  <div className="text-primary-600 font-extrabold text-sm">
                    {(doctor.consultationFee || 350000).toLocaleString('vi-VN')} đ
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
                  className="w-full text-xs flex items-center justify-center shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" /> Đặt lịch
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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
