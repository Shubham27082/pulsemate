import api from './axios';

export const getAdminDashboard = () =>
  api.get('/admin/dashboard');

export const getAdminClinics = (params) =>
  api.get('/admin/clinics', { params });

export const approveClinic = (id, approved) =>
  api.patch(`/admin/clinics/${id}/approve`, { approved });

export const getPendingClinicApprovals = () =>
  api.get('/approvals/clinics/pending');

export const getPendingDoctorApprovals = () =>
  api.get('/approvals/doctors/pending');

export const decideClinicApproval = (clinicId, data) =>
  api.patch(`/approvals/clinics/${clinicId}`, data);

export const decideDoctorApproval = (doctorUserId, data) =>
  api.patch(`/approvals/doctors/${doctorUserId}`, data);

export const getAdminUsers = (params) =>
  api.get('/admin/users', { params });

export const updateUserStatus = (id, isActive) =>
  api.patch(`/admin/users/${id}/status`, { isActive });

export const createAdminUser = (data) =>
  api.post('/admin/admins', data);

export const deleteAdminUser = (id) =>
  api.delete(`/admin/admins/${id}`);

export const resetDatabase = () =>
  api.post('/admin/reset-database');
