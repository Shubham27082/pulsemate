import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getPortalFromPath } from '../utils/authScope';

const ROLE_HOME = {
  SUPER_ADMIN: '/admin',
  CLINIC_OWNER: '/owner',
  DOCTOR: '/doctor',
  RECEPTIONIST: '/reception',
  PATIENT: '/patient',
};

const getLoginRouteForPortal = (portal) =>
  `/login/${portal === 'clinic-owner' ? 'clinic' : portal}`;

const hasLimitedApprovalAccess = (user) =>
  ['DOCTOR', 'CLINIC_OWNER'].includes(user?.role) && user?.approvalStatus && user.approvalStatus !== 'VERIFIED';

const ProtectedRoute = ({ children, roles }) => {
  const location = useLocation();
  const portal = getPortalFromPath(location.pathname);
  const session = useAuthStore((state) => state.sessions[portal]);

  if (!session?.isAuthenticated) {
    return <Navigate to={getLoginRouteForPortal(portal)} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(session.user?.role)) {
    const home = ROLE_HOME[session.user?.role] || '/login';
    return <Navigate to={home} replace />;
  }

  if (hasLimitedApprovalAccess(session.user)) {
    const home = ROLE_HOME[session.user.role];
    if (location.pathname !== home) {
      return <Navigate to={home} replace />;
    }
  }

  return children;
};

export const PublicRoute = ({ children }) => {
  const location = useLocation();
  const portal = getPortalFromPath(location.pathname);
  const session = useAuthStore((state) => state.sessions[portal]);

  if (session?.isAuthenticated && session?.user) {
    const home = ROLE_HOME[session.user.role] || '/patient';
    return <Navigate to={home} replace />;
  }

  return children;
};

export { ROLE_HOME };
export default ProtectedRoute;
