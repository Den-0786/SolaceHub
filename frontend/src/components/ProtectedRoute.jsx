import { Navigate, useLocation } from 'react-router-dom';

const ROLE_HOME = {
  owner: '/owner-dashboard',
  admin: '/admin-dashboard',
  client: '/admin-dashboard',
  desk_operator: '/chit-console',
  chit_staff: '/chit-console',
  donation_staff: '/chit-console',
};

export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const authToken = localStorage.getItem('authToken');
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }

  if (!authToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  }

  return children;
}
