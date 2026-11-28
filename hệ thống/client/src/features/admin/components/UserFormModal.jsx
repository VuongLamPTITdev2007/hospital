import React, { useEffect, useState } from 'react';
import { AlertCircle, Stethoscope } from 'lucide-react';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Modal from '../../../components/common/Modal';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^(0[35789])\d{8}$/;

const buildInitialForm = ({ mode, initialUser, initialRole, specialties }) => {
  const defaultSpecialtyId = specialties[0]?._id || '';
  if (mode === 'edit' && initialUser) {
    return {
      fullName: initialUser.fullName || '',
      email: initialUser.email || '',
      password: '',
      phone: initialUser.phone || '',
      role: initialUser.role || 'patient',
      specialtyId: initialUser.doctorProfile?.specialtyId || defaultSpecialtyId,
      consultationFee:
        initialUser.doctorProfile?.consultationFee !== undefined
          ? String(initialUser.doctorProfile.consultationFee)
          : '300000'
    };
  }

  return {
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: initialRole || 'doctor',
    specialtyId: defaultSpecialtyId,
    consultationFee: '300000'
  };
};

const UserFormModal = ({
  isOpen,
  mode,
  initialUser,
  initialRole,
  specialties,
  currentUserId,
  submitting,
  serverError,
  onClose,
  onSubmit
}) => {
  const [form, setForm] = useState(() =>
    buildInitialForm({ mode, initialUser, initialRole, specialties })
  );
  const [fieldErrors, setFieldErrors] = useState({});

  const isEdit = mode === 'edit';
  const isSelf = isEdit && String(initialUser?._id) === String(currentUserId);

  useEffect(() => {
    if (!isOpen) return;
    setForm(buildInitialForm({ mode, initialUser, initialRole, specialties }));
    setFieldErrors({});
  }, [isOpen, mode, initialUser, initialRole]);

  useEffect(() => {
    if (!isOpen || form.role !== 'doctor' || form.specialtyId || specialties.length === 0) return;
    setForm((current) => ({ ...current, specialtyId: specialties[0]._id }));
  }, [isOpen, form.role, form.specialtyId, specialties]);

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => (current[field] ? { ...current, [field]: '' } : current));
  };

  const validate = () => {
    const errors = {};
    const trimmedName = form.fullName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.fullName = 'Họ và tên phải có từ 2 đến 100 ký tự.';
    }

    if (!isEdit) {
      if (!EMAIL_REGEX.test(form.email.trim())) {
        errors.email = 'Email không đúng định dạng.';
      }
      if (form.password.length < 6 || form.password.length > 72) {
        errors.password = 'Mật khẩu khởi tạo phải từ 6 đến 72 ký tự.';
      }
    }

    const trimmedPhone = form.phone.trim();
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      errors.phone = 'Số điện thoại phải gồm 10 chữ số hợp lệ (đầu số 03, 05, 07, 08, 09).';
    }

    if (form.role === 'doctor') {
      if (!form.specialtyId) {
        errors.specialtyId = 'Vui lòng chọn chuyên khoa cho bác sĩ.';
      }
      const trimmedFee = String(form.consultationFee).trim();
      const parsedFee = trimmedFee === '' ? Number.NaN : Number(trimmedFee);
      if (!Number.isFinite(parsedFee) || parsedFee < 0) {
        errors.consultationFee = 'Giá khám phải là số không âm hợp lệ.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      role: form.role
    };

    if (!isEdit) {
      payload.email = form.email.trim().toLowerCase();
      payload.password = form.password;
    }

    if (form.role === 'doctor') {
      payload.specialtyId = form.specialtyId;
      payload.consultationFee = Number(form.consultationFee);
    }

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title={isEdit ? 'Cập nhật thông tin tài khoản' : 'Cấp tài khoản mới'}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Input
          id="admin-user-fullName"
          label="Họ và tên"
          value={form.fullName}
          onChange={handleFieldChange('fullName')}
          placeholder="VD: BS. Nguyễn Văn An"
          error={fieldErrors.fullName}
          required
        />

        <Input
          id="admin-user-email"
          type="email"
          label="Email đăng nhập"
          value={form.email}
          onChange={handleFieldChange('email')}
          placeholder="VD: bacsi.an@medcare.vn"
          disabled={isEdit}
          helperText={isEdit ? 'Email định danh tài khoản không thể chỉnh sửa.' : undefined}
          error={fieldErrors.email}
          required
        />

        {!isEdit && (
          <Input
            id="admin-user-password"
            type="password"
            label="Mật khẩu khởi tạo"
            value={form.password}
            onChange={handleFieldChange('password')}
            placeholder="Nhập tối thiểu 6 ký tự"
            helperText="Người dùng có thể sử dụng mật khẩu này để đăng nhập ngay."
            error={fieldErrors.password}
            required
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="admin-user-phone"
            type="tel"
            label="Số điện thoại"
            value={form.phone}
            onChange={handleFieldChange('phone')}
            placeholder="VD: 0912345678"
            error={fieldErrors.phone}
          />

          <div className="w-full space-y-1">
            <label htmlFor="admin-user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Vai trò hệ thống <span className="text-red-500">*</span>
            </label>
            <select
              id="admin-user-role"
              value={form.role}
              disabled={isSelf}
              onChange={handleFieldChange('role')}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
            >
              <option value="doctor">Bác sĩ</option>
              <option value="pharmacist">Dược sĩ</option>
              <option value="admin">Quản trị viên</option>
              <option value="patient">Bệnh nhân</option>
            </select>
            {isSelf && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bạn không thể tự thay đổi vai trò của chính mình.
              </p>
            )}
          </div>
        </div>

        {form.role === 'doctor' && (
          <div className="rounded-xl border border-sky-200 dark:border-sky-900/70 bg-sky-50/70 dark:bg-sky-950/20 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-900 dark:text-sky-200">
              <Stethoscope className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Thông tin hồ sơ Bác sĩ (Đồng bộ đặt lịch &amp; Chatbot)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="w-full space-y-1">
                <label htmlFor="admin-doctor-specialty" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Chuyên khoa <span className="text-red-500">*</span>
                </label>
                <select
                  id="admin-doctor-specialty"
                  value={form.specialtyId}
                  onChange={handleFieldChange('specialtyId')}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 ${
                    fieldErrors.specialtyId
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-primary-500'
                  }`}
                >
                  {specialties.length === 0 ? (
                    <option value="">Chưa có chuyên khoa khả dụng</option>
                  ) : (
                    specialties.map((spec) => (
                      <option key={spec._id} value={spec._id}>
                        {spec.name}
                      </option>
                    ))
                  )}
                </select>
                {fieldErrors.specialtyId && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.specialtyId}</p>
                )}
              </div>

              <Input
                id="admin-doctor-fee"
                type="number"
                min="0"
                step="10000"
                label="Giá khám (VNĐ)"
                value={form.consultationFee}
                onChange={handleFieldChange('consultationFee')}
                error={fieldErrors.consultationFee}
                required
              />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              {isEdit && initialUser?.doctorProfile
                ? 'Học vị, bệnh viện và lịch làm việc hiện tại của bác sĩ sẽ được giữ nguyên.'
                : 'Học vị, bệnh viện và lịch làm việc chuẩn (Thứ 2 – Thứ 7) sẽ được khởi tạo mặc định để Đặt lịch và Chatbot nhận diện bác sĩ ngay.'}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {isEdit ? 'Lưu thay đổi' : 'Cấp tài khoản'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
