import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectDoctor, selectDate, selectSlot, nextStep } from '../../store/slices/bookingSlice';
import axiosClient from '../../api/axiosClient';
import { Calendar, Clock, RefreshCw, AlertCircle, Stethoscope, Star, CheckCircle, ArrowRight } from 'lucide-react';
import Button from '../../components/common/Button';

const DoctorSlotSelector = () => {
  const dispatch = useDispatch();
  const { selectedDoctor, selectedDate, selectedSlot } = useSelector((state) => state.booking);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [slotsData, setSlotsData] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

                                      
  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      try {
        setLoadingDoctors(true);
        const res = await axiosClient.get('/appointments/doctors');
        if (isMounted && res.success && res.data.length > 0) {
          setDoctors(res.data);
                                                                             
          const selectedId = selectedDoctor?.doctorId || selectedDoctor?.userId?._id || selectedDoctor?.userId || selectedDoctor?.id;
          const profileId = selectedDoctor?._id;
          const matched = res.data.find((doctor) => String(doctor.doctorId) === String(selectedId) || String(doctor.doctorProfileId) === String(profileId));
          if (selectedDoctor && !matched) {
            dispatch(selectDoctor(null));
            setErrorMsg('Không tìm thấy lịch đặt cho bác sĩ đã chọn. Vui lòng chọn bác sĩ từ danh sách.');
          } else {
            dispatch(selectDoctor(matched || res.data[0]));
          }
        }
      } catch (err) {
        if (isMounted) setErrorMsg('Không thể tải danh sách bác sĩ. Vui lòng thử lại!');
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    };

    fetchDoctors();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

                                                        
  const fetchSlots = async () => {
    if (!selectedDoctor || !selectedDate || !(selectedDoctor.doctorId || selectedDoctor.id)) return;
    try {
      setLoadingSlots(true);
      setErrorMsg('');
      const docId = selectedDoctor.doctorId || selectedDoctor.id;
      const res = await axiosClient.get(`/appointments/slots?doctorId=${docId}&date=${selectedDate}`);
      if (res.success) {
        setSlotsData(res.data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi tải danh sách khung giờ khám!');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [selectedDoctor, selectedDate]);

                    
  const handleSlotClick = (slot) => {
    if (slot.isBooked) return;
    dispatch(selectSlot(slot.time));
  };

  const handleNext = () => {
    if (!selectedSlot) return;
    dispatch(nextStep());
  };

                                                   
  const localDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const todayStr = localDate(new Date());
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = localDate(maxDate);

  return (
    <div className="space-y-6">
      {                 }
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              1. Chọn Bác Sĩ Chuyên Khoa
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {doctors.length} bác sĩ sẵn sàng nhận lịch
          </span>
        </div>

        {loadingDoctors ? (
          <div className="py-8 text-center text-sm text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-primary-600" />
            <span>Đang tải danh sách bác sĩ MedCare...</span>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => {
              const isSelected = (selectedDoctor?.doctorId || selectedDoctor?.id) === (doc.doctorId || doc.id);
              return (
                <div
                  key={doc.id || doc.doctorId}
                  onClick={() => dispatch(selectDoctor(doc))}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/40 ring-2 ring-primary-500 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={doc.avatar}
                      alt={doc.name}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="inline-block px-2 py-0.5 text-[11px] font-semibold rounded bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                        {doc.specialty}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
                        {doc.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{doc.degree}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                      <span>{doc.rating}</span>
                      <span className="text-slate-400 font-normal ml-0.5">({doc.reviewCount})</span>
                    </div>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {Number(doc.fee).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {                                 }
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              2. Chọn Ngày & Khung Giờ Khám (30 phút/ca)
            </h2>
          </div>

          {                           }
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
              <Calendar className="w-4 h-4 text-primary-600" />
              <input
                type="date"
                min={todayStr}
                max={maxDateStr}
                value={selectedDate}
                onChange={(e) => dispatch(selectDate(e.target.value))}
                className="bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={fetchSlots}
              disabled={loadingSlots}
              title="Làm mới trạng thái khung giờ"
              className="p-2 text-slate-500 hover:text-primary-600 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSlots ? 'animate-spin text-primary-600' : ''}`} />
            </button>
          </div>
        </div>

        {                                 }
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900" />
            <span className="text-slate-600 dark:text-slate-400">Còn trống</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-primary-600 ring-2 ring-primary-300" />
            <span className="text-primary-700 dark:text-primary-400 font-semibold">Đang chọn</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300" />
            <span className="text-amber-700 dark:text-amber-400">Đang giữ chỗ (5p)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
            <span className="text-slate-400 line-through">Đã kín ca</span>
          </div>
        </div>

        {                   }
        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {               }
        {loadingSlots ? (
          <div className="py-12 text-center text-sm text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
            <span>Đang kiểm tra tình trạng slot thời gian thực...</span>
          </div>
        ) : slotsData?.slots && slotsData.slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {slotsData.slots.map((slot, index) => {
              const isSelected = selectedSlot === slot.time;
              const isHolding = slot.status === 'holding';
              const isBooked = slot.isBooked || slot.isPast;

              return (
                <button
                  key={index}
                  type="button"
                  disabled={isBooked}
                  onClick={() => handleSlotClick(slot)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center relative ${
                    isBooked
                      ? isHolding
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 cursor-not-allowed'
                        : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md ring-2 ring-primary-300'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono">{slot.time}</span>
                  <span className="text-[11px] font-normal mt-1">
                    {slot.isPast ? 'Đã qua' : isHolding ? 'Đang giữ 5p' : isBooked ? 'Đã kín' : isSelected ? 'Đang chọn' : 'Còn trống'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            Bác sĩ không có lịch trực vào ngày này. Vui lòng chọn ngày khác!
          </div>
        )}

        {                }
        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 block">Lựa chọn hiện tại:</span>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              {selectedDoctor?.name || 'Chưa chọn BS'} –{' '}
              <span className="text-primary-600 font-mono">
                {selectedSlot ? `${selectedSlot} (${selectedDate})` : 'Vui lòng chọn 1 khung giờ'}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!selectedSlot}
            onClick={handleNext}
            className="w-full sm:w-auto"
          >
            <span>Tiếp tục điền thông tin</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DoctorSlotSelector;

