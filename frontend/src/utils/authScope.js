export const PORTAL_CONFIG = {
  patient: {
    loginPath: '/auth/patient',
    home: '/patient',
    roles: ['PATIENT'],
  },
  doctor: {
    loginPath: '/auth/doctor',
    home: '/doctor',
    roles: ['DOCTOR'],
  },
  receptionist: {
    loginPath: '/auth/receptionist',
    home: '/reception',
    roles: ['RECEPTIONIST'],
  },
  'clinic-owner': {
    loginPath: '/auth/clinic-owner',
    home: '/owner',
    roles: ['CLINIC_OWNER'],
  },
  admin: {
    loginPath: '/auth/admin',
    home: '/admin',
    roles: ['SUPER_ADMIN'],
  },
};

export const ROLE_TO_PORTAL = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  CLINIC_OWNER: 'clinic-owner',
  SUPER_ADMIN: 'admin',
};

export const getPortalFromPath = (pathname = window.location.pathname) => {
  if (pathname.startsWith('/doctor')) return 'doctor';
  if (pathname.startsWith('/reception')) return 'receptionist';
  if (pathname.startsWith('/owner')) return 'clinic-owner';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/login/doctor')) return 'doctor';
  if (pathname.startsWith('/login/receptionist')) return 'receptionist';
  if (pathname.startsWith('/login/clinic')) return 'clinic-owner';
  if (pathname.startsWith('/login/admin')) return 'admin';
  return 'patient';
};

export const getStorageKey = (portal) => `pulsemate-auth:${portal}`;

export const readPortalSession = (portal) => {
  try {
    const raw = localStorage.getItem(getStorageKey(portal));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writePortalSession = (portal, payload) => {
  localStorage.setItem(getStorageKey(portal), JSON.stringify(payload));
};

export const clearPortalSession = (portal) => {
  localStorage.removeItem(getStorageKey(portal));
};
