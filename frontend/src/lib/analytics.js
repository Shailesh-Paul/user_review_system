import api from './api';

export const ANALYTICS_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '3m', label: '3 Months' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' }
];

export const rangeLabelFor = (value) =>
  ANALYTICS_RANGES.find((option) => option.value === value)?.label ?? '30 Days';

export const formatPeriod = (period) => {
  if (!period) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const [year, month, day] = period.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(date);
  }
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' }).format(date);
  }
  return period;
};

export async function getStoreAnalytics(storeId, range = '30d') {
  const response = await api.get('/store-owner/analytics', { params: { storeId, range } });
  return response.data?.data ?? null;
}

export async function getPlatformAnalytics(range = '30d') {
  const response = await api.get('/admin/analytics', { params: { range } });
  return response.data?.data ?? null;
}
