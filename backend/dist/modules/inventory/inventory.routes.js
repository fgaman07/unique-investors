import express from 'express';
import { addBlock, createProject, createProperty, getProjects, getProperties, updateProject, updateProperty, } from './inventory.controller.js';
import { protect, adminOnly } from '../../middleware/authMiddleware.js';
const router = express.Router();
router.route('/projects')
    .post(protect, adminOnly, createProject)
    .get(protect, getProjects);
router.put('/projects/:id', protect, adminOnly, updateProject);
router.post('/blocks', protect, adminOnly, addBlock);
router.route('/properties')
    .post(protect, adminOnly, createProperty)
    .get(protect, getProperties);
router.put('/properties/:id', protect, adminOnly, updateProperty);
export default router;
