import React from 'react';
import { Lock, Pencil, Unlock } from 'lucide-react';
import Button from '../../../components/common/Button';

const ROLE_META = {
  doctor: {
    label: 'Bác sĩ',
    className: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
  },
  pharmacist: {
    label: 'Dược sĩ',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
  },
  admin: {
    label: 'Quản trị viên',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
  },
  patient: {
    label: 'Bệnh nhân',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  }
};

const formatDateVi = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};

const renderWorkInfo = (item) => {
  if (item.role === 'doctor') {
    const specialtyName = item.doctorProfile?.specialtyName || 'Chưa gán chuyên khoa';
    const fee = Number(item.doctorProfile?.consultationFee ?? 0).toLocaleString('vi-VN');
    return (
      <div>
        <p className="font-medium text-slate-700 dark:text-slate-200">{specialtyName}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Giá khám: {fee} đ</p>
      </div>
    );
  }
  if (item.role === 'pharmacist') {
    return <span className="text-slate-600 dark:text-slate-300">Kho Dược &amp; Cấp phát</span>;
  }
  return <span className="text-slate-600 dark:text-slate-300">Quản trị hệ thống</span>;
};

const AccountTable = ({ users, scope, currentUserId, onEdit, onToggleStatus }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <tr>
            <th className="py-3.5 px-4">{scope === 'staff' ? 'Nhân sự' : 'Bệnh nhân'}</th>
            <th className="py-3.5 px-4">Số điện thoại</th>
            {scope === 'staff' ? (
              <>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Chuyên khoa &amp; Giá khám</th>
              </>
            ) : (
              <th className="py-3.5 px-4">Ngày đăng ký</th>
            )}
            <th className="py-3.5 px-4">Trạng thái</th>
            <th className="py-3.5 px-4 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
          {users.map((item) => {
            const roleInfo = ROLE_META[item.role] || ROLE_META.patient;
            const isSelf = String(item._id) === String(currentUserId);
            const isActive = item.isActive !== false;

            return (
              <tr key={item._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <img
                      src={item.avatar}
                      alt={item.fullName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-600 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {item.fullName}
                        </span>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                            Bạn
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                  {item.phone || <span className="text-slate-400 italic">Chưa cập nhật</span>}
                </td>
                {scope === 'staff' ? (
                  <>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${roleInfo.className}`}>
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[180px]">{renderWorkInfo(item)}</td>
                  </>
                ) : (
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {formatDateVi(item.createdAt)}
                  </td>
                )}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                    }`}
                  >
                    {isActive ? 'Đang hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                      className="gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Sửa
                    </Button>
                    <Button
                      variant={isActive ? 'danger' : 'secondary'}
                      size="sm"
                      disabled={isSelf && isActive}
                      title={isSelf && isActive ? 'Không thể tự khóa tài khoản của chính mình' : undefined}
                      onClick={() => onToggleStatus(item)}
                      className="gap-1.5"
                    >
                      {isActive ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Khóa
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Mở khóa
                        </>
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default AccountTable;
