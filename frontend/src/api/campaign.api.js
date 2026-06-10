import api from './axios';

// ── Admin Campaign APIs ───────────────────────────────────────────────────────

export const getCampaigns = (params) =>
  api.get('/admin/notifications', { params });

export const getCampaignById = (id) =>
  api.get(`/admin/notifications/${id}`);

export const createCampaign = (data) =>
  api.post('/admin/notifications', data);

export const sendCampaignNow = (id) =>
  api.post(`/admin/notifications/${id}/send`);

export const pauseCampaign = (id) =>
  api.patch(`/admin/notifications/${id}/pause`);

export const resumeCampaign = (id) =>
  api.patch(`/admin/notifications/${id}/resume`);

export const stopCampaign = (id) =>
  api.patch(`/admin/notifications/${id}/stop`);

export const deleteCampaign = (id) =>
  api.delete(`/admin/notifications/${id}`);

// ── User in-app notifications (campaign inbox) ────────────────────────────────

export const getUserInboxNotifications = (params) =>
  api.get('/notifications/inbox', { params });

export const markInboxNotificationRead = (id) =>
  api.patch(`/notifications/inbox/${id}/read`);

export const markAllInboxNotificationsRead = () =>
  api.patch('/notifications/inbox/read-all');
