import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'API is running successfully',
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'API is running, but the database is unavailable',
      database: 'disconnected'
    });
  }
});

export default router;
