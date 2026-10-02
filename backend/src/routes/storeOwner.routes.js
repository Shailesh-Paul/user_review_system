import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import {
  getMyStoreInfo,
  getMyStoreList,
  updateMyStore,
  getStoreProducts,
  createStoreProduct,
  updateStoreProduct,
  deleteStoreProduct,
  getDashboardStats,
  getMyRatings,
  getStoreAnalytics
} from '../controllers/storeOwner.controller.js';

const router = Router();

// Protect all store-owner routes with authentication and STORE_OWNER role requirement
router.use(requireAuth, requireRole('STORE_OWNER'));

router.get('/stores', getMyStoreList);
router.get('/store', getMyStoreInfo);
router.patch('/store', updateMyStore);

router.get('/stores/:storeId/products', getStoreProducts);
router.post('/stores/:storeId/products', createStoreProduct);
router.patch('/stores/:storeId/products/:productId', updateStoreProduct);
router.delete('/stores/:storeId/products/:productId', deleteStoreProduct);

router.get('/dashboard', getDashboardStats);

router.get('/analytics', getStoreAnalytics);

router.get('/ratings', getMyRatings);

export default router;
