import express from 'express';
import { getUsers, createUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

router.use(authenticate);
router.use(tenantScope);

router.get('/', getUsers);
router.post('/', authorize('superadmin', 'admin'), createUser);

export default router;
