/**
 * Authentication Middleware
 * JWT and UAE Pass authentication with role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User.js';
import { createAuthenticationError, createAuthorizationError } from './errorHandler.js';
import { getSession } from '../services/redis-client.js';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      sessionId?: string;
    }
  }
}

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}

/**
 * Main authentication middleware
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw createAuthenticationError('Access token is required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check if session is still valid in Redis
    const sessionData = await getSession(decoded.sessionId);
    if (!sessionData) {
      throw createAuthenticationError('Session expired or invalid');
    }

    // Get user from database
    const user = await User.findById(decoded.userId).select('+password');
    if (!user || !user.isActive) {
      throw createAuthenticationError('User not found or inactive');
    }

    // Attach user and session to request
    req.user = user;
    req.sessionId = decoded.sessionId;

    // Update last seen in session
    await updateSessionActivity(decoded.sessionId);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createAuthenticationError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(createAuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware (for public endpoints that can benefit from user context)
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      const sessionData = await getSession(decoded.sessionId);
      
      if (sessionData) {
        const user = await User.findById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
          req.sessionId = decoded.sessionId;
        }
      }
    }
    
    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createAuthenticationError('Authentication required');
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.permissions.role)) {
      throw createAuthorizationError(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
    }

    next();
  };
};

/**
 * Feature-based authorization middleware
 */
export const requireFeature = (feature: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createAuthenticationError('Authentication required');
    }

    if (!req.user.permissions.features.includes(feature)) {
      throw createAuthorizationError(`Access denied. Required feature: ${feature}`);
    }

    next();
  };
};

/**
 * Organization access middleware
 */
export const requireOrganizationAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw createAuthenticationError('Authentication required');
  }

  const organizationId = req.params.organizationId || req.body.organizationId || req.query.organizationId;
  
  if (!organizationId) {
    throw createAuthorizationError('Organization ID is required');
  }

  // Check if user has access to this organization
  const hasAccess = req.user.permissions.organizations.some(
    orgId => orgId.toString() === organizationId
  ) || req.user.permissions.role === UserRole.ADMIN;

  if (!hasAccess) {
    throw createAuthorizationError('Access denied to this organization');
  }

  next();
};

/**
 * UAE Pass authentication middleware
 */
export const uaePassAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { uaePassToken } = req.body;
    
    if (!uaePassToken) {
      throw createAuthenticationError('UAE Pass token is required');
    }

    // Validate UAE Pass token with UAE Pass API
    const uaePassUser = await validateUAEPassToken(uaePassToken);
    
    if (!uaePassUser) {
      throw createAuthenticationError('Invalid UAE Pass token');
    }

    // Find or create user based on UAE Pass ID
    let user = await User.findOne({ uaePassId: uaePassUser.id });
    
    if (!user) {
      // Create new user from UAE Pass data
      user = new User({
        email: uaePassUser.email,
        uaePassId: uaePassUser.id,
        profile: {
          firstName: uaePassUser.firstName,
          lastName: uaePassUser.lastName,
          nationality: uaePassUser.nationality || 'AE',
          preferredLanguage: uaePassUser.language || 'en',
          emiratesId: uaePassUser.emiratesId,
          phoneNumber: uaePassUser.mobile,
          culturalPreferences: {
            prayerTimeAlerts: true,
            ramadanMode: true,
            holidayCalendars: ['AE'],
            workingDays: [1, 2, 3, 4, 5],
            workingHours: { start: '09:00', end: '17:00' },
            meetingDurationPreference: 60,
            timeZone: 'Asia/Dubai'
          }
        },
        isVerified: true // UAE Pass users are pre-verified
      });
      
      await user.save();
    } else {
      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verified user middleware (requires email verification)
 */
export const requireVerified = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw createAuthenticationError('Authentication required');
  }

  if (!req.user.isVerified) {
    throw createAuthorizationError('Email verification required');
  }

  next();
};

/**
 * Meeting access control middleware
 */
export const requireMeetingAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw createAuthenticationError('Authentication required');
  }

  if (!req.user.permissions.canCreateMeetings && req.method === 'POST') {
    throw createAuthorizationError('Meeting creation not permitted');
  }

  next();
};

/**
 * Rate limiting by user
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      throw createAuthenticationError('Authentication required');
    }

    const key = `rate_limit:${req.user._id}:${req.route?.path || req.path}`;
    
    // This would integrate with Redis rate limiting
    // Implementation depends on your rate limiting strategy
    
    next();
  };
};

/**
 * Extract token from request headers or cookies
 */
function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  const cookieToken = req.cookies?.accessToken;
  if (cookieToken) {
    return cookieToken;
  }

  // Check query parameter (for WebSocket connections)
  const queryToken = req.query.token as string;
  if (queryToken) {
    return queryToken;
  }

  return null;
}

/**
 * Update session activity timestamp
 */
async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    const sessionData = await getSession(sessionId);
    if (sessionData) {
      sessionData.lastActivity = new Date().toISOString();
      // Update session with extended TTL
const { setSession } = await import('../services/redis-client.js');
      await setSession(sessionId, sessionData, 86400); // 24 hours
    }
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}

/**
 * Validate UAE Pass token with UAE government API
 */
async function validateUAEPassToken(token: string): Promise<any> {
  try {
    // This would integrate with the actual UAE Pass API
    // For now, we'll simulate the validation
    
    if (process.env.NODE_ENV === 'development') {
      // Mock UAE Pass user for development
      return {
        id: '123456789012345',
        email: 'user@uaeworkhub.ae',
        firstName: 'Ahmed',
        lastName: 'Al Mansoori',
        nationality: 'AE',
        language: 'en',
        emiratesId: '784-1990-1234567-1',
        mobile: '+971501234567'
      };
    }

    // Production UAE Pass API integration would go here
    const response = await fetch(`${process.env.UAE_PASS_API_URL}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.UAE_PASS_CLIENT_SECRET}`
      },
      body: JSON.stringify({ token })
    });

    if (!response.ok) {
      return null;
    }

    const userData = await response.json();
    return userData;
    
  } catch (error) {
    console.error('UAE Pass validation error:', error);
    return null;
  }
}