import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  X
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Loader from '../../../components/common/Loader';
import { useAuth } from '../../../context/AuthContext';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  createAdminUser,
  fetchAdminUsers,
  fetchSpecialties,
  updateAdminUser,
  updateAdminUserStatus
} from '../adminApi';
import AccountTable from './AccountTable';
import ConfirmStatusModal from './ConfirmStatusModal';
import StaffScheduleModal from './StaffScheduleModal';
import StatsCard from './StatsCard';
import UserFormModal from './UserFormModal';

const PAGE_LIMIT = 8;

const UserManagementTab = ({ onDataChanged }) => {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?._id || currentUser?.id || '';

  const [scope, setScope] = useState('staff');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState({ staffTotal: 0, patientTotal: 0, lockedTotal: 0, byRole: {} });
  const [specialties, setSpecialties] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [formModal, setFormModal] = useState({ open: false, mode: 'create', user: null });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [statusModal, setStatusModal] = useState({ open: false, user: null });
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState('');

  const [scheduleModal, setScheduleModal] = useState({ open: false, user: null });

  useEffect(() => {
    const controller = new AbortController();
    const loadSpecialties = async () => {
      try {
        const res = await fetchSpecialties(controller.signal);
        if (controller.signal.aborted) return;
        const list = Array.isArray(res?.data) ? res.data : [];
        setSpecialties(list);
      } catch {
        if (controller.signal.aborted) return;
        setSpecialties([]);
      }
    };

    loadSpecialties();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const loadUsers = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          scope,
          role: scope === 'staff' ? roleFilter : 'all',
          status: statusFilter,
          page,
          limit: PAGE_LIMIT
        };
        if (debouncedSearch.trim()) {
          params.search = debouncedSearch.trim();
        }

        const res = await fetchAdminUsers(params, controller.signal);
        if (controller.signal.aborted) return;

        const data = res?.data || {};
        setUsers(Array.isArray(data.users) ? data.users : []);
        setPagination(
          data.pagination || { page: 1, limit: PAGE_LIMIT, total: 0, totalPages: 1 }
        );
        setSummary(
          data.summary || { staffTotal: 0, patientTotal: 0, lockedTotal: 0, byRole: {} }
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err.message || 'Không thể tải danh sách tài khoản.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadUsers();
    return () => controller.abort();
  }, [scope, roleFilter, statusFilter, debouncedSearch, page, reloadKey]);

  const summaryHelperText = useMemo(() => {
    const byRole = summary.byRole || {};
    return `${byRole.doctor || 0} BS · ${byRole.pharmacist || 0} DS · ${byRole.admin || 0} Admin`;
  }, [summary.byRole]);

  const handleScopeChange = useCallback((nextScope) => {
    setScope(nextScope);
    setRoleFilter('all');
    setStatusFilter('all');
    setPage(1);
  }, []);

  const handleRoleFilterChange = (nextRole) => {
    setRoleFilter(nextRole);
    setPage(1);
  };

  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
    setPage(1);
  };

  const openCreateModal = () => {
    setFormError('');
    setFormModal({ open: true, mode: 'create', user: null });
  };

  const openEditModal = (targetUser) => {
    setFormError('');
    setFormModal({ open: true, mode: 'edit', user: targetUser });
  };

  const openStatusModal = (targetUser) => {
    setStatusError('');
    setStatusModal({ open: true, user: targetUser });
  };

  const handleFormSubmit = async (payload) => {
    setFormSubmitting(true);
    setFormError('');
    try {
      const response = formModal.mode === 'edit'
        ? await updateAdminUser(formModal.user._id, payload)
        : await createAdminUser(payload);

      const targetScope = payload.role === 'patient' ? 'patient' : 'staff';
      setFormModal({ open: false, mode: 'create', user: null });
      setFeedback(response?.message || 'Lưu tài khoản thành công!');
      if (targetScope !== scope) {
        setScope(targetScope);
        setRoleFilter('all');
        setStatusFilter('all');
      }
      setPage(1);
      setReloadKey((current) => current + 1);
      onDataChanged?.();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu thông tin tài khoản.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleConfirmStatus = async (targetUser, nextActive) => {
    setStatusSubmitting(true);
    setStatusError('');
    try {
      const response = await updateAdminUserStatus(targetUser._id, nextActive);
      setStatusModal({ open: false, user: null });
      setFeedback(
        response?.message || (nextActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
      );
      setReloadKey((current) => current + 1);
      onDataChanged?.();
    } catch (err) {
      setStatusError(err.message || 'Không thể cập nhật trạng thái tài khoản.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          label="Nhân sự nội bộ"
          value={`${summary.staffTotal} tài khoản`}
          helper={summaryHelperText}
          icon={UserCheck}
          tone="primary"
        />
        <StatsCard
          label="Tài khoản Bệnh nhân"
          value={`${summary.patientTotal} tài khoản`}
          helper="Người bệnh đăng ký khám"
          icon={Users}
          tone="sky"
        />
        <StatsCard
          label="Tài khoản đã khóa"
          value={`${summary.lockedTotal} tài khoản`}
          helper="Đang bị tạm ngưng truy cập"
          icon={Lock}
          tone="purple"
        />
      </div>

      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 self-start">
            <button
              type="button"
              onClick={() => handleScopeChange('staff')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                scope === 'staff'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Nhân sự nội bộ ({summary.staffTotal})
            </button>
            <button
              type="button"
              onClick={() => handleScopeChange('patient')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                scope === 'patient'
                  ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tài khoản Bệnh nhân ({summary.patientTotal})
            </button>
          </div>

          <Button type="button" variant="primary" onClick={openCreateModal} className="gap-1.5 self-start md:self-auto">
            <Plus className="w-4 h-4" />
            {scope === 'staff' ? 'Cấp tài khoản nhân sự' : 'Tạo tài khoản bệnh nhân'}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
              aria-label="Tìm kiếm tài khoản"
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {scope === 'staff' && (
            <select
              value={roleFilter}
              onChange={(event) => handleRoleFilterChange(event.target.value)}
              aria-label="Lọc theo vai trò"
              className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="doctor">Bác sĩ</option>
              <option value="pharmacist">Dược sĩ</option>
              <option value="admin">Quản trị viên</option>
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(event) => handleStatusFilterChange(event.target.value)}
            aria-label="Lọc theo trạng thái"
            className="px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
        </div>
      </section>

      {feedback && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback('')}
            aria-label="Đóng thông báo"
            className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && <Loader text="Đang tải danh sách tài khoản..." />}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-6 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <h2 className="mt-3 font-bold text-red-800 dark:text-red-200">Không thể tải danh sách tài khoản</h2>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Thử lại
          </Button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-10 text-center">
          <Users className="w-10 h-10 mx-auto text-slate-400" />
          <h2 className="mt-3 font-bold text-slate-700 dark:text-slate-200">Không tìm thấy tài khoản phù hợp</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Hãy thay đổi từ khóa tìm kiếm, bộ lọc hoặc tạo mới tài khoản.
          </p>
        </div>
      )}

      {!loading && !error && users.length > 0 && (
        <>
          <AccountTable
            users={users}
            scope={scope}
            currentUserId={currentUserId}
            onEdit={openEditModal}
            onToggleStatus={openStatusModal}
            onViewSchedule={(targetUser) => setScheduleModal({ open: true, user: targetUser })}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Hiển thị {users.length} / {pagination.total} tài khoản · Trang {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                className="gap-1"
              >
                Sau <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <UserFormModal
        isOpen={formModal.open}
        mode={formModal.mode}
        initialUser={formModal.user}
        initialRole={scope === 'patient' ? 'patient' : 'doctor'}
        specialties={specialties}
        currentUserId={currentUserId}
        submitting={formSubmitting}
        serverError={formError}
        onClose={() => setFormModal({ open: false, mode: 'create', user: null })}
        onSubmit={handleFormSubmit}
      />

      <ConfirmStatusModal
        isOpen={statusModal.open}
        user={statusModal.user}
        submitting={statusSubmitting}
        serverError={statusError}
        onClose={() => setStatusModal({ open: false, user: null })}
        onConfirm={handleConfirmStatus}
      />

      <StaffScheduleModal
        isOpen={scheduleModal.open}
        user={scheduleModal.user}
        onClose={() => setScheduleModal({ open: false, user: null })}
      />
    </div>
  );
};

export default UserManagementTab;
