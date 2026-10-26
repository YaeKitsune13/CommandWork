import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/auth';

export default function RequireRole({ allowedRoles, children }) {
  const { role, token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}