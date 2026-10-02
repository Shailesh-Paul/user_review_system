import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AlertCircle, Mail } from 'lucide-react';
import api, { getApiErrorMessage } from '../../lib/api';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address')
});

export const ForgotPasswordPage = () => {
  const [apiMessage, setApiMessage] = useState('');
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setApiError('');
    setApiMessage('');

    try {
      const response = await api.post('/auth/forgot-password', { email: data.email.trim() });
      setApiMessage(response.data?.message || 'If your account exists, a reset email has been sent.');
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Unable to request a password reset right now.'));
    }
  };

  return (
    <section className="auth-shell auth-login page-enter">
      <aside className="auth-story">
        <div className="auth-story-inner">
          <p className="auth-story-brand"><span className="auth-story-monogram">R</span> Roxiler / Store ratings</p>
          <div className="auth-story-copy">
            <p className="eyebrow text-emerald-200">Reset access</p>
            <h2 className="editorial-title">We can help you get back in.</h2>
            <p>Enter the email you used for your account and we’ll send a secure reset link.</p>
          </div>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-heading">
            <p className="eyebrow">Password recovery</p>
            <h1 className="editorial-title">Forgot password</h1>
          </div>

          {apiError && (
            <div role="alert" className="auth-error flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{apiError}</span>
            </div>
          )}

          {apiMessage && (
            <div role="status" className="auth-success flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
              <span>{apiMessage}</span>
            </div>
          )}

          <form className="auth-form login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="auth-field">
              <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  aria-invalid={Boolean(errors.email)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit pressable w-full rounded-md bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send reset link'}
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
