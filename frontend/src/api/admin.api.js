import api from './axios';

export const getAdminDashboard = () =>
  api.get('/admin/dashboard');

export const getAdminClinics = (params) =>
  api.get('/admin/clinics', { params });

export const approveClinic = (id, approved) =>
  api.patch(`/admin/clinics/${id}/approve`, { approved });

export const getAdminUsers = (params) =>
  api.get('/admin/users', { params });

export const updateUserStatus = (id, isActive) =>
  api.patch(`/admin/users/${id}/status`, { isActive });

export const createStaffUser = (data) =>
  api.post('/admin/users', data);
