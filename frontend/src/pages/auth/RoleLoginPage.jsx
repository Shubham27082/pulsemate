import { Navigate, useParams } from 'react-router-dom';

const RoleLoginPage = () => {
  const { role } = useParams();

  if (role === 'patient') {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/staff/login" replace />;
};

export default RoleLoginPage;
