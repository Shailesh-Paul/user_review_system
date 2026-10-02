import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import {
  getDashboardStats,
  getUsers,
  createUser,
  createStoreOwner,
  getStoreOwners,
  getStores,
  getReviews,
  createStore
} from '../controllers/admin.controller.js';

const router = Router();

// Protect all admin routes with authentication and ADMIN role requirement
router.use(requireAuth, requireRole('ADMIN'));

router.get('/dashboard/stats', getDashboardStats);

router.get('/users', getUsers);
router.post('/users', createUser);
router.post('/store-owners', createStoreOwner);
router.get('/store-owners', getStoreOwners);

router.get('/stores', getStores);
router.get('/reviews', getReviews);
router.post('/stores', createStore);

export default router;
