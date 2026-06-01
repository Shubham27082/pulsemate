import api from './axios';

export const sendOtp    = (mobile, purpose = 'LOGIN') => api.post('/auth/send-otp', { mobile, purpose });
export const verifyOtp  = (mobile, otp, purpose = 'LOGIN', name) => api.post('/auth/verify-otp', { mobile, otp, purpose, name });
export const loginPass  = (mobile, password) => api.post('/auth/login-password', { mobile, password });
export const getMe      = () => api.get('/auth/me');
export const logout     = () => api.post('/auth/logout');
export const getMyNotifications = () => api.get('/notifications/my');
