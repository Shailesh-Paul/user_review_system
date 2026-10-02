import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RoleProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user?.mustChangePassword && user?.role === 'ADMIN') return <Navigate to="/change-password" replace />;

  if (!user || !allowedRoles.includes(user.role)) {
    // Redirect based on actual role if user exists
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'STORE_OWNER') return <Navigate to="/store-owner/dashboard" replace />;
    if (user?.role === 'USER') return <Navigate to="/stores" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
