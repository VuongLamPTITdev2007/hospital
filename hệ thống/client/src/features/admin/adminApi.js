import axiosClient from '../../api/axiosClient';

export const fetchAdminUsers = (params, signal) =>
  axiosClient.get('/admin/users', { params, signal });

export const createAdminUser = (payload) =>
  axiosClient.post('/admin/users', payload);

export const updateAdminUser = (id, payload) =>
  axiosClient.put(`/admin/users/${id}`, payload);

export const updateAdminUserStatus = (id, isActive) =>
  axiosClient.patch(`/admin/users/${id}/status`, { isActive });

export const fetchAdminUserSchedule = (id, date, signal) =>
  axiosClient.get(`/admin/users/${id}/schedule`, {
    params: date ? { date } : {},
    signal
  });

export const fetchSpecialties = (signal) =>
  axiosClient.get('/specialties', { signal });
