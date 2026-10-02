export const StoreCardSkeleton = () => (
  <div className="store-card-skeleton animate-pulse overflow-hidden bg-white">
    <div className="h-20 bg-slate-100" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
      <div className="pt-2 flex justify-between">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" />
      </div>
    </div>
  </div>
);
