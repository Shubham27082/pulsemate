import api from './axios';

export const registerFcmToken = (token, platform = 'web') =>
  api.post('/notifications/fcm-token', { token, platform });

export const removeFcmToken = (token) =>
  api.delete('/notifications/fcm-token', { data: { token } });
