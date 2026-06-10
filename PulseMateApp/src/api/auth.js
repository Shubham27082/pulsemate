import api from './axios';

export const sendOtp = (mobile, purpose = 'LOGIN') => api.post('/auth/send-otp', { mobile, purpose });
export const verifyOtp = (mobile, otp, purpose = 'LOGIN', name) => api.post('/auth/verify-otp', { mobile, otp, purpose, name });
export const loginPass = (mobile, password) => api.post('/auth/login-password', { mobile, password });
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const getMyNotifications = () => api.get('/notifications/my');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const registerFcmToken = (token, platform = 'android') => api.post('/notifications/fcm-token', { token, platform });
export const removeFcmToken = (token) => api.delete('/notifications/fcm-token', { data: { token } });

// ── Admin campaign inbox (in-app notifications sent by admin) ─────────────────
export const getInboxNotifications = (params) => api.get('/notifications/inbox', { params });
export const markInboxRead = (id) => api.patch(`/notifications/inbox/${id}/read`);
export const markAllInboxRead = () => api.patch('/notifications/inbox/read-all');
export const registerDeviceToken = (fcmToken, platform = 'ANDROID') =>
  api.post('/device-token/register', { fcmToken, platform });
export const deactivateDeviceToken = (fcmToken) =>
  api.post('/device-token/deactivate', { fcmToken });
