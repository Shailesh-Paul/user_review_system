import pool from '../config/db.js';

/**
 * Phase 17 — Notification API.
 *
 * Every handler derives the recipient from the authenticated user (req.user.id)
 * set by the auth middleware. A user_id is never read from the request body or
 * query string, so one user can never read or modify another user's
 * notifications.
 */

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const unreadOnly = String(req.query.unreadOnly ?? '') === 'true';

    const whereClause = unreadOnly
      ? 'user_id = ? AND is_read = FALSE'
      : 'user_id = ?';

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      [req.user.id]
    );

    const [rows] = await pool.query(
      `SELECT id, type, title, message, entity_type, entity_id, is_read, created_at
       FROM notifications
       WHERE ${whereClause}
       ORDER BY is_read ASC, created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, limit, offset]
    );

    const [[{ unreadCount }]] = await pool.query(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      data: rows.map((row) => ({ ...row, is_read: Boolean(row.is_read) })),
      unreadCount: Number(unreadCount ?? 0),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const [[{ unreadCount }]] = await pool.query(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({ success: true, unreadCount: Number(unreadCount ?? 0) });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const notificationId = Number(req.params.id);
    if (Number.isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: 'Invalid notification id.' });
    }

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (result.affectedRows === 0) {
      // Either the notification does not exist or it belongs to another user.
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    next(err);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.',
      updated: result.affectedRows
    });
  } catch (err) {
    next(err);
  }
};
