import api from './axios';

export const getMarketplaceDoctors = (params) =>
  api.get('/marketplace/doctors', { params });

export const inviteDoctorToClinic = (doctorId, data) =>
  api.post(`/marketplace/doctors/${doctorId}/invite`, data);

export const getMyDoctorInvitations = () =>
  api.get('/marketplace/invitations/my');

export const respondToDoctorInvitation = (inviteId, action) =>
  api.post(`/marketplace/invitations/${inviteId}/respond`, { action });
