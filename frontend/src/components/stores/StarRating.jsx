import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

export const StarRating = ({
  value = 0,
  max = 5,
  size = 'md',
  showValue = false,
  className,
  interactive = false,
  onChange,
  disabled = false,
  ariaLabel
}) => {
  const numeric = Number(value) || 0;
  const [hoveredValue, setHoveredValue] = useState(null);
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const displayValue = interactive ? (hoveredValue ?? numeric) : numeric;

  const handleKeyboardSelect = (event, starValue) => {
    if (!interactive || disabled || typeof onChange !== 'function') return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      onChange(Math.min(max, starValue + 1));
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      onChange(Math.max(1, starValue - 1));
    }

    if (event.key === 'Home') {
      event.preventDefault();
      onChange(1);
    }

    if (event.key === 'End') {
      event.preventDefault();
      onChange(max);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('rating-stars flex items-center gap-0.5', interactive && 'cursor-pointer')}
        role={interactive ? 'radiogroup' : 'img'}
        aria-label={ariaLabel ?? `${numeric.toFixed(1)} out of ${max} stars`}
      >
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          const filled = displayValue >= starValue;
          const partial = !filled && numeric > index && numeric < starValue;

          if (interactive) {
            return (
              <button
                key={starValue}
                type="button"
                disabled={disabled}
                onClick={() => onChange?.(starValue)}
                onMouseEnter={() => !disabled && setHoveredValue(starValue)}
                onMouseLeave={() => setHoveredValue(null)}
                onFocus={() => !disabled && setHoveredValue(starValue)}
                onBlur={() => setHoveredValue(null)}
                onKeyDown={(event) => handleKeyboardSelect(event, starValue)}
                className={cn(
                  'rating-choice rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                  disabled && 'cursor-not-allowed'
                )}
                aria-label={`Rate ${starValue} out of ${max} stars`}
                aria-pressed={numeric === starValue}
              >
                <Star
                  className={cn(
                    'rating-star transition-transform',
                    sizeClass,
                    filled || partial
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300 dark:text-slate-600 fill-transparent',
                    disabled && 'opacity-60'
                  )}
                  aria-hidden="true"
                />
              </button>
            );
          }

          return (
            <Star
              key={starValue}
              className={cn(
                'rating-star',
                sizeClass,
                filled || partial
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300 dark:text-slate-600 fill-transparent'
              )}
              aria-hidden="true"
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {numeric.toFixed(1)} / {max}
        </span>
      )}
    </div>
  );
};
