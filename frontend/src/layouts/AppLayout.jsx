import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Store, User, Shield, LogOut, Star, LayoutDashboard } from 'lucide-react';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [];

  if (user?.role === 'USER') {
    navLinks.push({ label: 'Browse Stores', path: '/stores', icon: Store });
    navLinks.push({ label: 'My Profile', path: '/profile', icon: User });
  } else if (user?.role === 'STORE_OWNER') {
    navLinks.push({ label: 'Owner Dashboard', path: '/store-owner', icon: LayoutDashboard });
    navLinks.push({ label: 'My Profile', path: '/profile', icon: User });
  } else if (user?.role === 'ADMIN') {
    navLinks.push({ label: 'Admin Dashboard', path: '/admin', icon: Shield });
    navLinks.push({ label: 'My Profile', path: '/profile', icon: User });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo / Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <span>Roxiler Ratings</span>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User profile & logout */}
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono uppercase tracking-wider">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md shadow-sm transition-colors"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 Roxiler Store Rating Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};
