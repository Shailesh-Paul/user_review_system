import { User, Mail, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ProfilePagePlaceholder = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          My Profile
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{user?.name}</h2>
            <span className="inline-flex items-center gap-1 text-xs font-mono uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
              <Shield className="w-3 h-3" />
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{user?.address || 'No address provided'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
