import api from './axios';

export const createClinic = (data) =>
  api.post('/clinics', data);

export const getMyClinics = () =>
  api.get('/clinics/my');

export const getClinic = (id) =>
  api.get(`/clinics/${id}`);

export const updateClinic = (id, data) =>
  api.patch(`/clinics/${id}`, data);

export const addStaff = (clinicId, data) =>
  api.post(`/clinics/${clinicId}/staff`, data);

export const getStaff = (clinicId) =>
  api.get(`/clinics/${clinicId}/staff`);

export const updateStaffStatus = (clinicId, staffId, isActive) =>
  api.patch(`/clinics/${clinicId}/staff/${staffId}/status`, { isActive });

export const getClinicAppointments = (clinicId, params) =>
  api.get(`/clinics/${clinicId}/appointments`, { params });

export const getClinicRevenue = (clinicId, period = 'today') =>
  api.get(`/clinics/${clinicId}/revenue`, { params: { period } });
