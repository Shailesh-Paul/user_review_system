import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Lock, Mail, User, MapPin, Star, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name must not exceed 60 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be 8-16 characters')
    .max(16, 'Password must be 8-16 characters')
    .regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/, 'Password must contain uppercase, number, and special character'),
  address: z.string().max(400, 'Address must not exceed 400 characters').optional()
});

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    setApiError('');
    setIsSubmitting(true);
    try {
      await registerAuth(data.name, data.email, data.password, data.address);
      navigate('/stores');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mb-4">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Join Roxiler to rate stores and post verified reviews
          </p>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                {...register('name')}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="John Doe"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                {...register('email')}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="name@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                {...register('password')}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">8-16 chars, 1 uppercase, 1 number, 1 special char</p>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Address (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                type="text"
                {...register('address')}
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                placeholder="123 Main St, City"
              />
            </div>
            {errors.address && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.address.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="text-center text-sm pt-2">
            <span className="text-slate-600 dark:text-slate-400">Already have an account? </span>
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
