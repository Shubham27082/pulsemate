const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '5d';
const REFRESH_EXPIRY_MS = 5 * 24 * 60 * 60 * 1000;

const AUTH_SCOPES = {
  PATIENT: {
    role: 'PATIENT',
    slug: 'patient',
    cookieName: 'pm_rt_patient',
    cookiePath: '/api/auth/patient',
    allowedRoles: ['PATIENT'],
  },
  CLINIC_OWNER: {
    role: 'CLINIC_OWNER',
    slug: 'clinic-owner',
    cookieName: 'pm_rt_clinic_owner',
    cookiePath: '/api/auth/clinic-owner',
    allowedRoles: ['CLINIC_OWNER'],
  },
  DOCTOR: {
    role: 'DOCTOR',
    slug: 'doctor',
    cookieName: 'pm_rt_doctor',
    cookiePath: '/api/auth/doctor',
    allowedRoles: ['DOCTOR'],
  },
  RECEPTIONIST: {
    role: 'RECEPTIONIST',
    slug: 'receptionist',
    cookieName: 'pm_rt_receptionist',
    cookiePath: '/api/auth/receptionist',
    allowedRoles: ['RECEPTIONIST'],
  },
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    slug: 'admin',
    cookieName: 'pm_rt_admin',
    cookiePath: '/api/auth/admin',
    allowedRoles: ['SUPER_ADMIN'],
  },
};

const AUTH_SCOPE_BY_SLUG = Object.fromEntries(
  Object.entries(AUTH_SCOPES).map(([role, config]) => [config.slug, { role, ...config }])
);

const defaultCookieOptions = (scope) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: REFRESH_EXPIRY_MS,
  path: scope.cookiePath,
});

module.exports = {
  ACCESS_EXPIRY,
  REFRESH_EXPIRY,
  REFRESH_EXPIRY_MS,
  AUTH_SCOPES,
  AUTH_SCOPE_BY_SLUG,
  defaultCookieOptions,
};
