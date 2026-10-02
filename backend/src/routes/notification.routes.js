import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead
} from '../controllers/notification.controller.js';

const router = Router();

// Every authenticated role (ADMIN, STORE_OWNER, USER) may manage their own notifications.
router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markNotificationRead);

export default router;
