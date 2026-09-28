import express from 'express';
import dotenv from 'dotenv';
import {
  helmetMiddleware,
  corsMiddleware,
  mongoSanitizeMiddleware,
  generalLimiter
} from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import userRoutes from './routes/userRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const app = express();

// Global Security Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' })); // Mitigates oversized payload DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitizeMiddleware);
app.use(generalLimiter);

// Liveness & API Health
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'psa-task-manager-backend',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit-logs', auditRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route '${req.originalUrl}' not found on this server.`
  });
});

// Global Centralized Error Handler
app.use(errorHandler);

export default app;
