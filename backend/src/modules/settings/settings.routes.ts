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

router.get('/company', protect, adminOnly, getCompanySettings);
router.put('/company', protect, adminOnly, updateCompanySettings);
router.get('/mlm', protect, adminOnly, getCommissionSettings);
router.put('/mlm', protect, adminOnly, updateCommissionSettings);
router.post('/mlm/recalculate', protect, adminOnly, recalculateCommissionLedger);

export default router;
