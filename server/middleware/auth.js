import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'psa_super_secret_jwt_access_token_key_2026_production_grade';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'psa_super_secret_jwt_refresh_token_key_2026_secure';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate short-lived JWT access token (15m)
 * Payload contains user ID, role, and organization reference.
 */
export const generateAccessToken = (user) => {
  let orgId = null;
  if (user.organization) {
    if (typeof user.organization === 'object' && user.organization._id) {
      orgId = user.organization._id.toString();
    } else {
      const orgStr = user.organization.toString();
      // Handle edge case where a populated doc was stringified into an object representation
      const match = orgStr.match(/[0-9a-fA-F]{24}/);
      orgId = match ? match[0] : orgStr;
    }
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organization: orgId,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Generate longer-lived refresh token (7d)
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

/**
 * Authentication Middleware:
 * Extracts, validates, and decodes the Bearer JWT token from the Authorization header.
 * Attaches verified user context to req.user.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Missing or malformed Authorization Bearer header.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Access token expired. Please refresh your session.'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token signature.'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Internal authentication error: ${error.message}`
    });
  }
};
