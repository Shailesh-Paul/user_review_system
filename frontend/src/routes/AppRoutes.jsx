import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { AdminDashboardPlaceholder } from '../pages/admin/AdminDashboardPlaceholder';
import { StoreOwnerDashboardPlaceholder } from '../pages/store-owner/StoreOwnerDashboardPlaceholder';
import { UserStoresPlaceholder } from '../pages/user/UserStoresPlaceholder';
import { ProfilePagePlaceholder } from '../pages/profile/ProfilePagePlaceholder';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useAuth } from '../hooks/useAuth';

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'STORE_OWNER') return <Navigate to="/store-owner" replace />;
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
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Shared Authenticated Routes */}
          <Route path="/profile" element={<ProfilePagePlaceholder />} />

          {/* Role-Based Protected Routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboardPlaceholder />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['STORE_OWNER']} />}>
            <Route path="/store-owner" element={<StoreOwnerDashboardPlaceholder />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['USER']} />}>
            <Route path="/stores" element={<UserStoresPlaceholder />} />
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
