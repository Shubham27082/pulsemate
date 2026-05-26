import api from './axios';

export const createPrescription = (data) =>
  api.post('/prescriptions', data);

export const updatePrescription = (id, data) =>
  api.patch(`/prescriptions/${id}`, data);

export const getPrescription = (id) =>
  api.get(`/prescriptions/${id}`);

export const getPrescriptionByAppointment = (appointmentId) =>
  api.get(`/prescriptions/appointment/${appointmentId}`);

export const getMyPrescriptions = (params) =>
  api.get('/prescriptions/my', { params });
