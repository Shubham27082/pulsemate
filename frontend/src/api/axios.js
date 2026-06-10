import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const shouldSkipRefresh = (url = '') =>
  [
    '/auth/login',
    '/auth/login-password',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-reset-token',
    '/auth/patient/send-otp',
    '/auth/patient/verify-otp',
    '/auth/clinic-owner/send-otp',
    '/auth/clinic-owner/verify-otp',
    '/auth/clinic-owner/send-email-otp',
    '/auth/clinic-owner/verify-email-otp',
    '/auth/clinic-owner/send-email-verification',
    '/auth/clinic-owner/upload-document',
    '/auth/clinic-owner/register',
    '/auth/doctor/register',
    '/user-auth/send-otp',
    '/user-auth/verify-otp',
    '/device-token/deactivate',
  ].some((path) => url.includes(path));

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !shouldSkipRefresh(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const response = await refreshPromise;
        refreshPromise = null;

        const { accessToken, user } = response.data.data;
        useAuthStore.getState().setAuth(user, accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
