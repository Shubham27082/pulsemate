import api from './axios';

export const sendOtp = (mobile, purpose = 'LOGIN') =>
  api.post('/auth/send-otp', { mobile, purpose });

export const verifyOtp = (mobile, otp, purpose = 'LOGIN', name = undefined) =>
  api.post('/auth/verify-otp', { mobile, otp, purpose, name });

export const loginWithPassword = (credentials) =>
  api.post('/auth/login-password', credentials);

export const refreshToken = () =>
  api.post('/auth/refresh');

export const logout = () =>
  api.post('/auth/logout');

export const getMe = () =>
  api.get('/auth/me');
