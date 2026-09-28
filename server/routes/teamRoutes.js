import express from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam
} from '../controllers/teamController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);
router.use(tenantScope);

router.get('/', getTeams);
router.get('/:id', getTeamById);
router.post('/', authorize('superadmin', 'admin', 'manager'), createTeam);
router.put('/:id', authorize('superadmin', 'admin', 'manager'), updateTeam);
router.delete('/:id', authorize('superadmin', 'admin'), deleteTeam);

export default router;
