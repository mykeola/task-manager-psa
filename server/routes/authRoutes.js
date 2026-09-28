import express from 'express';
import {
  register,
  login,
  refreshToken,
  getMe,
  createOrganization,
  switchOrganization
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshToken);
router.get('/me', authenticate, getMe);
router.post('/organizations', authenticate, createOrganization);
router.post('/switch-organization', authenticate, switchOrganization);

export default router;
