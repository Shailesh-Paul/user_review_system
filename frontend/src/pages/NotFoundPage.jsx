import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 text-center">
      <div className="max-w-md space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">404</h1>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Page Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Safety
          </Link>
        </div>
      </div>
    </div>
  );
};
