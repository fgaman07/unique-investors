import express from 'express';
import { getCommissions, getDownline, getDirectMembers, getTree, getAllCommissions, releaseCommission, getUserSummary, getDirectMembersWithVolume, getAllLegReport } from './mlm.controller.js';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';
const router = express.Router();
// Agent routes
router.get('/summary', protect, getUserSummary);
router.get('/commissions', protect, getCommissions);
router.get('/downline', protect, getDownline);
router.get('/direct-members', protect, getDirectMembers);
router.get('/direct-members-with-volume', protect, getDirectMembersWithVolume);
router.get('/all-leg', protect, getAllLegReport);
router.get('/tree', protect, getTree);
// Admin routes
router.get('/all-commissions', protect, adminOnly, getAllCommissions);
router.put('/commissions/:id/release', protect, adminOnly, releaseCommission);
export default router;
