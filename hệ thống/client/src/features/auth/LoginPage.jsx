import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Stethoscope, Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axiosClient.post('/auth/login', { email, password });
      if (res.success) {
        login(res.user, res.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Đăng Nhập MedCare</h1>
        <p className="text-xs text-slate-500">Nhập email và mật khẩu để truy cập tài khoản</p>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="benhnhan@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Mật khẩu"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="primary" loading={loading} className="w-full mt-2">
          Đăng Nhập
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-center text-xs text-slate-500">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
