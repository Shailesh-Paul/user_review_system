import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import api, { getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const passwordSchema = z
  .string()
  .min(8, 'Password must be 8-16 characters')
  .max(16, 'Password must be 8-16 characters')
  .regex(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,16}$/, 'Password must contain an uppercase letter and a special character');

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();
  const [apiError, setApiError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data) => {
    setApiError('');

    try {
      await api.post('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      updateUserProfile({ ...user, mustChangePassword: false });
      reset();

      if (user?.role === 'STORE_OWNER') {
        navigate('/store-owner/dashboard', { replace: true });
        return;
      }

      navigate('/profile', { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Unable to update your password right now.'));
    }
  };

  return (
    <section className="auth-shell auth-login page-enter">
      <aside className="auth-story">
        <div className="auth-story-inner">
          <p className="auth-story-brand"><span className="auth-story-monogram">R</span> Roxiler / Store ratings</p>
          <div className="auth-story-copy">
            <p className="eyebrow text-emerald-200">Security</p>
            <h2 className="editorial-title">Update your password.</h2>
            <p>Choose a strong password and continue to your dashboard.</p>
          </div>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-heading">
            <p className="eyebrow">Change password</p>
            <h1 className="editorial-title">Update your credentials</h1>
          </div>

          {apiError && (
            <div role="alert" className="auth-error flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <form className="auth-form login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('currentPassword')}
                  aria-invalid={Boolean(errors.currentPassword)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.currentPassword.message}</p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('newPassword')}
                  aria-invalid={Boolean(errors.newPassword)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit pressable w-full rounded-md bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>

            <div className="auth-switch text-center text-sm">
              <Link to={user?.role === 'STORE_OWNER' ? '/store-owner/dashboard' : '/profile'} className="font-semibold text-indigo-700 hover:text-indigo-800">
                Skip for now
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
