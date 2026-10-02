import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import {
  getStores,
  getStoreById,
  submitRating,
  updateRating,
  getMyRating,
  getMyProfile,
  updateMyProfile,
  uploadMedia,
  deleteMedia,
  getStoreRatings,
  generateAiReviewDraft
} from '../controllers/user.controller.js';
import { upload } from '../utils/cloudinary.js';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Protect all user routes with authentication and USER role requirement
router.use(requireAuth, requireRole('USER'));

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);

router.get('/stores', getStores);
router.get('/stores/:storeId', getStoreById);

router.get('/stores/:storeId/ratings', getStoreRatings);
router.post('/stores/:storeId/ratings', submitRating);
router.patch('/stores/:storeId/ratings', updateRating);
router.get('/stores/:storeId/ratings/me', getMyRating);

router.post('/stores/:storeId/ratings/review/ai', aiRateLimiter, generateAiReviewDraft);

router.post('/stores/:storeId/ratings/media', upload.single('media'), uploadMedia);
router.delete('/stores/:storeId/ratings/media/:mediaId', deleteMedia);

export default router;
