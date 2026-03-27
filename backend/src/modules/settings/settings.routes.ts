import express from 'express';
import {
  getCommissionSettings,
  getCompanySettings,
  recalculateCommissionLedger,
  updateCommissionSettings,
  updateCompanySettings,
} from './settings.controller.js';
import { adminOnly, protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Allow any logged-in user to view company settings (needed for Welcome Letter template)
router.get('/company', protect, getCompanySettings);
router.put('/company', protect, adminOnly, updateCompanySettings);
router.get('/mlm', protect, adminOnly, getCommissionSettings);
router.put('/mlm', protect, adminOnly, updateCommissionSettings);
router.post('/mlm/recalculate', protect, adminOnly, recalculateCommissionLedger);

export default router;
