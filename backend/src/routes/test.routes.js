import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Test route for Admin only
router.get('/admin', requireAuth, requireRole('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin' });
});

// Test route for Normal User only
router.get('/user', requireAuth, requireRole('USER'), (req, res) => {
  res.json({ success: true, message: 'Welcome User' });
});

// Test route for Store Owner only
router.get('/store-owner', requireAuth, requireRole('STORE_OWNER'), (req, res) => {
  res.json({ success: true, message: 'Welcome Store Owner' });
});

// Example route for multiple roles
router.get('/shared', requireAuth, requireRole('ADMIN', 'STORE_OWNER'), (req, res) => {
  res.json({ success: true, message: 'Welcome Admin or Store Owner' });
});

export default router;
