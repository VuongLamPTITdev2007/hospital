import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPatientInfo, setHoldingInfo, nextStep, prevStep } from '../../store/slices/bookingSlice';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import { User, Phone, Mail, FileText, ArrowLeft, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const PatientInfoForm = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { selectedDoctor, selectedDate, selectedSlot, patientInfo } = useSelector((state) => state.booking);

  const [formData, setFormData] = useState({
    fullName: patientInfo.fullName || user?.fullName || '',
    phone: patientInfo.phone || user?.phone || '',
    email: patientInfo.email || user?.email || '',
    gender: patientInfo.gender || 'Nam',
    dob: patientInfo.dob || '1995-01-01',
    symptoms: patientInfo.symptoms || ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState('');

  // Tự động điền thông tin nếu user đăng nhập
  useEffect(() => {
    if (user && !formData.fullName) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Vui lòng nhập họ và tên bệnh nhân!';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Vui lòng nhập số điện thoại!';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone.trim())) {
      errs.phone = 'Số điện thoại không hợp lệ (10 chữ số, đầu 03/05/07/08/09)!';
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errs.email = 'Địa chỉ email không đúng định dạng!';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setConflictError('');
    setSubmitting(true);

    try {
      // Cập nhật thông tin vào Redux store
      dispatch(setPatientInfo(formData));

      // Gọi API giữ chỗ 5 phút trên server
      const payload = {
        doctorId: selectedDoctor.doctorId || selectedDoctor.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        patientName: formData.fullName.trim(),
        patientPhone: formData.phone.trim(),
        symptomsNote: formData.symptoms ? formData.symptoms.trim() : ''
      };

      const res = await axiosClient.post('/appointments/hold', payload);

      if (res.success) {
        dispatch(setHoldingInfo(res.data));
        dispatch(nextStep());
      }
    } catch (err) {
      // Xử lý mã lỗi 409 Conflict hoặc lỗi khác
      setConflictError(err.message || 'Khung giờ này vừa có người giữ chỗ. Vui lòng chọn khung giờ khác!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Tóm tắt ca khám */}
      <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-bold text-primary-700 dark:text-primary-300">
            Khung giờ hẹn đã chọn
          </span>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
            {selectedDoctor?.name} – {selectedDoctor?.specialty}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Ngày: <strong>{selectedDate}</strong> | Giờ: <strong className="text-primary-600">{selectedSlot}</strong> | Giá khám: <strong>{Number(selectedDoctor?.fee || 350000).toLocaleString('vi-VN')} đ</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(prevStep())}
          className="text-xs text-primary-600 hover:text-primary-700 font-semibold underline self-start sm:self-center"
        >
          Đổi khung giờ khác
        </button>
      </div>

      {/* Cảnh báo Khung giờ đã được đặt nếu có */}
      {conflictError && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl flex items-start space-x-3 text-amber-800 dark:text-amber-200 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Khung giờ vừa có người giữ chỗ!</h4>
            <p className="text-xs mt-0.5">{conflictError}</p>
            <button
              type="button"
              onClick={() => dispatch(prevStep())}
              className="mt-2 text-xs font-semibold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Quay lại chọn khung giờ khác
            </button>
          </div>
        </div>
      )}

      {/* Form thông tin bệnh nhân */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5">
        <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-700">
          <User className="w-5 h-5 text-primary-600" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
            Thông Tin Người Khám Bệnh
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Họ và tên bệnh nhân"
            name="fullName"
            required
            placeholder="Ví dụ: Nguyễn Văn A"
            value={formData.fullName}
            onChange={handleChange}
            error={errors.fullName}
          />

          <Input
            label="Số điện thoại liên hệ"
            name="phone"
            required
            placeholder="Ví dụ: 0912345678"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Email nhận phiếu khám"
            name="email"
            type="email"
            placeholder="benhnhan@gmail.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Giới tính
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <Input
            label="Ngày sinh"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
            <FileText className="w-4 h-4 mr-1 text-slate-400" /> Mô tả triệu chứng / Lý do khám
          </label>
          <textarea
            name="symptoms"
            rows="3"
            placeholder="Mô tả cụ thể triệu chứng hiện tại (ví dụ: đau đầu kéo dài 3 ngày, sốt nhẹ vào chiều tối...)"
            value={formData.symptoms}
            onChange={handleChange}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          ></textarea>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl flex items-center text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
          <span>Thông tin y tế được mã hóa và bảo mật theo tiêu chuẩn hồ sơ bệnh án điện tử (EHR).</span>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch(prevStep())}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại chọn lịch
          </Button>

          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            className="flex items-center"
          >
            <span>Tiến hành Giữ chỗ 5 phút & Cọc</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientInfoForm;

