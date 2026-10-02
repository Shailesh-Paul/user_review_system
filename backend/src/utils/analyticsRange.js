/**
 * Phase 17 — shared analytics time-range helper.
 *
 * Time filters exposed in the UI: 7 Days, 30 Days, 3 Months, 1 Year, All Time.
 * Grouping granularity is chosen so charts stay readable:
 *   - short ranges  -> per day
 *   - long ranges   -> per month
 */

export const RANGE_DAYS = {
  '7d': 7,
  '30d': 30,
  '3m': 90,
  '1y': 365,
  all: null
};

export const resolveRange = (rawRange) => {
  const requested = String(rawRange ?? '').toLowerCase();
  const key = Object.prototype.hasOwnProperty.call(RANGE_DAYS, requested) ? requested : '30d';
  const days = RANGE_DAYS[key];

  const fromDate = days === null
    ? null
    : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const granularity = ['7d', '30d', '3m'].includes(key) ? 'day' : 'month';
  const dateFormat = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';

  return { key, days, fromDate, granularity, dateFormat };
};
