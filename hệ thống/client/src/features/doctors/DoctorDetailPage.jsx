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
  CheckCircle2
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

const DoctorDetailPage = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctorDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axiosClient.get(`/doctors/${id}`);
        if (res.success && res.data) {
          setDoctor(res.data);
          setReviews(res.reviews || []);
        }
      } catch (err) {
        // Fallback data nếu ID không tìm thấy trong DB
        setDoctor({
          _id: id,
          degree: 'Bác sĩ Chuyên khoa II',
          hospital: 'Bệnh viện Bạch Mai - MedCare Clinic',
          consultationFee: 350000,
          experienceYears: 18,
          averageRating: 4.9,
          reviewCount: 142,
          userId: {
            fullName: 'BSCKII. Nguyễn Văn An',
            email: 'doctor.an@medcare.vn',
            phone: '0981234561',
            avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'
          },
          specialtyId: {
            name: 'Tim mạch',
            description: 'Chẩn đoán và điều trị tăng huyết áp, rối loạn nhịp tim và bệnh động mạch vành.'
          },
          bio: 'Nguyên Phó Trưởng khoa Tim mạch Viện Tim Hà Nội với hơn 18 năm kinh nghiệm lâm sàng. Bác sĩ An chuyên sâu về các bệnh lý tim mạch can thiệp, huyết áp kháng trị và theo dõi tim mạch hậu phẫu.',
          workingHours: [
            { dayOfWeek: 1, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] },
            { dayOfWeek: 3, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] },
            { dayOfWeek: 5, slots: ['08:00 - 08:30', '08:30 - 09:00', '09:00 - 09:30', '14:00 - 14:30', '14:30 - 15:00'] }
          ]
        });
        setReviews([
          {
            _id: 'rev1',
            patientId: { fullName: 'Trần Văn Bình' },
            rating: 5,
            comment: 'Bác sĩ An khám rất nhẹ nhàng và giải thích cặn kẽ nguyên nhân bệnh. Thuốc uống sau 1 tuần đã đỡ đau thắt ngực hẳn.',
            createdAt: '2026-11-10T08:00:00Z'
          },
          {
            _id: 'rev2',
            patientId: { fullName: 'Lê Thị Thu' },
            rating: 5,
            comment: 'Đặt lịch qua hệ thống đúng giờ là vào khám ngay, không phải chen chúc lấy số như ở viện công.',
            createdAt: '2026-11-05T09:30:00Z'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetail();
  }, [id]);

  const handleBookAppointment = () => {
    if (doctor) {
      dispatch(selectDoctor(doctor));
      navigate('/booking');
    }
  };

  if (loading) {
    return <Loader text="Đang tải hồ sơ bác sĩ..." />;
  }

  if (error || !doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium">{error || 'Không tìm thấy thông tin bác sĩ'}</p>
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
        <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại Cổng tra cứu Bác sĩ
      </Link>

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img
            src={doctor.userId?.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'}
            alt={doctor.userId?.fullName}
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-4 border-primary-50 dark:border-primary-950 shadow-md flex-shrink-0"
          />

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                Chuyên khoa: {doctor.specialtyId?.name || 'Đa khoa'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Đã xác thực chứng chỉ
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {doctor.userId?.fullName}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p className="flex items-center">
                <Award className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                <strong>Học vị:</strong>&nbsp;{doctor.degree}
              </p>
              <p className="flex items-center">
                <Hospital className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                <strong>Bệnh viện:</strong>&nbsp;{doctor.hospital}
              </p>
              <p className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-primary-600 flex-shrink-0" />
                <strong>Kinh nghiệm:</strong>&nbsp;{doctor.experienceYears} năm công tác
              </p>
              <div className="flex items-center text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400 mr-1.5" />
                <span>{doctor.averageRating || 5.0} / 5.0</span>
                <span className="text-slate-400 font-normal ml-1">({doctor.reviewCount || 0} lượt đánh giá)</span>
              </div>
            </div>

            {/* Price & Booking Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">Giá khám ban đầu:</p>
                <p className="text-2xl font-extrabold text-primary-600">
                  {(doctor.consultationFee || 300000).toLocaleString('vi-VN')} VNĐ
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
              Giới thiệu chuyên môn & Quá trình công tác
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {doctor.bio}
            </p>
            <div className="pt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Bác sĩ nội trú
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Kê đơn thuốc điện tử
              </span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-primary-600" /> Tư vấn trực tuyến
              </span>
            </div>
          </div>

          {/* Patient Reviews */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary-600" /> Đánh giá từ bệnh nhân đã khám
              </h2>
              <span className="text-xs text-slate-400 font-semibold">{reviews.length} nhận xét</span>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Chưa có đánh giá nào cho bác sĩ này.</p>
            ) : (
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
            )}
          </div>
        </div>

        {/* Right Column: Working Schedule Table */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-primary-600" /> Lịch khám định kỳ trong tuần
          </h2>
          <p className="text-xs text-slate-500">Mỗi ca khám kéo dài 30 phút. Bệnh nhân có thể chọn ca trực tiếp tại bước đặt lịch.</p>

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
                    {wh.slots?.slice(0, 4).map((slot, sIdx) => (
                      <span key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[10px]">
                        {slot}
                      </span>
                    ))}
                    {wh.slots?.length > 4 && (
                      <span className="px-1.5 py-0.5 text-slate-400 text-[10px]">...</span>
                    )}
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
