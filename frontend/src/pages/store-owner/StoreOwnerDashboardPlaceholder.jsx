import { Store, Star, MessageSquareText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const StoreOwnerDashboardPlaceholder = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Store Owner Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your store & view customer ratings (Welcome, {user?.name})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Average Rating</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ready</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Customer Reviews</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ready</p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 p-6 rounded-xl text-center">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Store Owner Foundation Configured</h3>
        <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">
          Store Owner authenticated workspace is ready for dashboard metrics and review management.
        </p>
      </div>
    </div>
  );
};
