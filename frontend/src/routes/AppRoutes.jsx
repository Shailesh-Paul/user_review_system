import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { ChangePasswordPage } from '../pages/auth/ChangePasswordPage';
import { AdminDashboardPlaceholder } from '../pages/admin/AdminDashboardPlaceholder';
import { StoreOwnerDashboardPlaceholder } from '../pages/store-owner/StoreOwnerDashboardPlaceholder';
import { UserStoresPage } from '../pages/user/UserStoresPage';
import { StoreDetailsPage } from '../pages/user/StoreDetailsPage';
import { ProfilePagePlaceholder } from '../pages/profile/ProfilePagePlaceholder';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useAuth } from '../hooks/useAuth';

const SessionLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading session...</p>
    </div>
  </div>
);

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword && user.role === 'ADMIN') return <Navigate to="/change-password" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'STORE_OWNER') return <Navigate to="/store-owner/dashboard" replace />;
  return <Navigate to="/stores" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Shared Authenticated Routes */}
          <Route path="/profile" element={<ProfilePagePlaceholder />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Role-Based Protected Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPlaceholder />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['STORE_OWNER']} />}>
            <Route path="/store-owner" element={<Navigate to="/store-owner/dashboard" replace />} />
            <Route path="/store-owner/dashboard" element={<StoreOwnerDashboardPlaceholder />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['USER']} />}>
            <Route path="/stores" element={<UserStoresPage />} />
            <Route path="/stores/:storeId" element={<StoreDetailsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<AppLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
