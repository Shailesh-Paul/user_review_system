import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead
} from '../../lib/notifications';

const formatRelativeTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date);
};

const typeLabel = {
  NEW_REVIEW: 'Review',
  NEW_RATING: 'Rating',
  STORE_ASSIGNMENT: 'Store'
};

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const unreadQuery = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: getUnreadCount,
    refetchInterval: 60000,
    staleTime: 30000
  });

  const listQuery = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => getNotifications({ limit: 15 }),
    enabled: open
  });

  const unreadCount = unreadQuery.data ?? 0;
  const notifications = listQuery.data?.data ?? [];

  const readOneMutation = useMutation({
    mutationFn: (id) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  });

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleItemClick = (notification) => {
    if (!notification.is_read) {
      readOneMutation.mutate(notification.id);
    }
  };

  return (
    <div ref={containerRef} className="notification-bell relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="notification-trigger pressable relative flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-panel" role="menu" aria-label="Notifications">
          <div className="notification-panel-header">
            <span className="notification-panel-title">Notifications</span>
            <button
              type="button"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending || unreadCount === 0}
              className="notification-mark-all pressable inline-flex items-center gap-1 text-xs font-semibold disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all read
            </button>
          </div>

          <div className="notification-list">
            {listQuery.isLoading && (
              <div className="notification-empty">Loading notifications…</div>
            )}

            {listQuery.isError && (
              <div className="notification-empty">Unable to load notifications right now.</div>
            )}

            {!listQuery.isLoading && !listQuery.isError && notifications.length === 0 && (
              <div className="notification-empty">You&apos;re all caught up.</div>
            )}

            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleItemClick(notification)}
                className={`notification-item ${notification.is_read ? 'is-read' : 'is-unread'}`}
                role="menuitem"
              >
                <span className="notification-item-top">
                  <span className="notification-item-title">{notification.title}</span>
                  {!notification.is_read && <span className="notification-dot" aria-label="Unread" />}
                </span>
                <span className="notification-item-message">{notification.message}</span>
                <span className="notification-item-meta">
                  <span className="notification-type-pill">{typeLabel[notification.type] ?? 'Update'}</span>
                  <span>{formatRelativeTime(notification.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
