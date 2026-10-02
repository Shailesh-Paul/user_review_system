import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, RotateCcw, Search, Store } from 'lucide-react';
import { getStores } from '../../lib/stores';
import { getApiErrorMessage } from '../../lib/api';
import { StoreCard } from '../../components/stores/StoreCard';
import { StoreCardSkeleton } from '../../components/stores/StoreCardSkeleton';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'rating-desc', sort: 'rating', order: 'desc', label: 'Highest rated' },
  { value: 'created_at-desc', sort: 'created_at', order: 'desc', label: 'Newest' },
  { value: 'name-asc', sort: 'name', order: 'asc', label: 'Name (A–Z)' },
  { value: 'name-desc', sort: 'name', order: 'desc', label: 'Name (Z–A)' }
];

const parsePage = (value) => {
  const page = parseInt(value || '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

export const UserStoresPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const nameParam = searchParams.get('name') || '';
  const addressParam = searchParams.get('address') || '';
  const minRatingParam = searchParams.get('minRating') || '';
  const maxRatingParam = searchParams.get('maxRating') || '';
  const sortParam = searchParams.get('sort') || 'rating';
  const orderParam = searchParams.get('order') || 'desc';
  const pageParam = parsePage(searchParams.get('page'));

  const [nameDraft, setNameDraft] = useState(null);
  const [addressDraft, setAddressDraft] = useState(null);
  const nameInput = nameDraft ?? nameParam;
  const addressInput = addressDraft ?? addressParam;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameDraft === null || nameDraft.trim() === nameParam) return;
      const next = new URLSearchParams(searchParams);
      if (nameDraft.trim()) next.set('name', nameDraft.trim());
      else next.delete('name');
      next.set('page', '1');
      setSearchParams(next, { replace: true });
      setNameDraft(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [nameDraft, nameParam, searchParams, setSearchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (addressDraft === null || addressDraft.trim() === addressParam) return;
      const next = new URLSearchParams(searchParams);
      if (addressDraft.trim()) next.set('address', addressDraft.trim());
      else next.delete('address');
      next.set('page', '1');
      setSearchParams(next, { replace: true });
      setAddressDraft(null);
    }, 400);
    return () => clearTimeout(timer);
  }, [addressDraft, addressParam, searchParams, setSearchParams]);

  const sortKey = useMemo(() => {
    const match = SORT_OPTIONS.find((opt) => opt.sort === sortParam && opt.order === orderParam);
    return match?.value || 'rating-desc';
  }, [sortParam, orderParam]);

  const queryParams = useMemo(() => {
    const params = {
      page: pageParam,
      limit: PAGE_SIZE,
      sort: sortParam,
      order: orderParam
    };
    if (nameParam) params.name = nameParam;
    if (addressParam) params.address = addressParam;
    if (minRatingParam) params.minRating = minRatingParam;
    if (maxRatingParam) params.maxRating = maxRatingParam;
    return params;
  }, [nameParam, addressParam, minRatingParam, maxRatingParam, sortParam, orderParam, pageParam]);

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['stores', queryParams],
    queryFn: () => getStores(queryParams),
    placeholderData: (previous) => previous
  });

  const stores = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const currentPage = pagination?.page ?? pageParam;

  const hasActiveFilters =
    Boolean(nameParam || addressParam || minRatingParam || maxRatingParam) ||
    sortParam !== 'rating' ||
    orderParam !== 'desc';

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setNameDraft('');
    setAddressDraft('');
    setSearchParams({}, { replace: true });
  };

  const goToPage = (page) => {
    updateParams({ page: Math.max(1, Math.min(page, totalPages)) });
  };

  return (
    <div className="discovery-page page-enter space-y-6">
      <header className="discovery-heading">
        <p className="eyebrow">The local directory</p>
        <h1 className="editorial-title text-3xl text-slate-900 sm:text-4xl">
          Find your next favorite.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Browse neighborhood stores, compare real customer ratings, and read recent experiences before you visit.
        </p>
      </header>

      <section
        aria-label="Search and filters"
        className="store-filter-bar grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
      >
        <div className="md:col-span-2 relative">
          <label htmlFor="store-name-search" className="sr-only">
            Search by store name
          </label>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="store-name-search"
            type="search"
            value={nameInput}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Search by store name"
            autoComplete="off"
            className="filter-control w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="relative">
          <label htmlFor="store-location-filter" className="sr-only">
            Filter by location or address
          </label>
          <input
            id="store-location-filter"
            type="search"
            value={addressInput}
            onChange={(e) => setAddressDraft(e.target.value)}
            placeholder="Location / address"
            autoComplete="off"
            className="filter-control w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <label htmlFor="min-rating-filter" className="sr-only">
              Minimum average rating
            </label>
            <select
              id="min-rating-filter"
              value={minRatingParam}
              onChange={(e) => updateParams({ minRating: e.target.value || null, page: 1 })}
              className="filter-control w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any rating</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="sort-stores" className="sr-only">
              Sort stores
            </label>
            <select
              id="sort-stores"
              value={sortKey}
              onChange={(e) => {
                const selected = SORT_OPTIONS.find((opt) => opt.value === e.target.value);
                if (!selected) return;
                updateParams({ sort: selected.sort, order: selected.order, page: 1 });
              }}
              className="filter-control w-full px-3 py-2.5 text-sm border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="pressable inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Clear filters
          </button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <StoreCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div
          role="alert"
          className="state-message flex flex-col gap-4 border-l-2 border-red-500 bg-red-50/70 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3 flex-1">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Could not load stores</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {getApiErrorMessage(error, 'Please try again in a moment.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="pressable rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && stores.length === 0 && (
        <div className="empty-state px-4 py-14 text-center">
          <Store className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden="true" />
          <h2 className="editorial-title text-xl text-slate-900">No stores found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            {hasActiveFilters
              ? 'Try adjusting your search or filters to find more stores.'
              : 'There are no stores listed yet. Check back soon.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="pressable mt-4 inline-flex items-center gap-1.5 rounded-md border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && stores.length > 0 && (
        <>
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm text-slate-500">
            <p>
              {pagination?.total != null ? (
                <>
                  Showing page {currentPage} of {totalPages} ({pagination.total} store
                  {pagination.total === 1 ? '' : 's'})
                </>
              ) : (
                <>Page {currentPage}</>
              )}
            </p>
            {isFetching && !isLoading && <span aria-live="polite">Updating…</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Store list pagination" className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                Previous
              </button>
              <span className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Next
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};
