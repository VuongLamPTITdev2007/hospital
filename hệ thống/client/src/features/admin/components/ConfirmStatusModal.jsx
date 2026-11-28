import React from 'react';
import { AlertCircle, Lock, Unlock } from 'lucide-react';
import Button from '../../../components/common/Button';
import Modal from '../../../components/common/Modal';

const ConfirmStatusModal = ({
  isOpen,
  user,
  submitting,
  serverError,
  onClose,
  onConfirm
}) => {
  if (!user) return null;

  const isCurrentlyActive = user.isActive !== false;
  const nextActive = !isCurrentlyActive;

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title={isCurrentlyActive ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isCurrentlyActive
                ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            {isCurrentlyActive ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </div>
          <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
            {isCurrentlyActive ? (
              <>
                <p>
                  Tài khoản <strong className="text-slate-800 dark:text-slate-100">{user.fullName}</strong> ({user.email}) sẽ bị đăng xuất ngay lập tức và không thể đăng nhập cho đến khi được mở khóa.
                </p>
                {user.role === 'doctor' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bác sĩ cũng sẽ được ẩn khỏi danh sách Đặt lịch mới và Chatbot, đồng thời giữ nguyên toàn bộ lịch hẹn và bệnh án cũ.
                  </p>
                )}
              </>
            ) : (
              <p>
                Tài khoản <strong className="text-slate-800 dark:text-slate-100">{user.fullName}</strong> ({user.email}) sẽ được khôi phục quyền truy cập vào hệ thống theo vai trò hiện tại.
              </p>
            )}
          </div>
        </div>

        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            type="button"
            variant={isCurrentlyActive ? 'danger' : 'primary'}
            loading={submitting}
            onClick={() => onConfirm(user, nextActive)}
          >
            {isCurrentlyActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmStatusModal;
