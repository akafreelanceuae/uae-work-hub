/**
 * Authentication Routes
 * Login, registration, UAE Pass integration, and session management
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { User, UserRole, UAENationality, LanguagePreference } from '../models/User.js';
import { setSession, deleteSession } from '../services/redis-client.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uaePassAuth, authMiddleware } from '../middleware/auth.js';
import { auditLog, piiProtection } from '../middleware/compliance.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  profile: z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    nationality: z.nativeEnum(UAENationality).default(UAENationality.OTHER),
    preferredLanguage: z.nativeEnum(LanguagePreference).default(LanguagePreference.ENGLISH),
    phoneNumber: z.string().optional(),
    companyName: z.string().optional(),
    jobTitle: z.string().optional()
  })
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const uaePassLoginSchema = z.object({
  uaePassToken: z.string().min(1, 'UAE Pass token is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

/**
 * Register new user
 * POST /api/auth/register
 */
router.post('/register', 
  piiProtection,
  auditLog('USER_REGISTRATION', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'User already exists with this email',
          messageAr: 'يوجد مستخدم بهذا البريد الإلكتروني بالفعل'
        }
      });
    }
    
    // Create new user
    const user = new User({
      email: validatedData.email,
      password: validatedData.password,
      profile: {
        ...validatedData.profile,
        culturalPreferences: {
          prayerTimeAlerts: true,
          ramadanMode: true,
          holidayCalendars: [validatedData.profile.nationality],
          workingDays: [1, 2, 3, 4, 5], // Monday to Friday
          workingHours: { start: '09:00', end: '17:00' },
          meetingDurationPreference: 60,
          timeZone: 'Asia/Dubai'
        }
      },
      permissions: {
        role: UserRole.USER,
        features: ['meetings', 'projects', 'cultural'],
        organizations: [],
        canCreateMeetings: true,
        canCreateProjects: true,
        canManageUsers: false,
        maxMeetingDuration: 240,
        storageQuota: 5 * 1024 * 1024 * 1024 // 5GB
      }
    });
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);
    
    // Set secure cookies
    setAuthCookies(res, accessToken, refreshToken);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          permissions: user.permissions,
          isVerified: user.isVerified
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '24h'
        }
      },
      message: 'User registered successfully',
      messageAr: 'تم تسجيل المستخدم بنجاح'
    });
  })
);

/**
 * Login with email and password
 * POST /api/auth/login
 */
router.post('/login',
  auditLog('USER_LOGIN', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user with password field
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          messageAr: 'بيانات الاعتماد غير صحيحة'
        }
      });
    }
    
    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          messageAr: 'بيانات الاعتماد غير صحيحة'
        }
      });
    }
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);
    
    // Set secure cookies
    setAuthCookies(res, accessToken, refreshToken);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          permissions: user.permissions,
          isVerified: user.isVerified,
          lastLoginAt: user.lastLoginAt
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '24h'
        }
      },
      message: 'Login successful',
      messageAr: 'تم تسجيل الدخول بنجاح'
    });
  })
);

/**
 * UAE Pass login
 * POST /api/auth/uae-pass
 */
router.post('/uae-pass',
  auditLog('UAE_PASS_LOGIN', 'User'),
  uaePassAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    
    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);
    
    // Set secure cookies
    setAuthCookies(res, accessToken, refreshToken);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          uaePassId: user.uaePassId,
          profile: user.profile,
          permissions: user.permissions,
          isVerified: user.isVerified,
          lastLoginAt: user.lastLoginAt
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: '24h'
        }
      },
      message: 'UAE Pass login successful',
      messageAr: 'تم تسجيل الدخول بنجاح عبر الهوية الرقمية الإماراتية'
    });
  })
);

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
router.post('/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Invalid refresh token',
            messageAr: 'رمز التحديث غير صحيح'
          }
        });
      }
      
      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user);
      
      // Set new cookies
      setAuthCookies(res, accessToken, newRefreshToken);
      
      res.json({
        success: true,
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: '24h'
          }
        },
        message: 'Tokens refreshed successfully',
        messageAr: 'تم تحديث الرموز بنجاح'
      });
      
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid refresh token',
          messageAr: 'رمز التحديث غير صحيح'
        }
      });
    }
  })
);

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout',
  authMiddleware,
  auditLog('USER_LOGOUT', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    // Delete session from Redis
    if (req.sessionId) {
      await deleteSession(req.sessionId);
    }
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Logout successful',
      messageAr: 'تم تسجيل الخروج بنجاح'
    });
  })
);

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          uaePassId: user.uaePassId,
          profile: user.profile,
          permissions: user.permissions,
          isVerified: user.isVerified,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          preferredHolidays: user.getPreferredHolidays()
        }
      }
    });
  })
);

/**
 * Verify email address
 * POST /api/auth/verify-email
 */
router.post('/verify-email',
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Verification token is required',
          messageAr: 'رمز التحقق مطلوب'
        }
      });
    }
    
    try {
      // Verify email token
      const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET!) as any;
      
      // Find and update user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid verification token',
            messageAr: 'رمز التحقق غير صحيح'
          }
        });
      }
      
      user.isVerified = true;
      await user.save();
      
      res.json({
        success: true,
        message: 'Email verified successfully',
        messageAr: 'تم التحقق من البريد الإلكتروني بنجاح'
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or expired verification token',
          messageAr: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
        }
      });
    }
  })
);

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password',
  auditLog('PASSWORD_RESET_REQUEST', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
        messageAr: 'إذا كان البريد الإلكتروني موجود، فقد تم إرسال رابط إعادة تعيين كلمة المرور'
      });
    }
    
    // Generate password reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_RESET_SECRET!,
      { expiresIn: '1h' }
    );
    
    // In production, send email with reset link
    console.log('Password reset token for', email, ':', resetToken);
    
    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
      messageAr: 'إذا كان البريد الإلكتروني موجود، فقد تم إرسال رابط إعادة تعيين كلمة المرور'
    });
  })
);

/**
 * Reset password
 * POST /api/auth/reset-password
 */
router.post('/reset-password',
  auditLog('PASSWORD_RESET', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Reset token and new password are required',
          messageAr: 'رمز الإعادة وكلمة المرور الجديدة مطلوبان'
        }
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Password must be at least 8 characters long',
          messageAr: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل'
        }
      });
    }
    
    try {
      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET!) as any;
      
      // Find and update user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid reset token',
            messageAr: 'رمز الإعادة غير صحيح'
          }
        });
      }
      
      user.password = newPassword;
      await user.save();
      
      res.json({
        success: true,
        message: 'Password reset successfully',
        messageAr: 'تم إعادة تعيين كلمة المرور بنجاح'
      });
      
    } catch (error) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid or expired reset token',
          messageAr: 'رمز الإعادة غير صحيح أو منتهي الصلاحية'
        }
      });
    }
  })
);

// Helper functions

/**
 * Generate access and refresh tokens
 */
async function generateTokens(user: any) {
  const sessionId = uuidv4();
  
  // Create session data
  const sessionData = {
    userId: user._id.toString(),
    email: user.email,
    role: user.permissions.role,
    lastActivity: new Date().toISOString(),
    culturalPreferences: user.profile.culturalPreferences
  };
  
  // Store session in Redis
  await setSession(sessionId, sessionData, 86400); // 24 hours
  
  // Generate JWT tokens
  const accessToken = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.permissions.role,
      sessionId
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
  
  const refreshToken = jwt.sign(
    {
      userId: user._id,
      sessionId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

/**
 * Set secure HTTP-only cookies
 */
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    domain: process.env.COOKIE_DOMAIN || undefined
  };
  
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

export default router;