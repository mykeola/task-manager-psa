import express from 'express';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectForecast
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);
router.use(tenantScope);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.get('/:id/forecast', getProjectForecast);
router.post('/', authorize('superadmin', 'admin', 'manager'), createProject);
router.put('/:id', authorize('superadmin', 'admin', 'manager'), updateProject);
router.delete('/:id', authorize('superadmin', 'admin'), deleteProject);

export default router;
