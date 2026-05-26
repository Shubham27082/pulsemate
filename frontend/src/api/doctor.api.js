import api from './axios';

export const getTodayAppointments = () =>
  api.get('/doctor/today');

export const getDoctorAppointments = (params) =>
  api.get('/doctor/appointments', { params });

export const startConsultation = (id) =>
  api.patch(`/doctor/appointments/${id}/start`);

export const completeConsultation = (id, notes) =>
  api.patch(`/doctor/appointments/${id}/complete`, { notes });

export const updateAvailability = (data) =>
  api.patch('/doctor/availability', data);

export const getDoctorProfile = () =>
  api.get('/doctor/profile');

export const updateDoctorProfile = (data) =>
  api.patch('/doctor/profile', data);
