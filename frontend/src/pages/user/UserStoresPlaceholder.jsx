import { Store, Search, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const UserStoresPlaceholder = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Explore Stores
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Discover stores, rate experience, and generate AI review drafts (Welcome, {user?.name})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search stores..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 p-8 rounded-xl text-center">
        <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200">User Store Foundation Configured</h3>
        <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-2 max-w-xl mx-auto">
          The user portal architecture is fully connected to authentication, state management, and API clients.
        </p>
      </div>
    </div>
  );
};
