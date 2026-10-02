import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import api, { getApiErrorMessage } from '../../lib/api';

const passwordSchema = z
  .string()
  .min(8, 'Password must be 8-16 characters')
  .max(16, 'Password must be 8-16 characters')
  .regex(/^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,16}$/, 'Password must contain an uppercase letter and a special character');

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is missing.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: searchParams.get('token') || '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token') || '';
    setValue('token', tokenFromUrl);
  }, [searchParams, setValue]);

  const onSubmit = async (data) => {
    setApiError('');

    try {
      await api.post('/auth/reset-password', {
        token: data.token,
        newPassword: data.newPassword
      });
      navigate('/login', { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Unable to reset your password right now.'));
    }
  };

  return (
    <section className="auth-shell auth-login page-enter">
      <aside className="auth-story">
        <div className="auth-story-inner">
          <p className="auth-story-brand"><span className="auth-story-monogram">R</span> Roxiler / Store ratings</p>
          <div className="auth-story-copy">
            <p className="eyebrow text-emerald-200">Choose a new password</p>
            <h2 className="editorial-title">Create a secure password.</h2>
            <p>Use a fresh, strong password to protect your account.</p>
          </div>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-heading">
            <p className="eyebrow">Set new password</p>
            <h1 className="editorial-title">Reset your password</h1>
          </div>

          {apiError && (
            <div role="alert" className="auth-error flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          <form className="auth-form login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <input type="hidden" {...register('token')} />

            <div className="auth-field">
              <label htmlFor="reset-new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="reset-new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('newPassword')}
                  aria-invalid={Boolean(errors.newPassword)}
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.newPassword.message}</p>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="reset-confirm-password"
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
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </button>

            <div className="auth-switch text-center text-sm">
              <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};
