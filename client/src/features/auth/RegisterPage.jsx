import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Stethoscope } from 'lucide-react';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/auth/register', {
        fullName,
        email,
        password,
        phone,
        role
      });
      if (res.success) {
        login(res.user, res.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Đăng Ký Tài Khoản</h1>
        <p className="text-xs text-slate-500">Tạo tài khoản để đặt lịch và lưu bệnh án trực tuyến</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="nguyenvana@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Số điện thoại"
          type="tel"
          placeholder="0912345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Input
          label="Mật khẩu (ít nhất 6 ký tự)"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Vai trò đăng ký
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            <option value="patient">Bệnh nhân (Patient)</option>
            <option value="doctor">Bác sĩ (Doctor)</option>
            <option value="pharmacist">Dược sĩ / Thu ngân (Pharmacist)</option>
          </select>
        </div>
        <Button type="submit" variant="primary" loading={loading} className="w-full mt-3">
          Tạo Tài Khoản
        </Button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-500">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:underline">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
