import api from './api';

export async function getNotifications(params = {}) {
  const response = await api.get('/notifications', { params });
  return response.data;
}

export async function getUnreadCount() {
  const response = await api.get('/notifications/unread-count');
  return response.data?.unreadCount ?? 0;
}

export async function markNotificationRead(notificationId) {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch('/notifications/read-all');
  return response.data;
}
