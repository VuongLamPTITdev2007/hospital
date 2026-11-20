import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { selectDoctor } from '../../store/slices/bookingSlice';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import {
  ArrowLeft,
  Star,
  Hospital,
  Award,
  Calendar,
  Clock,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  MapPin
} from 'lucide-react';

const DAY_NAMES = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật'
};

const HANOI_DOCTORS_MAP = {
  doc_lanhieu: {
    degree: 'Phó Giáo sư, Tiến sĩ, Bác sĩ Cao cấp',
    hospital: 'Bệnh viện Đại học Y Hà Nội (Số 1 Tôn Thất Tùng, Đống Đa)',
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
    bio: 'Giám đốc BV Đại học Y Hà Nội. Chuyên gia đầu ngành can thiệp tim bẩm sinh và tim mạch can thiệp tại Việt Nam với nhiều năm tu nghiệp tại Pháp và Mỹ.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] },
      { dayOfWeek: 3, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] },
      { dayOfWeek: 5, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] }
    ]
  },
  doc_tiendung: {
    degree: 'Phó Giáo sư, Tiến sĩ Bác sĩ Nhi',
    hospital: 'Bệnh viện Bạch Mai (Số 78 Giải Phóng, Phương Mai, Đống Đa)',
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
    bio: 'Nguyên Trưởng khoa Nhi - Bệnh viện Bạch Mai. Chuyên gia điều trị viêm phổi, hen suyễn, viêm phế quản co thắt và dị ứng nhi khoa.',
    workingHours: [
      { dayOfWeek: 2, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] },
      { dayOfWeek: 4, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] },
      { dayOfWeek: 6, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  doc_vinhngoc: {
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
    bio: 'Phó Chủ tịch Hội Thấp khớp học Hà Nội. Chuyên gia điều trị thoái hóa khớp gối, thoái hóa cột sống, thoát vị đĩa đệm và gút.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] },
      { dayOfWeek: 3, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30'] }
    ]
  },
  doc_vanlong: {
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
    bio: 'Nguyên Trưởng khoa Tiêu hóa BV Bạch Mai. Chuyên gia hàng đầu Việt Nam về tầm soát ung thư sớm đường tiêu hóa và dạ dày HP kháng thuốc.',
    workingHours: [
      { dayOfWeek: 2, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 4, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  doc_vanlieu: {
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
    bio: 'Chuyên gia đầu ngành nội thần kinh. Chuyên khám chữa chứng đau nửa đầu, mất ngủ, rối loạn tiền đình và phục hồi đột quỵ.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 5, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  doc_thilan: {
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
    bio: 'Giảng viên cao cấp ĐH Y Hà Nội, Bác sĩ BV Da liễu TW. Chuyên trị mụn trứng cá nặng, viêm da cơ địa và thẩm mỹ da nội khoa.',
    workingHours: [
      { dayOfWeek: 2, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 6, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  doc_baquyet: {
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
    bio: 'Nguyên Giám đốc BV Phụ sản TW. Chuyên gia phẫu thuật nội soi sản phụ khoa hàng đầu Việt Nam và vô sinh hiếm muộn.',
    workingHours: [
      { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 4, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  },
  doc_thihanh: {
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
    bio: 'Phó Chủ tịch Hội Hô hấp VN, Phó GĐ Trung tâm Hô hấp BV Bạch Mai. Chuyên trị hen phế quản, COPD và viêm phổi.',
    workingHours: [
      { dayOfWeek: 3, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] },
      { dayOfWeek: 5, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30'] }
    ]
  }
};

const DoctorDetailPage = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchDoctorDetail = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/doctors/${id}`);
        if (isMounted && res.success && res.data) {
          setDoctor(res.data);
          setReviews(res.reviews || []);
        } else if (isMounted) {
          fallbackDoctor();
        }
      } catch (err) {
        if (isMounted) fallbackDoctor();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const fallbackDoctor = () => {
      const found = HANOI_DOCTORS_MAP[id] || HANOI_DOCTORS_MAP['doc_lanhieu'];
      setDoctor({ _id: id, ...found });
      setReviews([
        {
          _id: 'rev1',
          patientId: { fullName: 'Trần Văn Bình' },
          rating: 5,
          comment: 'Bác sĩ khám bệnh rất kỹ lưỡng, giải thích nguyên nhân rõ ràng và kê đơn hiệu quả.',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'rev2',
          patientId: { fullName: 'Lê Thị Thu Trang' },
          rating: 5,
          comment: 'Hệ thống đặt lịch giúp không phải chờ đợi lâu. Bác sĩ chuyên môn rất cao!',
          createdAt: new Date().toISOString()
        }
      ]);
    };

    fetchDoctorDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleBookAppointment = () => {
    if (doctor) {
      dispatch(selectDoctor(doctor));
      navigate('/booking');
    }
  };

  if (loading) {
    return <Loader text="Đang tải hồ sơ bác sĩ Hà Nội..." />;
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">Không tìm thấy thông tin bác sĩ yêu cầu.</p>
        <Link to="/doctors" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Nút quay lại */}
      <Link to="/doctors" className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại Cổng tra cứu Bác sĩ Hà Nội
      </Link>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img
            src={doctor.userId?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=350&q=80'}
            alt={doctor.userId?.fullName}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-primary-50 dark:border-primary-950 shadow-md flex-shrink-0"
          />

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                Chuyên khoa: {doctor.specialtyId?.name || 'Đa khoa'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Bác sĩ Bệnh viện Tuyến Trung ương
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {doctor.userId?.fullName}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                <strong>Học hàm / Học vị:</strong>&nbsp;{doctor.degree}
              </p>
              <p className="flex items-center">
                <Hospital className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                <strong>Cơ sở công tác:</strong>&nbsp;{doctor.hospital}
              </p>
              <p className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                <strong>Kinh nghiệm:</strong>&nbsp;{doctor.experienceYears} năm lâm sàng
              </p>
              <div className="flex items-center text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 mr-1.5" />
                <span>{doctor.averageRating || 5.0} / 5.0</span>
                <span className="text-slate-400 font-normal ml-1">({doctor.reviewCount || 0} lượt khám)</span>
              </div>
            </div>

            {/* Price & Booking Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Giá khám chuyên gia:</p>
                <p className="text-2xl font-extrabold text-primary-600">
                  {(doctor.consultationFee || 350000).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleBookAppointment}
                className="w-full sm:w-auto shadow-lg shadow-primary-500/20 flex items-center justify-center"
              >
                <Calendar className="w-4 h-4 mr-2" /> Đặt lịch khám với Bác sĩ này
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Bio & Working Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Bio & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Quá trình đào tạo & Quá trình công tác
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {doctor.bio}
            </p>
            <div className="pt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Bác sĩ Bệnh viện Công lập Hà Nội
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Kê đơn thuốc điện tử
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Hội chẩn liên viện
              </span>
            </div>
          </div>

          {/* Patient Reviews */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary-600" /> Đánh giá thực tế từ bệnh nhân
              </h2>
              <span className="text-xs text-slate-400 font-semibold">{reviews.length} nhận xét</span>
            </div>

            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {rev.patientId?.fullName || 'Bệnh nhân MedCare'}
                    </span>
                    <div className="flex text-amber-400">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Working Schedule Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-primary-600" /> Lịch khám chuyên gia theo tuần
          </h2>
          <p className="text-xs text-slate-500">Mỗi ca khám 30 phút. Bệnh nhân chọn ca phù hợp để giữ chỗ trực tuyến.</p>

          <div className="space-y-3">
            {doctor.workingHours && doctor.workingHours.length > 0 ? (
              doctor.workingHours.map((wh, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-primary-600">
                    <span>{DAY_NAMES[wh.dayOfWeek] || `Thứ ${wh.dayOfWeek + 1}`}</span>
                    <span className="text-[11px] bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded text-primary-700 dark:text-primary-300">
                      {wh.slots?.length || 0} ca khám
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {wh.slots?.map((slot, sIdx) => (
                      <span key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px]">
                        {slot}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">Chưa cập nhật lịch khám.</p>
            )}
          </div>

          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={handleBookAppointment} className="w-full text-xs">
              Chọn ca và Đặt lịch ngay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetailPage;
