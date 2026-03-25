import express from 'express';
import { getStats, getAdminStats } from './dashboard.controller.js';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';
const router = express.Router();
router.get('/stats', protect, getStats);
router.get('/admin-stats', protect, adminOnly, getAdminStats);
export default router;
