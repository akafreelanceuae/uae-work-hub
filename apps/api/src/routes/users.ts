/**
 * User Routes
 * Profile management, cultural preferences, and settings
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { User, UAENationality, LanguagePreference } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { auditLog, piiProtection } from '../middleware/compliance.js';

const router = Router();

// Validation schemas
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50).optional(),
  displayName: z.string().max(100).optional(),
  avatar: z.string().url('Avatar must be a valid URL').optional(),
  nationality: z.nativeEnum(UAENationality).optional(),
  preferredLanguage: z.nativeEnum(LanguagePreference).optional(),
  phoneNumber: z.string().regex(/^(\+971|971)?[0-9]{8,9}$/, 'Invalid UAE phone number').optional(),
  emiratesId: z.string().regex(/^784-[0-9]{4}-[0-9]{7}-[0-9]$/, 'Invalid Emirates ID format').optional(),
  companyName: z.string().max(200).optional(),
  jobTitle: z.string().max(100).optional(),
  department: z.string().max(100).optional()
});

const updateCulturalPreferencesSchema = z.object({
  prayerTimeAlerts: z.boolean().optional(),
  ramadanMode: z.boolean().optional(),
  holidayCalendars: z.array(z.nativeEnum(UAENationality)).optional(),
  workingDays: z.array(z.number().min(0).max(6)).optional(),
  workingHours: z.object({
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format')
  }).optional(),
  meetingDurationPreference: z.number().min(15).max(480).optional(),
  timeZone: z.string().optional()
});

/**
 * Get current user profile
 * GET /api/users/profile
 */
router.get('/profile',
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
          fullName: user.getDisplayName(),
          isEmirate: user.isEmirate(),
          preferredHolidays: user.getPreferredHolidays()
        }
      }
    });
  })
);

/**
 * Update user profile
 * PATCH /api/users/profile
 */
router.patch('/profile',
  authMiddleware,
  piiProtection,
  auditLog('USER_PROFILE_UPDATE', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const validatedData = updateProfileSchema.parse(req.body);
    
    // Update profile fields
    Object.assign(user.profile, validatedData);
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          fullName: user.getDisplayName()
        }
      },
      message: 'Profile updated successfully',
      messageAr: 'تم تحديث الملف الشخصي بنجاح'
    });
  })
);

/**
 * Update cultural preferences
 * PATCH /api/users/cultural-preferences
 */
router.patch('/cultural-preferences',
  authMiddleware,
  auditLog('CULTURAL_PREFERENCES_UPDATE', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const validatedData = updateCulturalPreferencesSchema.parse(req.body);
    
    // Update cultural preferences
    Object.assign(user.profile.culturalPreferences, validatedData);
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        culturalPreferences: user.profile.culturalPreferences
      },
      message: 'Cultural preferences updated successfully',
      messageAr: 'تم تحديث التفضيلات الثقافية بنجاح'
    });
  })
);

/**
 * Get user's meeting statistics
 * GET /api/users/statistics
 */
router.get('/statistics',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    
    // This would typically involve aggregating from Meeting collection
    const statistics = {
      totalMeetings: 0,
      totalMeetingTime: 0, // in minutes
      averageMeetingDuration: 0,
      meetingsAsHost: 0,
      meetingsAsParticipant: 0,
      videoMinutes: 0,
      audioMinutes: 0,
      transcriptionUsage: 0,
      culturalFeatures: {
        prayerTimeAlertsUsed: 0,
        ramadanAdjustments: 0,
        culturalConflictsAvoided: 0
      },
      monthlyStats: [], // Last 12 months
      nationalityInteractions: user.getPreferredHolidays()
    };
    
    res.json({
      success: true,
      data: { statistics }
    });
  })
);

/**
 * Upload avatar
 * POST /api/users/avatar
 */
router.post('/avatar',
  authMiddleware,
  auditLog('AVATAR_UPLOAD', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { avatarUrl } = req.body;
    
    if (!avatarUrl || !avatarUrl.match(/^https?:\/\/.+/)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Valid avatar URL is required',
          messageAr: 'رابط صورة صحيح مطلوب'
        }
      });
    }
    
    user.profile.avatar = avatarUrl;
    await user.save();
    
    res.json({
      success: true,
      data: {
        avatar: user.profile.avatar
      },
      message: 'Avatar updated successfully',
      messageAr: 'تم تحديث الصورة الشخصية بنجاح'
    });
  })
);

/**
 * Change password
 * POST /api/users/change-password
 */
router.post('/change-password',
  authMiddleware,
  auditLog('PASSWORD_CHANGE', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password and new password are required',
          messageAr: 'كلمة المرور الحالية والجديدة مطلوبتان'
        }
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'New password must be at least 8 characters long',
          messageAr: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل'
        }
      });
    }
    
    // Check current password
    const userWithPassword = await User.findById(user._id).select('+password');
    if (!userWithPassword || !await userWithPassword.comparePassword(currentPassword)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Current password is incorrect',
          messageAr: 'كلمة المرور الحالية غير صحيحة'
        }
      });
    }
    
    // Update password
    userWithPassword.password = newPassword;
    await userWithPassword.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully',
      messageAr: 'تم تغيير كلمة المرور بنجاح'
    });
  })
);

/**
 * Get user's organizations
 * GET /api/users/organizations
 */
router.get('/organizations',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    
    // This would typically populate from Organization model
    const organizations = user.permissions.organizations.map(orgId => ({
      id: orgId,
      // These would be populated from actual Organization documents
      name: 'Sample Organization',
      nameAr: 'منظمة عينة',
      role: user.permissions.role
    }));
    
    res.json({
      success: true,
      data: { organizations }
    });
  })
);

/**
 * Deactivate account
 * POST /api/users/deactivate
 */
router.post('/deactivate',
  authMiddleware,
  auditLog('ACCOUNT_DEACTIVATE', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { reason } = req.body;
    
    // Soft delete - set as inactive
    user.isActive = false;
    await user.save();
    
    res.json({
      success: true,
      message: 'Account deactivated successfully',
      messageAr: 'تم إلغاء تفعيل الحساب بنجاح'
    });
  })
);

/**
 * Get users list (admin only)
 * GET /api/users
 */
router.get('/',
  authMiddleware,
  requireRole(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      page = '1',
      limit = '20',
      search,
      nationality,
      role,
      isActive
    } = req.query;
    
    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (nationality) {
      query['profile.nationality'] = nationality;
    }
    
    if (role) {
      query['permissions.role'] = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  })
);

/**
 * Get user by ID (admin only)
 * GET /api/users/:id
 */
router.get('/:id',
  authMiddleware,
  requireRole(['admin', 'org_admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          messageAr: 'لم يتم العثور على المستخدم'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          fullName: user.getDisplayName(),
          isEmirate: user.isEmirate(),
          preferredHolidays: user.getPreferredHolidays()
        }
      }
    });
  })
);

/**
 * Update user role (admin only)
 * PATCH /api/users/:id/role
 */
router.patch('/:id/role',
  authMiddleware,
  requireRole(['admin']),
  auditLog('USER_ROLE_UPDATE', 'User'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin', 'moderator', 'org_admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid role',
          messageAr: 'دور غير صحيح'
        }
      });
    }
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          messageAr: 'لم يتم العثور على المستخدم'
        }
      });
    }
    
    user.permissions.role = role;
    await user.save();
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          permissions: user.permissions
        }
      },
      message: 'User role updated successfully',
      messageAr: 'تم تحديث دور المستخدم بنجاح'
    });
  })
);

export default router;