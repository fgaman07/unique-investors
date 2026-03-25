import express from 'express';
import { createSale, getSales, getEMIs, payEMI } from './sales.controller.js';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, adminOnly, createSale)
  .get(protect, getSales);

router.get('/emis', protect, getEMIs);
router.post('/emi', protect, payEMI);

export default router;
