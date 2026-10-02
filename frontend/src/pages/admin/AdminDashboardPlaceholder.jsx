import { Fragment, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Store, BarChart3, Building2, Star, TrendingUp, Plus, MapPin, Mail, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import api, { getApiErrorMessage } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { getPlatformAnalytics, ANALYTICS_RANGES, rangeLabelFor } from '../../lib/analytics';
import { TrendLineChart, SimpleBarList } from '../../components/analytics/AnalyticsCharts';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date);
};

const meetsPasswordRequirements = (password) =>
  password.length >= 8 &&
  password.length <= 16 &&
  /[A-Z]/.test(password) &&
  /[^A-Za-z0-9\s]/.test(password);

const SortableHeader = ({ label, field, sort, order, onSort }) => (
  <th className="px-3 py-2 text-left font-medium">
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 rounded text-slate-600 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={`Sort by ${label} ${sort === field && order === 'asc' ? 'descending' : 'ascending'}`}
    >
      {label}
      <span aria-hidden="true">{sort === field ? (order === 'asc' ? '↑' : '↓') : '↕'}</span>
    </button>
  </th>
);

export const AdminDashboardPlaceholder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', role: 'USER' });
  const [storeForm, setStoreForm] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [userFilters, setUserFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });
  const [userSort, setUserSort] = useState('name');
  const [userOrder, setUserOrder] = useState('asc');
  const [storeSort, setStoreSort] = useState('name');
  const [storeOrder, setStoreOrder] = useState('asc');
  const [userPage, setUserPage] = useState(1);
  const [storePage, setStorePage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState('30d');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard', userFilters, userSort, userOrder, userPage, storeFilters, storeSort, storeOrder, storePage],
    queryFn: async () => {
      const [statsResponse, usersResponse, storeOwnersResponse, storesResponse, reviewsResponse] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/users', { params: { ...userFilters, limit: 10, page: userPage, sort: userSort, order: userOrder } }),
        api.get('/admin/store-owners', { params: { limit: 100, page: 1 } }),
        api.get('/admin/stores', { params: { ...storeFilters, limit: 10, page: storePage, sort: storeSort, order: storeOrder } }),
        api.get('/admin/reviews', { params: { limit: 5, page: 1 } })
      ]);

      return {
        stats: statsResponse.data?.data ?? {},
        users: usersResponse.data?.data ?? [],
        storeOwners: storeOwnersResponse.data?.data ?? [],
        stores: storesResponse.data?.data ?? [],
        usersPagination: usersResponse.data?.pagination ?? null,
        storesPagination: storesResponse.data?.pagination ?? null,
        reviews: reviewsResponse.data?.data ?? []
      };
    }
  });

  const analyticsQuery = useQuery({
    queryKey: ['admin-analytics', analyticsRange],
    queryFn: () => getPlatformAnalytics(analyticsRange),
    keepPreviousData: true
  });

  const handleCreateUser = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 20 || form.name.trim().length > 60) {
      toast.error('Name must be between 20 and 60 characters.');
      return;
    }
    if ((form.role !== 'STORE_OWNER' || form.password) && !meetsPasswordRequirements(form.password)) {
      toast.error('Password must be 8–16 characters and include an uppercase letter and a special character.');
      return;
    }
    setSubmitting(true);

    try {
      const isStoreOwner = form.role === 'STORE_OWNER';
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const response = await api.post(isStoreOwner ? '/admin/store-owners' : '/admin/users', payload);
      const temporaryPassword = response.data?.temporaryPassword;
      if (temporaryPassword) {
        toast.success(`Store owner created. Temporary password: ${temporaryPassword}`, { duration: 15000 });
      } else {
        toast.success(`${form.role === 'ADMIN' ? 'Admin' : 'User'} created successfully.`);
      }
      setForm({ name: '', email: '', password: '', address: '', role: 'USER' });
      await queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to create the account.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStore = async (event) => {
    event.preventDefault();
    setCreatingStore(true);
    try {
      await api.post('/admin/stores', {
        ...storeForm,
        ownerId: Number(storeForm.ownerId)
      });
      toast.success('Store created and assigned successfully.');
      setStoreForm({ name: '', email: '', address: '', ownerId: '' });
      await queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to create the store.'));
    } finally {
      setCreatingStore(false);
    }
  };

  const toggleSort = (field, currentSort, currentOrder, setSort, setOrder, setPage) => {
    if (currentSort === field) setOrder(currentOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSort(field);
      setOrder('asc');
    }
    setPage(1);
  };

  const stats = data?.stats ?? {};
  const users = data?.users ?? [];
  const storeOwners = data?.storeOwners ?? [];
  const stores = data?.stores ?? [];
  const reviews = data?.reviews ?? [];
  const analytics = analyticsQuery.data ?? null;
  const analyticsRangeLabel = rangeLabelFor(analyticsRange);

  return (
    <div className="admin-dashboard page-enter space-y-6">
      <div className="admin-dashboard-heading flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow mb-1">Administration</p>
          <h1 className="editorial-title flex items-center gap-2 text-3xl text-slate-900">
            <Shield className="h-6 w-6 text-indigo-600" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            System overview and operational status for {user?.name || 'the admin'}
          </p>
        </div>
        <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Live platform data
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {getApiErrorMessage(error, 'Unable to load admin dashboard data.')}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Users</span>
            <Users className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{isLoading ? '…' : stats.totalUsers ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Store Owners</span>
            <Building2 className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{isLoading ? '…' : stats.totalStoreOwners ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Stores</span>
            <Store className="h-5 w-5 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{isLoading ? '…' : stats.totalStores ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Submitted ratings</span>
            <BarChart3 className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{isLoading ? '…' : stats.totalReviews ?? 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-slate-500">Avg. Rating</span>
            <Star className="h-5 w-5 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">{isLoading ? '…' : Number(stats.averageRating ?? 0).toFixed(1)}</p>
        </div>
      </div>

      <section className="admin-analytics rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Platform analytics</h2>
            <p className="text-sm text-slate-600">Descriptive platform-wide metrics for the selected period</p>
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
          <div className="analytics-empty">Unable to load platform analytics right now.</div>
        )}

        {analytics && !analyticsQuery.isError && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total customers</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.summary.totalCustomers}</p>
              </div>
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total store owners</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.summary.totalStoreOwners}</p>
              </div>
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total products</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.summary.totalProducts}</p>
              </div>
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">Average platform rating</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.summary.averagePlatformRating.toFixed(1)}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">New users · {analyticsRangeLabel}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.rangeActivity.newUsers}</p>
              </div>
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">New stores · {analyticsRangeLabel}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.rangeActivity.newStores}</p>
              </div>
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">New ratings · {analyticsRangeLabel}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.rangeActivity.newRatings}</p>
              </div>
              <div className="admin-stat-metric">
                <p className="text-xs uppercase tracking-wide text-slate-500">New reviews · {analyticsRangeLabel}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{analytics.rangeActivity.newReviews}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="analytics-block">
                <h3 className="analytics-block-title">Rating distribution</h3>
                <SimpleBarList
                  items={[5, 4, 3, 2, 1].map((score) => ({
                    label: `${score}★`,
                    value: Number(analytics.distribution[String(score)] ?? 0)
                  }))}
                />
              </div>

              <div className="analytics-block">
                <h3 className="analytics-block-title">Platform activity</h3>
                <TrendLineChart
                  data={analytics.activityOverTime}
                  valueKey="ratings"
                  caption="Ratings received per period"
                />
              </div>

              <div className="analytics-block lg:col-span-2">
                <h3 className="analytics-block-title">Most reviewed stores</h3>
                {analytics.mostReviewedStores.length === 0 ? (
                  <div className="analytics-empty">No store reviews yet.</div>
                ) : (
                  <div className="analytics-table-wrap">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Store</th>
                          <th>Location</th>
                          <th>Reviews</th>
                          <th>Ratings</th>
                          <th>Avg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.mostReviewedStores.map((row) => (
                          <tr key={row.id}>
                            <td>{row.name}</td>
                            <td>{row.city ? `${row.city}${row.state ? `, ${row.state}` : ''}` : '—'}</td>
                            <td>{row.reviewCount}</td>
                            <td>{row.ratingCount}</td>
                            <td>{row.averageRating.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="analytics-block">
                <h3 className="analytics-block-title">Stores by category</h3>
                <SimpleBarList
                  items={analytics.storesByCategory.map((entry) => ({ label: entry.category, value: entry.stores }))}
                />
              </div>

              <div className="analytics-block">
                <h3 className="analytics-block-title">Products by category</h3>
                <SimpleBarList
                  items={analytics.productsByCategory.map((entry) => ({ label: entry.category, value: entry.products }))}
                />
              </div>
            </div>
          </>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-slate-900">Platform summary</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Admins</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalAdmins ?? 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Customers</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalCustomers ?? 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Store owners</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalStoreOwners ?? 0}</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
            Supported admin data sources are currently users, store owners, stores, and review ratings. Product catalog tables are not present in the current schema, so this dashboard intentionally avoids inventing unsupported records.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-slate-900">Create account</h2>
          </div>

          <form className="space-y-3" onSubmit={handleCreateUser}>
            <label className="block text-xs font-medium text-slate-600" htmlFor="admin-account-role">Account role</label>
            <select
              id="admin-account-role"
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="USER">Normal user</option>
              <option value="ADMIN">Administrator</option>
              <option value="STORE_OWNER">Store owner</option>
            </select>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name (20–60 characters)"
              minLength={20}
              maxLength={60}
              aria-label="Full name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              required
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              aria-label="Email address"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              required
            />
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder={form.role === 'STORE_OWNER' ? 'Password (blank generates a temporary one)' : 'Password'}
              minLength={form.role === 'STORE_OWNER' && !form.password ? undefined : 8}
              maxLength={16}
              aria-label="Password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              required={form.role !== 'STORE_OWNER'}
            />
            <p className="text-xs text-slate-500">8–16 characters, including an uppercase letter and a special character.</p>
            <textarea
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              placeholder="Address"
              maxLength={400}
              aria-label="Address"
              rows="3"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {submitting ? 'Creating...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-sky-600" />
          <h2 className="text-lg font-semibold text-slate-900">Add a store</h2>
        </div>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleCreateStore}>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Store name
            <input
              value={storeForm.name}
              onChange={(event) => setStoreForm((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Email
            <input
              type="email"
              value={storeForm.email}
              onChange={(event) => setStoreForm((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Address
            <input
              value={storeForm.address}
              onChange={(event) => setStoreForm((current) => ({ ...current, address: event.target.value }))}
              maxLength={400}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              required
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Assign store owner
            <select
              value={storeForm.ownerId}
              onChange={(event) => setStoreForm((current) => ({ ...current, ownerId: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              required
            >
              <option value="">Select an owner</option>
              {storeOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>{owner.name} — {owner.email}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={creatingStore || storeOwners.length === 0}
            className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2 xl:col-span-4"
          >
            {creatingStore ? 'Creating store…' : 'Create store'}
          </button>
          {storeOwners.length === 0 && (
            <p className="text-sm text-amber-700 md:col-span-2 xl:col-span-4">Create a store-owner account before adding a store.</p>
          )}
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Users and store owners</h2>
            <p className="text-sm text-slate-500">Search by name, email, address, or role. Select a store owner to see their stores and ratings.</p>
          </div>
          <label className="text-xs font-medium text-slate-600">
            Role
            <select
              value={userFilters.role}
              onChange={(event) => {
                setUserFilters((current) => ({ ...current, role: event.target.value }));
                setUserPage(1);
              }}
              className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="">All roles</option>
              <option value="USER">Normal user</option>
              <option value="ADMIN">Admin</option>
              <option value="STORE_OWNER">Store owner</option>
            </select>
          </label>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {['name', 'email', 'address'].map((field) => (
            <label key={field} className="text-xs font-medium capitalize text-slate-600">
              {field}
              <input
                value={userFilters[field]}
                onChange={(event) => {
                  setUserFilters((current) => ({ ...current, [field]: event.target.value }));
                  setUserPage(1);
                }}
                placeholder={`Search ${field}`}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <SortableHeader label="Name" field="name" sort={userSort} order={userOrder} onSort={(field) => toggleSort(field, userSort, userOrder, setUserSort, setUserOrder, setUserPage)} />
                <SortableHeader label="Email" field="email" sort={userSort} order={userOrder} onSort={(field) => toggleSort(field, userSort, userOrder, setUserSort, setUserOrder, setUserPage)} />
                <SortableHeader label="Address" field="address" sort={userSort} order={userOrder} onSort={(field) => toggleSort(field, userSort, userOrder, setUserSort, setUserOrder, setUserPage)} />
                <SortableHeader label="Role" field="role" sort={userSort} order={userOrder} onSort={(field) => toggleSort(field, userSort, userOrder, setUserSort, setUserOrder, setUserPage)} />
                <th className="px-3 py-2 text-left font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">No users match these filters.</td></tr>
              ) : users.map((entry) => (
                <Fragment key={entry.id}>
                  <tr className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium text-slate-800">{entry.name}</td>
                    <td className="px-3 py-3 text-slate-600">{entry.email}</td>
                    <td className="px-3 py-3 text-slate-600">{entry.address || '—'}</td>
                    <td className="px-3 py-3 text-slate-600">{entry.role}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUserId((current) => current === entry.id ? null : entry.id)}
                        className="font-medium text-indigo-700 hover:text-indigo-900"
                      >
                        {selectedUserId === entry.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {selectedUserId === entry.id && (
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td colSpan={5} className="px-4 py-4">
                        <p className="font-semibold text-slate-800">{entry.name}</p>
                        <p className="text-sm text-slate-600">{entry.email} · {entry.address || 'No address provided'} · {entry.role}</p>
                        {entry.role === 'STORE_OWNER' && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-slate-700">Owned stores and ratings</p>
                            {(entry.stores ?? []).length === 0 ? (
                              <p className="text-sm text-slate-500">No stores assigned.</p>
                            ) : entry.stores.map((ownedStore) => (
                              <div key={ownedStore.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                                <p className="font-medium text-slate-800">{ownedStore.name} · {ownedStore.averageRating.toFixed(1)}/5 ({ownedStore.totalRatings} ratings)</p>
                                <p className="text-slate-600">{ownedStore.email} · {ownedStore.address}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {data?.usersPagination && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>{data.usersPagination.total} users · page {data.usersPagination.page} of {Math.max(data.usersPagination.totalPages, 1)}</span>
            <div className="flex gap-2">
              <button type="button" disabled={userPage <= 1} onClick={() => setUserPage((current) => current - 1)} className="rounded border px-3 py-2 disabled:opacity-50" aria-label="Previous users page"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" disabled={userPage >= data.usersPagination.totalPages} onClick={() => setUserPage((current) => current + 1)} className="rounded border px-3 py-2 disabled:opacity-50" aria-label="Next users page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Stores</h2>
          <p className="text-sm text-slate-500">Filter stores by name, email, or address.</p>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {['name', 'email', 'address'].map((field) => (
            <label key={field} className="text-xs font-medium capitalize text-slate-600">
              {field}
              <input
                value={storeFilters[field]}
                onChange={(event) => {
                  setStoreFilters((current) => ({ ...current, [field]: event.target.value }));
                  setStorePage(1);
                }}
                placeholder={`Search ${field}`}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <SortableHeader label="Store name" field="name" sort={storeSort} order={storeOrder} onSort={(field) => toggleSort(field, storeSort, storeOrder, setStoreSort, setStoreOrder, setStorePage)} />
                <SortableHeader label="Email" field="email" sort={storeSort} order={storeOrder} onSort={(field) => toggleSort(field, storeSort, storeOrder, setStoreSort, setStoreOrder, setStorePage)} />
                <SortableHeader label="Address" field="address" sort={storeSort} order={storeOrder} onSort={(field) => toggleSort(field, storeSort, storeOrder, setStoreSort, setStoreOrder, setStorePage)} />
                <SortableHeader label="Rating" field="rating" sort={storeSort} order={storeOrder} onSort={(field) => toggleSort(field, storeSort, storeOrder, setStoreSort, setStoreOrder, setStorePage)} />
                <th className="px-3 py-2 text-left font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {stores.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">No stores match these filters.</td></tr>
              ) : stores.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium text-slate-800">{entry.name}</td>
                  <td className="px-3 py-3 text-slate-600">{entry.email}</td>
                  <td className="px-3 py-3 text-slate-600">{entry.address}</td>
                  <td className="px-3 py-3 text-slate-600">{entry.averageRating.toFixed(1)} / 5 · {entry.totalRatings} ratings</td>
                  <td className="px-3 py-3 text-slate-600">{entry.owner_name || 'Unassigned owner'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data?.storesPagination && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>{data.storesPagination.total} stores · page {data.storesPagination.page} of {Math.max(data.storesPagination.totalPages, 1)}</span>
            <div className="flex gap-2">
              <button type="button" disabled={storePage <= 1} onClick={() => setStorePage((current) => current - 1)} className="rounded border px-3 py-2 disabled:opacity-50" aria-label="Previous stores page"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" disabled={storePage >= data.storesPagination.totalPages} onClick={() => setStorePage((current) => current + 1)} className="rounded border px-3 py-2 disabled:opacity-50" aria-label="Next stores page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-900">Recent users</h2>
            </div>
            <span className="text-xs text-slate-500">{users.length} shown on this filtered page</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 pr-3 font-medium">Name</th>
                  <th className="pb-2 pr-3 font-medium">Role</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-4 text-slate-500">No users found.</td>
                  </tr>
                ) : (
                  users.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-3">
                        <div className="font-medium text-slate-800">{entry.name}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Mail className="h-3 w-3" />
                          {entry.email}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-slate-600">{entry.role}</td>
                      <td className="py-3 text-slate-600">{formatDate(entry.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-semibold text-slate-900">Store owners</h2>
            </div>
            <span className="text-xs text-slate-500">Top 5</span>
          </div>

          <div className="space-y-3">
            {storeOwners.length === 0 ? (
              <p className="text-sm text-slate-500">No store owners found.</p>
            ) : (
              storeOwners.slice(0, 5).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{entry.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <Mail className="h-3 w-3" />
                        {entry.email}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                      {entry.role}
                    </span>
                  </div>
                  {entry.address && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {entry.address}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-sky-500" />
            <h2 className="text-lg font-semibold text-slate-900">Stores</h2>
          </div>

          <div className="space-y-3">
            {stores.length === 0 ? (
              <p className="text-sm text-slate-500">No stores found.</p>
            ) : (
              stores.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{entry.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.owner_name || 'Unassigned owner'}</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(entry.created_at)}</span>
                  </div>
                  {entry.address && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {entry.address}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-slate-900">Latest reviews</h2>
          </div>

          <div className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews found.</p>
            ) : (
              reviews.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{entry.store_name || 'Store review'}</p>
                      <p className="text-xs text-slate-500">by {entry.user_name || 'anonymous user'}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                      {entry.rating}/5
                    </span>
                  </div>
                  {entry.review && <p className="mt-2 text-sm text-slate-600">“{entry.review}”</p>}
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(entry.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
