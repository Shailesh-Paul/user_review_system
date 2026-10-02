import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

const redirectForRole = (role) => {
  if (role === 'ADMIN') return '/admin';
  if (role === 'STORE_OWNER') return '/store-owner/dashboard';
  return '/stores';
};

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const user = await login(data.email, data.password);
      if (user.mustChangePassword && user.role === 'ADMIN') {
        navigate('/change-password', { replace: true });
        return;
      }
      navigate(redirectForRole(user.role), { replace: true });
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Login failed. Please check your credentials.'));
    }
  };

  return (
    <section className="auth-shell auth-login page-enter">
      <aside className="auth-story">
        <div className="auth-story-inner">
          <p className="auth-story-brand"><span className="auth-story-monogram">R</span> Roxiler / Store ratings</p>
          <div className="auth-story-copy">
            <p className="eyebrow text-emerald-200">Good to have you back</p>
            <h2 className="editorial-title">The local places you trust, all in one place.</h2>
            <p>Pick up where you left off: browse customer perspectives, revisit a store, or add a note of your own.</p>
          </div>
          <div className="auth-story-notes" aria-label="Roxiler account benefits">
            <p><span>01</span> Your reviews stay connected to you</p>
            <p><span>02</span> Store ratings are easy to compare</p>
            <p><span>03</span> Your next visit starts with context</p>
          </div>
          <p className="auth-story-footnote">Real places. Useful opinions. Better choices.</p>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-heading">
            <p className="eyebrow">Your Roxiler account</p>
            <h1 className="editorial-title">Welcome back</h1>
            <p>Sign in to continue exploring and sharing.</p>
          </div>

        {apiError && (
          <div
            role="alert"
            className="auth-error flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md"
          >
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{apiError}</span>
          </div>
        )}

        <form className="auth-form login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-fields-stack">
            <div className="auth-field">
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder=""
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  aria-invalid={Boolean(errors.password)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder=""
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-submit pressable w-full rounded-md bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-4 text-right text-sm">
            <Link to="/forgot-password" className="font-medium text-indigo-700 hover:text-indigo-800">
              Forgot password?
            </Link>
          </div>

          <div className="auth-switch text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">Don&apos;t have an account? </span>
            <Link to="/register" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Sign up
            </Link>
          </div>
        </form>
      </div>
      </div>
    </section>
  );
};
