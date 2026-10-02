import { Star } from 'lucide-react';

export const RatingDistribution = ({ distribution = {}, totalRatings = 0 }) => {
  const rows = [5, 4, 3, 2, 1];
  const maxCount = Math.max(...rows.map((star) => Number(distribution[String(star)] || 0)), 1);

  return (
    <div className="space-y-2" aria-label="Rating distribution">
      {rows.map((star) => {
        const count = Number(distribution[String(star)] || 0);
        const widthPercent = totalRatings > 0 ? (count / maxCount) * 100 : 0;

        return (
          <div key={star} className="rating-distribution-row flex items-center gap-2 text-sm">
            <span className="flex w-9 items-center gap-1 text-slate-600 tabular-nums">
              {star}<Star className="h-3 w-3 fill-amber-400 text-amber-500" aria-hidden="true" />
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <span className="w-8 text-right text-slate-500 dark:text-slate-400 tabular-nums">{count}</span>
          </div>
        );
      })}
    </div>
  );
};
