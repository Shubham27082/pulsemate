
import api from './axios';

export const registerFcmToken = (token, platform = 'web') =>
  api.post('/notifications/fcm-token', { token, platform });

export const removeFcmToken = (token) =>
  api.delete('/notifications/fcm-token', { data: { token } });

export const getMyNotifications = () =>
  api.get('/notifications/my');

export const markNotificationRead = (notificationId) =>
  api.patch(`/notifications/${notificationId}/read`);

export const markAllNotificationsRead = () =>
  api.patch('/notifications/read-all');

// ── Campaign inbox (admin-sent user notifications) ────────────────────────────
export const getInboxNotifications = (params) =>
  api.get('/notifications/inbox', { params });

export const markInboxNotificationRead = (id) =>
  api.patch(`/notifications/inbox/${id}/read`);

export const markAllInboxNotificationsRead = () =>
  api.patch('/notifications/inbox/read-all');
