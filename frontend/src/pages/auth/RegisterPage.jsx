import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api';
import { Lock, Mail, User, MapPin, AlertCircle, Eye, EyeOff } from 'lucide-react';

const passwordSchema = z
  .string()
  .min(8, 'Password must be 8-16 characters')
  .max(16, 'Password must be 8-16 characters')
  .regex(
    /^(?=.*[A-Z])(?=.*[^A-Za-z0-9\s]).{8,16}$/,
    'Password must contain an uppercase letter and a special character'
  );

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(20, 'Name must be between 20 and 60 characters')
      .max(60, 'Name must be between 20 and 60 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    address: z.string().max(400, 'Address must not exceed 400 characters').optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      address: ''
    }
  });

  const onSubmit = async (data) => {
    setApiError('');
    try {
      await registerAuth(data.name, data.email, data.password, data.address);
      navigate('/stores', { replace: true });
    } catch (err) {
      setApiError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <section className="auth-shell auth-register page-enter">
      <aside className="auth-story">
        <div className="auth-story-inner">
          <p className="auth-story-brand"><span className="auth-story-monogram">R</span> Roxiler / Store ratings</p>
          <div className="auth-story-copy">
            <p className="eyebrow text-emerald-200">A better local guide</p>
            <h2 className="editorial-title">Find the places worth coming back to.</h2>
            <p>Good decisions start with honest experiences. Discover neighborhood stores and share what mattered to you.</p>
          </div>
          <div className="auth-story-notes" aria-label="What you can do with Roxiler">
            <p><span>01</span> Browse stores by name and location</p>
            <p><span>02</span> Compare ratings with customer notes</p>
            <p><span>03</span> Add your own first-hand perspective</p>
          </div>
          <p className="auth-story-footnote">Real places. Useful opinions. Better choices.</p>
        </div>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-heading">
            <p className="eyebrow">Join the community</p>
            <h1 className="editorial-title">Create your account</h1>
            <p>Keep the useful details close, and help others find their next favorite.</p>
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

        <form className="auth-form register-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="auth-field">
            <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                {...register('name')}
                aria-invalid={Boolean(errors.name)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder=""
              />
            </div>
            <p className="auth-help mt-1 text-xs text-slate-500">Use 20–60 characters.</p>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="register-email"
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
            <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
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
            <p className="mt-1 text-xs text-slate-500">8–16 characters, 1 uppercase letter, 1 special character</p>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label
              htmlFor="register-confirm-password"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                {...register('confirmPassword')}
                aria-invalid={Boolean(errors.confirmPassword)}
                className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder=""
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
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="register-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="register-address"
                type="text"
                autoComplete="street-address"
                {...register('address')}
                aria-invalid={Boolean(errors.address)}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder=""
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
                {errors.address.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="auth-submit pressable w-full rounded-md bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="auth-switch text-center text-sm">
            <span className="text-slate-600 dark:text-slate-400">Already have an account? </span>
            <Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Sign in
            </Link>
          </div>
        </form>
      </div>
      </div>
    </section>
  );
};
