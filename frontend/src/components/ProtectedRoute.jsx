import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export const ROLE_HOME = {
  PATIENT: '/patient/home',
  CLINIC_OWNER: '/clinic/dashboard',
  DOCTOR: '/doctor/dashboard',
  RECEPTIONIST: '/receptionist/dashboard',
  SUPER_ADMIN: '/admin/dashboard',
};

const getLoginRoute = (pathname) => {
  if (pathname.startsWith('/patient')) return '/login';
  if (pathname.startsWith('/register')) return '/portal';
  if (pathname.startsWith('/clinic')) return '/portal';
  if (pathname.startsWith('/doctor')) return '/portal';
  if (pathname.startsWith('/owner')) return '/portal';
  if (pathname.startsWith('/reception')) return '/portal';
  if (pathname.startsWith('/receptionist')) return '/portal';
  if (pathname.startsWith('/admin')) return '/admin';
  return '/login';
};

const canAccessPendingRoute = (pathname, role) => {
  const allowedHome = ROLE_HOME[role];
  return pathname === '/verification-pending' || pathname === allowedHome;
};

const ProtectedRoute = ({ children, roles, adminLevels }) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={getLoginRoute(location.pathname)} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }

  if (
    user.role === 'SUPER_ADMIN' &&
    Array.isArray(adminLevels) &&
    adminLevels.length > 0 &&
    !adminLevels.includes(user.adminLevel)
  ) {
    return <Navigate to={ROLE_HOME[user.role] || '/admin/dashboard'} replace />;
  }

  if (
    ['CLINIC_OWNER', 'DOCTOR'].includes(user.role) &&
    user.status !== 'VERIFIED' &&
    !canAccessPendingRoute(location.pathname, user.role)
  ) {
    return <Navigate to="/verification-pending" replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={ROLE_HOME[user.role] || '/patient/home'} replace />;
  }

  return children;
};

export default ProtectedRoute;
