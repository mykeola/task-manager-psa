import express from 'express';
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganizationStatus
} from '../controllers/orgController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);

// List organizations (superadmin sees all; admin/member sees own)
router.get('/', getOrganizations);

// Specific organization details
router.get('/:id', getOrganizationById);

// Superadmin-only management endpoints
router.post('/', authorize('superadmin'), createOrganization);
router.patch('/:id/status', authorize('superadmin'), updateOrganizationStatus);

export default router;
