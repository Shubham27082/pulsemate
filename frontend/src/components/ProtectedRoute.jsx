import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ROLE_HOME = {
  SUPER_ADMIN:  '/admin',
  CLINIC_OWNER: '/owner',
  DOCTOR:       '/doctor',
  RECEPTIONIST: '/reception',
  PATIENT:      '/patient',
};

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    const home = ROLE_HOME[user?.role] || '/login';
    return <Navigate to={home} replace />;
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const home = ROLE_HOME[user.role] || '/patient';
    return <Navigate to={home} replace />;
  }

  return children;
};

export { ROLE_HOME };
export default ProtectedRoute;
