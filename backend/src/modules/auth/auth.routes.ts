import express from 'express';
import { createUser, getAllUsers, getProfile, login, register, updateUser, updateUserStatus, changePassword, updateProfile, adminResetPassword } from './auth.controller.js';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getProfile);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.post('/users', protect, adminOnly, createUser);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id', protect, adminOnly, updateUser);
router.patch('/users/:id/status', protect, adminOnly, updateUserStatus);
router.post('/users/:id/reset-password', protect, adminOnly, adminResetPassword);

export default router;
