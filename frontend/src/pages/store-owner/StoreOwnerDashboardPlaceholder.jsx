import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Building2,
  ChevronRight,
  LayoutGrid,
  MessageSquareText,
  Package,
  Pencil,
  Store,
  Star,
  TrendingUp
} from 'lucide-react';
import api, { getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { getStoreAnalytics, ANALYTICS_RANGES, rangeLabelFor } from '../../lib/analytics';
import { TrendLineChart, SimpleBarList } from '../../components/analytics/AnalyticsCharts';

const getOwnerStores = async () => {
  const response = await api.get('/store-owner/stores');
  return response.data?.data ?? [];
};

const getOwnerStore = async (storeId) => {
  const response = await api.get('/store-owner/store', { params: { storeId } });
  return response.data?.data ?? null;
};

const getDashboardStats = async (storeId) => {
  const response = await api.get('/store-owner/dashboard', { params: { storeId } });
  return response.data?.data ?? null;
};



const getOwnerRatings = async (storeId, params = {}) => {
  const response = await api.get('/store-owner/ratings', {
    params: { storeId, ...params }
  });
  return response.data ?? {};
};

const ratingLabels = ['5', '4', '3', '2', '1'];

export const StoreOwnerDashboardPlaceholder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [ratingSort, setRatingSort] = useState('created_at');
  const [ratingOrder, setRatingOrder] = useState('desc');
  const [analyticsRange, setAnalyticsRange] = useState('30d');
  const [page, setPage] = useState(1);
  const [profileDraft, setProfileDraft] = useState(null);
  const [profileNotice, setProfileNotice] = useState('');

  const storesQuery = useQuery({
    queryKey: ['store-owner-stores'],
    queryFn: getOwnerStores
  });

  const stores = storesQuery.data ?? [];
  const activeStoreId = stores.some((store) => String(store.id) === String(selectedStoreId))
    ? String(selectedStoreId)
    : stores[0]
      ? String(stores[0].id)
      : '';

  const selectedStore = stores.find((store) => String(store.id) === String(activeStoreId)) ?? null;

  const storeQuery = useQuery({
    queryKey: ['store-owner-store', activeStoreId],
    queryFn: () => getOwnerStore(activeStoreId),
    enabled: Boolean(activeStoreId)
  });

  const profileStore = storeQuery.data ?? selectedStore ?? {};
  const profileForm = profileDraft?.storeId === activeStoreId
    ? profileDraft.values
    : {
      name: profileStore.name ?? '',
      email: profileStore.email ?? '',
      address: profileStore.address ?? '',
      category: profileStore.category ?? '',
      description: profileStore.description ?? '',
      city: profileStore.city ?? '',
      state: profileStore.state ?? '',
      pin_code: profileStore.pin_code ?? '',
      contact_phone: profileStore.contact_phone ?? ''
    };
  const updateProfileField = (field, value) => {
    setProfileDraft({
      storeId: activeStoreId,
      values: { ...profileForm, [field]: value }
    });
  };

  const dashboardQuery = useQuery({
    queryKey: ['store-owner-dashboard', activeStoreId],
    queryFn: () => getDashboardStats(activeStoreId),
    enabled: Boolean(activeStoreId)
  });


  const analyticsQuery = useQuery({
    queryKey: ['store-owner-analytics', activeStoreId, analyticsRange],
    queryFn: () => getStoreAnalytics(activeStoreId, analyticsRange),
    enabled: Boolean(activeStoreId),
    keepPreviousData: true
  });

  const ratingParams = {
    sort: ratingSort,
    order: ratingOrder,
    page,
    limit: 5,
    ...(ratingFilter !== 'all' ? { rating: ratingFilter } : {})
  };

  const reviewsQuery = useQuery({
    queryKey: ['store-owner-ratings', activeStoreId, ratingFilter, ratingSort, ratingOrder, page],
    queryFn: () => getOwnerRatings(activeStoreId, ratingParams),
    enabled: Boolean(activeStoreId),
    keepPreviousData: true
  });

  const metrics = dashboardQuery.data ?? null;
  const reviews = reviewsQuery.data?.data ?? [];
  const reviewPagination = reviewsQuery.data?.pagination ?? null;
  const averageRating = Number(metrics?.averageRating ?? 0);
  const totalRatings = Number(metrics?.totalRatings ?? 0);
  const totalProducts = Number(metrics?.totalProducts ?? 0);
  const totalCategories = Number(metrics?.totalCategories ?? 0);
  const distribution = metrics?.distribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const analyticsData = analyticsQuery.data ?? null;
  const analyticsRangeLabel = rangeLabelFor(analyticsRange);

  const saveProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch('/store-owner/store', payload, {
        params: { storeId: activeStoreId }
      });
      return response.data;
    },
    onSuccess: async () => {
      setProfileNotice('Store profile saved successfully.');
      setProfileDraft(null);
      await queryClient.invalidateQueries({ queryKey: ['store-owner-stores'] });
      await queryClient.invalidateQueries({ queryKey: ['store-owner-store', activeStoreId] });
      await queryClient.invalidateQueries({ queryKey: ['store-owner-dashboard', activeStoreId] });
    },
    onError: (error) => {
      setProfileNotice(getApiErrorMessage(error, 'Unable to update the store profile.'));
    }
  });

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileNotice('');
    saveProfileMutation.mutate({
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
      address: profileForm.address.trim(),
      category: profileForm.category.trim(),
      description: profileForm.description.trim(),
      city: profileForm.city.trim(),
      state: profileForm.state.trim(),
      pin_code: profileForm.pin_code.trim(),
      contact_phone: profileForm.contact_phone.trim()
    });
  };

  const handleStoreChange = (value) => {
    setSelectedStoreId(value);
    setPage(1);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reviews', label: 'Reviews', icon: MessageSquareText },
    { id: 'profile', label: 'Store Profile', icon: Pencil }
  ];

  if (storesQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (storesQuery.isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        We could not load your stores right now. Please refresh and try again.
      </div>
    );
  }

  if (!stores.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <Building2 className="mx-auto mb-4 h-12 w-12 text-slate-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">No stores assigned</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This account is not linked to any store yet. Please contact an administrator to assign one.
        </p>
      </div>
    );
  }

  const activeStore = selectedStore ?? stores[0];

  return (
    <div className="owner-dashboard page-enter space-y-7">
      <div className="owner-dashboard-heading flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Store owner</p>
          <h1 className="editorial-title mt-1 text-3xl text-slate-900">Your store, at a glance</h1>
          <p className="mt-1 text-sm text-slate-600">Welcome back, {user?.name}</p>
        </div>

        <div className="w-full max-w-sm">
          <label htmlFor="store-select" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            My Stores
          </label>
          <select
            id="store-select"
            value={activeStoreId}
            onChange={(event) => handleStoreChange(event.target.value)}
            className="filter-control w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className="owner-section-link inline-flex items-center gap-2 border-b-2 border-transparent px-2 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-600 hover:text-indigo-800"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>

      {storeQuery.isLoading || dashboardQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <section id="overview" className="owner-overview space-y-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Store className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 className="text-xl font-semibold">{activeStore?.name}</h2>
          </div>

          <div className="owner-stats-grid grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="owner-stat-card owner-stat-primary rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average rating</p>
              <div className="mt-3 flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{averageRating.toFixed(1)}</span>
              </div>
            </div>

            <div className="owner-stat-card rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total ratings</p>
              <div className="mt-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalRatings}</span>
              </div>
            </div>

            <div className="owner-stat-card rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Product listings</p>
              <div className="mt-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{totalProducts}</span>
              </div>
            </div>

            <div className="owner-stat-card rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Location</p>
              <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{activeStore?.address || 'Not provided'}</p>
            </div>
          </div>
        </section>
      )}

      {(dashboardQuery.isError || storeQuery.isError) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          We could not load the latest store metrics. Please try another store or refresh the page.
        </div>
      )}

      <section id="analytics" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="owner-analytics-card bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rating distribution</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">{totalRatings} total</span>
          </div>

          <div className="space-y-3">
            {ratingLabels.map((label) => {
              const value = Number(distribution?.[label] ?? 0);
              const width = totalRatings === 0 ? 0 : Math.max((value / totalRatings) * 100, value > 0 ? 8 : 0);

              return (
                <div key={label} className="grid grid-cols-[48px_1fr_40px] items-center gap-3">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}★</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="text-right text-sm text-slate-600 dark:text-slate-300">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="owner-analytics-card bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Store snapshot</h2>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
              <span className="text-sm text-amber-700 dark:text-amber-300">Average</span>
              <strong className="text-xl font-bold text-amber-700 dark:text-amber-300">{averageRating.toFixed(1)}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/30">
              <span className="text-sm text-indigo-700 dark:text-indigo-300">Ratings</span>
              <strong className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{totalRatings}</strong>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/30">
              <span className="text-sm text-emerald-700 dark:text-emerald-300">Categories</span>
              <strong className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{totalCategories}</strong>
            </div>
          </div>
        </div>
      </section>

      <section id="feedback-trends" className="owner-analytics-panel bg-white p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Feedback trends</h2>
            <p className="text-sm text-slate-600">How customer feedback has changed over the selected period</p>
          </div>
          <div className="analytics-range-tabs" role="tablist" aria-label="Analytics time range">
            {ANALYTICS_RANGES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={analyticsRange === option.value}
                onClick={() => setAnalyticsRange(option.value)}
                className={`analytics-range-tab pressable ${analyticsRange === option.value ? 'is-active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {analyticsQuery.isLoading && <div className="analytics-empty">Loading analytics…</div>}

        {analyticsQuery.isError && (
          <div className="analytics-empty">We could not load analytics for this store right now.</div>
        )}

        {analyticsData && !analyticsQuery.isError && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="analytics-block">
              <h3 className="analytics-block-title">Review activity</h3>
              <TrendLineChart
                data={analyticsData.reviewActivity}
                valueKey="ratings"
                caption={`Ratings received in the last ${analyticsRangeLabel.toLowerCase()}`}
              />
            </div>

            <div className="analytics-block">
              <h3 className="analytics-block-title">Rating trend</h3>
              {analyticsData.hasTrendData ? (
                <TrendLineChart
                  data={analyticsData.ratingTrend}
                  valueKey="averageRating"
                  caption="Average rating per period"
                />
              ) : (
                <div className="analytics-empty">Not enough data yet</div>
              )}
            </div>

            <div className="analytics-block lg:col-span-2">
              <h3 className="analytics-block-title">Products by category</h3>
              <SimpleBarList
                items={(analyticsData.categoryDistribution ?? []).map((entry) => ({
                  label: entry.category,
                  value: entry.products
                }))}
              />
            </div>
          </div>
        )}
      </section>



      <section id="reviews" className="owner-reviews-section bg-white p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent reviews</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Customer feedback for the selected store</p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="rating-filter" className="text-sm text-slate-600 dark:text-slate-300">Filter</label>
            <select
              id="rating-filter"
              value={ratingFilter}
              onChange={(event) => {
                setRatingFilter(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">All ratings</option>
              <option value="5">5★</option>
              <option value="4">4★</option>
              <option value="3">3★</option>
              <option value="2">2★</option>
              <option value="1">1★</option>
            </select>
            <label htmlFor="rating-sort" className="sr-only">Sort ratings</label>
            <select
              id="rating-sort"
              value={ratingSort}
              onChange={(event) => {
                setRatingSort(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="created_at">Date</option>
              <option value="rating">Rating</option>
              <option value="user_name">Reviewer name</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setRatingOrder((current) => current === 'asc' ? 'desc' : 'asc');
                setPage(1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label={`Sort ${ratingOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {ratingOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {reviewsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : reviewsQuery.isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            We could not load recent reviews for this store.
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
            There are no reviews for this store with the current filter.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <article key={review.id} className="owner-review-item border-t border-slate-200 py-4 first:border-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{review.user_name || 'Anonymous reviewer'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(review.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    {review.rating}/5
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                  {review.review || 'Customer provided a rating without a public review note.'}
                </p>

                {review.media && review.media.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {review.media.length} media item{review.media.length > 1 ? 's' : ''}
                    </span>
                    {review.media.slice(0, 2).map((item) => (
                      <img
                        key={item.id}
                        src={item.media_url}
                        alt="Customer review media"
                        className="h-12 w-12 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {reviewPagination && reviewPagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Page {page} of {reviewPagination.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= reviewPagination.totalPages}
              onClick={() => setPage((current) => Math.min(reviewPagination.totalPages, current + 1))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <section id="profile" className="owner-profile-section border-t border-slate-200 py-6">
        <div className="mb-4 flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Pencil className="h-5 w-5 text-indigo-600" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Store profile</h2>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleProfileSave}>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store name</label>
            <input
              value={profileForm.name}
              onChange={(event) => updateProfileField('name', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store email</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(event) => updateProfileField('email', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store address</label>
            <input
              value={profileForm.address}
              onChange={(event) => updateProfileField('address', event.target.value)}
              maxLength={400}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store category</label>
            <input
              value={profileForm.category}
              onChange={(event) => updateProfileField('category', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Store description</label>
            <textarea
              rows="3"
              value={profileForm.description}
              onChange={(event) => updateProfileField('description', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City</label>
            <input
              value={profileForm.city}
              onChange={(event) => updateProfileField('city', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">State</label>
            <input
              value={profileForm.state}
              onChange={(event) => updateProfileField('state', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">PIN code</label>
            <input
              value={profileForm.pin_code}
              onChange={(event) => updateProfileField('pin_code', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
            <input
              value={profileForm.contact_phone}
              onChange={(event) => updateProfileField('contact_phone', event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <button
              type="submit"
              disabled={saveProfileMutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveProfileMutation.isPending ? 'Saving...' : 'Save profile'}
            </button>

            {profileNotice && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{profileNotice}</p>
            )}
          </div>
        </form>
      </section>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span>Store owner permissions are enforced on the backend.</span>
      </div>
    </div>
  );
};
