import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

/**
 * Configure Helmet with secure HTTP headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

/**
 * Configure CORS locked to verified client origins
 */
export const corsMiddleware = cors({
  origin: [CLIENT_URL, 'http://127.0.0.1:3000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Token'],
  credentials: true
});

/**
 * NoSQL Injection Protection: sanitizes req.body, req.query, and req.params
 * Prohibits MongoDB operator keys ($gt, $ne, etc.) from being injected by attackers
 */
export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_'
});

/**
 * General API Rate Limiter
 */
export const generalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000), // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX || 500),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP address. Please try again later.'
  }
});

/**
 * Strict Authentication Rate Limiter
 * Mitigates brute-force credential stuffing and password guessing attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  }
});
