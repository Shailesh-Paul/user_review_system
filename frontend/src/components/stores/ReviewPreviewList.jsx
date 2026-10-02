import { StarRating } from './StarRating';

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const ReviewPreviewList = ({ reviews = [] }) => {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400 py-4">
        No written reviews yet. Be the first to share your experience in the next update.
      </p>
    );
  }

  return (
    <ul className="review-preview-list divide-y divide-slate-200">
      {reviews.map((review) => (
        <li key={review.id} className="py-4 first:pt-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {review.user_name || 'Reviewer'}
            </p>
            <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={review.created_at}>
              {formatDate(review.created_at)}
            </time>
          </div>
          <StarRating value={review.rating} size="sm" className="mb-2" />
          {review.review ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4">{review.review}</p>
          ) : (
            <p className="text-sm italic text-slate-500 dark:text-slate-500">Rated without a written review.</p>
          )}
        </li>
      ))}
    </ul>
  );
};
