import { Link } from 'react-router-dom';
import { MapPin, Mail, Store } from 'lucide-react';
import { StarRating } from './StarRating';

export const StoreCard = ({ store }) => {
  const ratingLabel =
    store.totalRatings > 0
      ? `${store.averageRating} average from ${store.totalRatings} ratings`
      : 'No ratings yet';

  return (
    <Link
      to={`/stores/${store.id}`}
      className="store-card group flex h-full flex-col bg-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="store-card-visual flex items-center justify-between">
        <span className="store-card-category">Roxiler directory</span>
        <Store className="h-5 w-5 text-indigo-700" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-3">
        <div>
          <h2 className="store-card-title line-clamp-2 text-lg text-slate-900 group-hover:text-indigo-700">
            {store.name}
          </h2>
          <p className="sr-only">{ratingLabel}</p>
        </div>

        {store.address && (
          <p className="flex items-start gap-1.5 text-sm leading-5 text-slate-600 line-clamp-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{store.address}</span>
          </p>
        )}

        <div className="store-card-rating mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <StarRating value={store.averageRating} size="sm" />
            <span className="text-sm font-semibold tabular-nums text-slate-800">{Number(store.averageRating || 0).toFixed(1)}</span>
          </div>
          <span className="whitespace-nowrap text-xs text-slate-500">
            {store.totalRatings === 0 ? 'No ratings' : `${store.totalRatings} rating${store.totalRatings === 1 ? '' : 's'}`}
          </span>
        </div>

        {store.email && (
          <p className="flex items-center gap-1.5 truncate text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{store.email}</span>
          </p>
        )}
      </div>
    </Link>
  );
};
