import { Shield, Users, Store, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const AdminDashboardPlaceholder = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            System administration & overview (Welcome back, {user?.name})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Users</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ready</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Stores</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ready</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">System Ratings</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ready</p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 p-6 rounded-xl text-center">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Admin Foundation Configured</h3>
        <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
          Frontend routing, role-based protection, and API client integration are fully ready for phase modules.
        </p>
      </div>
    </div>
  );
};
