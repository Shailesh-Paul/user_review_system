import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Store, User, Shield, LogOut, LayoutDashboard, Menu, X, Key } from 'lucide-react';
import { NotificationBell } from '../components/notifications/NotificationBell';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navLinks = [];

  if (user?.role === 'USER') {
    navLinks.push({ label: 'Browse Stores', path: '/stores', icon: Store });
    navLinks.push({ label: 'My Profile', path: '/profile', icon: User });
  } else if (user?.role === 'STORE_OWNER') {
    navLinks.push({ label: 'Owner Dashboard', path: '/store-owner/dashboard', icon: LayoutDashboard });
    navLinks.push({ label: 'My Profile', path: '/profile', icon: User });
  } else if (user?.role === 'ADMIN') {
    navLinks.push({ label: 'Admin Dashboard', path: '/admin', icon: Shield });
    navLinks.push({ label: 'My Profile', path: '/profile', icon: User });
  }

  return (
    <div className="app-shell min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <header className="site-header sticky top-0 z-40 bg-white/95">
        <div className="site-header-inner mx-auto flex h-17 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="brand-lockup flex items-center gap-2.5 text-slate-900" aria-label="Roxiler Ratings home">
            <span className="brand-mark flex h-8 w-8 items-center justify-center rounded-md bg-indigo-700 text-white">
              <Store className="h-4.25 w-4.25" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="brand-name text-[17px] font-semibold">roxiler</span>
              <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-500">Store ratings</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'is-active text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <NotificationBell />
              <div className="hidden flex-col text-right sm:flex">
                <span className="max-w-40 truncate text-sm font-semibold text-slate-900">{user.name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{user.role?.replace('_', ' ')}</span>
              </div>
              {user.role !== 'ADMIN' && (
                <Link
                  to="/change-password"
                  className="hidden items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700 sm:flex"
                  title="Update Password"
                >
                  <Key className="w-4 h-4" />
                  <span className="hidden lg:inline">Update Password</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hidden items-center gap-1.5 px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-red-700 sm:flex"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="mobile-menu-toggle flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="pressable rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-800"
              >
                Create account
              </Link>
            </div>
          )}
        </div>

        {user && mobileMenuOpen && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-navigation border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex min-h-11 items-center gap-3 px-2 text-sm font-medium ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            {user.role !== 'ADMIN' && (
              <Link
                to="/change-password"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 w-full items-center gap-3 border-t border-slate-100 px-2 pt-2 text-left text-sm font-medium text-slate-600 hover:text-indigo-700"
              >
                <Key className="h-4 w-4" aria-hidden="true" />
                Update Password
              </Link>
            )}
            <button onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 border-t border-slate-100 px-2 pt-2 text-left text-sm font-medium text-slate-600">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </nav>
        )}

        {!user && (
          <div className="flex items-center gap-2 px-4 pb-3 sm:hidden">
            <Link to="/login" className="flex-1 py-2 text-center text-sm font-medium text-slate-700">Sign in</Link>
            <Link to="/register" className="flex-1 rounded-md bg-indigo-700 py-2 text-center text-sm font-semibold text-white">Create account</Link>
          </div>
        )}
      </header>

      <main className={isAuthPage ? 'auth-main flex-1 w-full' : 'page-main mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8'}>
        <Outlet />
      </main>

      <footer className={`site-footer border-t border-slate-200 bg-white px-4 py-4 text-center text-[11px] text-slate-500 ${isAuthPage ? 'auth-footer' : ''}`}>
        <p>© 2026 Roxiler Ratings <span className="mx-1.5 text-slate-300">·</span> Real places, considered reviews</p>
      </footer>
    </div>
  );
};
