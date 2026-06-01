import api from './axios';

export const sendOtp = (phone) => api.post('/auth/patient/send-otp', { phone });

export const verifyOtp = (phone, otp, name = undefined) =>
  api.post('/auth/patient/verify-otp', { phone, otp, name });

export const sendClinicOwnerOtp = (phone) => api.post('/auth/clinic-owner/send-otp', { phone });

export const verifyClinicOwnerOtp = (phone, otp) => api.post('/auth/clinic-owner/verify-otp', { phone, otp });

export const sendClinicOwnerEmailVerification = (email, ownerName) =>
  api.post('/auth/clinic-owner/send-email-otp', { email, ownerName });

export const verifyClinicOwnerEmailOtp = (email, otp) =>
  api.post('/auth/clinic-owner/verify-email-otp', { email, otp });

export const uploadClinicOwnerDocument = (file, field) => {
  const formData = new FormData();
  formData.append('file', file);
  if (field) {
    formData.append('field', field);
  }

  return api.post('/auth/clinic-owner/upload-document', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const registerClinicOwner = (data) => api.post('/auth/clinic-owner/register', data);

export const registerDoctor = (data) => api.post('/auth/doctor/register', data);

export const loginWithPassword = (credentials) => api.post('/auth/login', credentials);

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const verifyResetToken = (token) => api.get('/auth/verify-reset-token', { params: { token } });

export const refreshToken = () => api.post('/auth/refresh');

export const logout = () => api.post('/auth/logout');

export const logoutAll = () => api.post('/auth/logout-all');

export const getMe = () => api.get('/auth/me');
