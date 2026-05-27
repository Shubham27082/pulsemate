import api from './axios';
import { PORTAL_CONFIG, ROLE_TO_PORTAL, getPortalFromPath } from '../utils/authScope';

const getPortal = (explicitPortal) => explicitPortal || getPortalFromPath();

export const sendOtp = (mobile, purpose = 'LOGIN') =>
  api.post('/auth/patient/send-otp', { mobile, purpose });

export const verifyOtp = (mobile, otp, purpose = 'LOGIN', name = undefined) =>
  api.post('/auth/patient/verify-otp', { mobile, otp, purpose, name });

export const registerClinicOwner = (data) =>
  api.post('/auth/clinic-owner/register', data);

export const registerDoctor = (data) =>
  api.post('/auth/doctor/register', data);

export const loginWithPassword = (credentials, portal = getPortal()) =>
  api.post(`${PORTAL_CONFIG[portal].loginPath}/login`, credentials, {
    headers: { 'X-Auth-Portal': portal },
  });

export const refreshToken = (portal = getPortal()) =>
  api.post(`${PORTAL_CONFIG[portal].loginPath}/refresh-token`, {}, {
    headers: { 'X-Auth-Portal': portal },
  });

export const logout = (portal = getPortal()) =>
  api.post(`${PORTAL_CONFIG[portal].loginPath}/logout`, {}, {
    headers: { 'X-Auth-Portal': portal },
  });

export const getMe = (portal = getPortal()) =>
  api.get('/auth/me', { headers: { 'X-Auth-Portal': portal } });

export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const getPortalForRole = (role) => ROLE_TO_PORTAL[role] || 'patient';
