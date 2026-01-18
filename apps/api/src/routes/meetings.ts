/**
 * Meeting Routes
 * Video conferencing, scheduling, and cultural intelligence features
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Meeting, MeetingStatus, MeetingType, IMeeting } from '../models/Meeting.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authMiddleware, requireMeetingAccess, requireRole } from '../middleware/auth.js';
import { auditLog, requireDataClassification, ComplianceLevel } from '../middleware/compliance.js';
import { getMeetingRoomStatus } from '../services/socket.js';

const router = Router();

// Validation schemas
const createMeetingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  titleAr: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  descriptionAr: z.string().max(2000).optional(),
  type: z.nativeEnum(MeetingType).default(MeetingType.VIDEO_CONFERENCE),
  scheduledFor: z.string().datetime('Invalid date format'),
  scheduledEnd: z.string().datetime().optional(),
  timezone: z.string().default('Asia/Dubai'),
  participants: z.array(z.object({
    email: z.string().email(),
    role: z.enum(['host', 'co_host', 'participant']).default('participant')
  })),
  culturalContext: z.object({
    respectsPrayerTimes: z.boolean().default(true),
    ramadanAdjusted: z.boolean().default(false),
    prayerTimeAlerts: z.boolean().default(true),
    culturalNotes: z.string().optional(),
    culturalNotesAr: z.string().optional()
  }).optional(),
  recording: z.object({
    enabled: z.boolean().default(false),
    transcriptionEnabled: z.boolean().default(false),
    language: z.enum(['ar', 'en', 'both']).default('en')
  }).optional(),
  transcription: z.object({
    enabled: z.boolean().default(false),
    language: z.enum(['ar', 'en', 'both']).default('en'),
    dialect: z.enum(['standard', 'emirati', 'saudi', 'egyptian', 'levantine']).default('standard')
  }).optional(),
  security: z.object({
    requireAuthentication: z.boolean().default(true),
    waitingRoom: z.boolean().default(false),
    passwordProtected: z.boolean().default(false),
    password: z.string().optional(),
    allowRecording: z.boolean().default(true),
    allowScreenSharing: z.boolean().default(true),
    allowChat: z.boolean().default(true)
  }).optional(),
  tags: z.array(z.string()).default([])
});

const updateMeetingSchema = createMeetingSchema.partial();

const joinMeetingSchema = z.object({
  password: z.string().optional(),
  videoEnabled: z.boolean().default(true),
  audioEnabled: z.boolean().default(true)
});

/**
 * Create new meeting
 * POST /api/meetings
 */
router.post('/',
  authMiddleware,
  requireMeetingAccess,
  auditLog('MEETING_CREATE', 'Meeting'),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = createMeetingSchema.parse(req.body);
    const user = req.user!;
    
    // Check for cultural conflicts
    const culturalConflicts = await checkCulturalConflicts(
      new Date(validatedData.scheduledFor),
      validatedData.scheduledEnd ? new Date(validatedData.scheduledEnd) : undefined,
      validatedData.participants
    );
    
    // Resolve participant emails to user IDs
    const resolvedParticipants = await resolveParticipants(validatedData.participants);
    
    // Create meeting
    const meeting = new Meeting({
      ...validatedData,
      organizerId: user._id,
      organizationId: user.permissions.organizations[0] || undefined,
      scheduledFor: new Date(validatedData.scheduledFor),
      scheduledEnd: validatedData.scheduledEnd ? new Date(validatedData.scheduledEnd) : undefined,
      participants: resolvedParticipants,
      culturalContext: {
        ...validatedData.culturalContext,
        holidayConflicts: culturalConflicts
      }
    });
    
    await meeting.save();
    
    // Populate participant details
    await meeting.populate('participants.userId', 'profile.firstName profile.lastName email');
    await meeting.populate('organizerId', 'profile.firstName profile.lastName email');
    
    res.status(201).json({
      success: true,
      data: {
        meeting,
        culturalConflicts: culturalConflicts.length > 0 ? culturalConflicts : undefined
      },
      message: 'Meeting created successfully',
      messageAr: 'تم إنشاء الاجتماع بنجاح'
    });
  })
);

/**
 * Get user's meetings
 * GET /api/meetings
 */
router.get('/',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const {
      status,
      type,
      from,
      to,
      page = '1',
      limit = '20',
      search,
      upcoming = 'false'
    } = req.query;
    
    // Build query
    const query: any = {
      $or: [
        { organizerId: user._id },
        { 'participants.userId': user._id }
      ]
    };
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by type
    if (type) {
      query.type = type;
    }
    
    // Date range filter
    if (from || to) {
      query.scheduledFor = {};
      if (from) query.scheduledFor.$gte = new Date(from as string);
      if (to) query.scheduledFor.$lte = new Date(to as string);
    }
    
    // Upcoming meetings only
    if (upcoming === 'true') {
      query.scheduledFor = { $gte: new Date() };
      query.status = { $in: [MeetingStatus.SCHEDULED] };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleAr: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .populate('organizerId', 'profile.firstName profile.lastName profile.avatar email')
        .populate('participants.userId', 'profile.firstName profile.lastName profile.avatar email')
        .sort({ scheduledFor: -1 })
        .skip(skip)
        .limit(limitNum),
      Meeting.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        meetings,
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
 * Get meeting by ID
 * GET /api/meetings/:id
 */
router.get('/:id',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    
    const meeting = await Meeting.findById(id)
      .populate('organizerId', 'profile.firstName profile.lastName profile.avatar email')
      .populate('participants.userId', 'profile.firstName profile.lastName profile.avatar email profile.culturalPreferences');
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found',
          messageAr: 'لم يتم العثور على الاجتماع'
        }
      });
    }
    
    // Check if user can access this meeting
    const canAccess = meeting.organizerId.toString() === user._id.toString() ||
                     meeting.participants.some(p => p.userId.toString() === user._id.toString());
    
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to this meeting',
          messageAr: 'تم رفض الوصول إلى هذا الاجتماع'
        }
      });
    }
    
    // Get real-time room status if meeting is active
    let roomStatus = null;
    if (meeting.isActive()) {
      roomStatus = getMeetingRoomStatus(meeting.roomId);
    }
    
    res.json({
      success: true,
      data: {
        meeting,
        roomStatus,
        canJoin: meeting.canJoin(user._id.toString())
      }
    });
  })
);

/**
 * Update meeting
 * PATCH /api/meetings/:id
 */
router.patch('/:id',
  authMiddleware,
  auditLog('MEETING_UPDATE', 'Meeting'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const validatedData = updateMeetingSchema.parse(req.body);
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found',
          messageAr: 'لم يتم العثور على الاجتماع'
        }
      });
    }
    
    // Check if user can edit this meeting (organizer or co-host)
    const canEdit = meeting.organizerId.toString() === user._id.toString() ||
                   meeting.participants.some(p => 
                     p.userId.toString() === user._id.toString() && p.role === 'co_host'
                   );
    
    if (!canEdit) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to edit this meeting',
          messageAr: 'غير مخول لتعديل هذا الاجتماع'
        }
      });
    }
    
    // Check if meeting can be edited (not in progress or completed)
    if (meeting.status === MeetingStatus.IN_PROGRESS || meeting.status === MeetingStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot edit meeting that is in progress or completed',
          messageAr: 'لا يمكن تعديل اجتماع جاري أو مكتمل'
        }
      });
    }
    
    // Update meeting
    Object.assign(meeting, {
      ...validatedData,
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : meeting.scheduledFor,
      scheduledEnd: validatedData.scheduledEnd ? new Date(validatedData.scheduledEnd) : meeting.scheduledEnd
    });
    
    await meeting.save();
    await meeting.populate('organizerId', 'profile.firstName profile.lastName email');
    await meeting.populate('participants.userId', 'profile.firstName profile.lastName email');
    
    res.json({
      success: true,
      data: { meeting },
      message: 'Meeting updated successfully',
      messageAr: 'تم تحديث الاجتماع بنجاح'
    });
  })
);

/**
 * Join meeting
 * POST /api/meetings/:id/join
 */
router.post('/:id/join',
  authMiddleware,
  auditLog('MEETING_JOIN', 'Meeting'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const { password, videoEnabled = true, audioEnabled = true } = joinMeetingSchema.parse(req.body);
    
    const meeting = await Meeting.findById(id)
      .populate('organizerId', 'profile.firstName profile.lastName email')
      .populate('participants.userId', 'profile.firstName profile.lastName email profile.culturalPreferences');
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found',
          messageAr: 'لم يتم العثور على الاجتماع'
        }
      });
    }
    
    // Check if meeting is joinable
    if (meeting.status === MeetingStatus.COMPLETED || meeting.status === MeetingStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Meeting is not available for joining',
          messageAr: 'الاجتماع غير متاح للانضمام'
        }
      });
    }
    
    // Check password if required
    if (meeting.security.passwordProtected && meeting.security.password !== password) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid meeting password',
          messageAr: 'كلمة مرور الاجتماع غير صحيحة'
        }
      });
    }
    
    // Check if user can join
    if (!meeting.canJoin(user._id.toString())) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied to this meeting',
          messageAr: 'تم رفض الوصول إلى هذا الاجتماع'
        }
      });
    }
    
    // Start meeting if it's the scheduled time and not started yet
    if (meeting.status === MeetingStatus.SCHEDULED && new Date() >= meeting.scheduledFor) {
      meeting.status = MeetingStatus.IN_PROGRESS;
      meeting.actualStartTime = new Date();
      await meeting.save();
    }
    
    // Add/update participant
    meeting.addParticipant({
      userId: user._id,
      name: user.getDisplayName(),
      email: user.email,
      role: meeting.organizerId.toString() === user._id.toString() ? 'host' : 'participant',
      joinedAt: new Date(),
      videoEnabled,
      audioEnabled,
      screenShared: false,
      culturalPreferences: {
        prayerTimeAlerts: user.profile.culturalPreferences?.prayerTimeAlerts || false,
        preferredLanguage: user.profile.preferredLanguage || 'en'
      }
    });
    
    await meeting.save();
    
    // Get current room status
    const roomStatus = getMeetingRoomStatus(meeting.roomId);
    
    res.json({
      success: true,
      data: {
        meeting: {
          id: meeting._id,
          title: meeting.title,
          titleAr: meeting.titleAr,
          roomId: meeting.roomId,
          joinUrl: meeting.joinUrl,
          status: meeting.status,
          culturalContext: meeting.culturalContext,
          recording: meeting.recording,
          transcription: meeting.transcription,
          security: {
            ...meeting.security,
            password: undefined // Don't send password back
          }
        },
        roomStatus,
        userRole: meeting.organizerId.toString() === user._id.toString() ? 'host' : 'participant',
        culturalPreferences: user.profile.culturalPreferences
      },
      message: 'Joined meeting successfully',
      messageAr: 'تم الانضمام إلى الاجتماع بنجاح'
    });
  })
);

/**
 * Leave meeting
 * POST /api/meetings/:id/leave
 */
router.post('/:id/leave',
  authMiddleware,
  auditLog('MEETING_LEAVE', 'Meeting'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found',
          messageAr: 'لم يتم العثور على الاجتماع'
        }
      });
    }
    
    // Remove participant from meeting
    meeting.removeParticipant(user._id.toString());
    
    // End meeting if organizer leaves or no participants left
    const activeParticipants = meeting.participants.filter(p => p.joinedAt && !p.leftAt);
    const isOrganizer = meeting.organizerId.toString() === user._id.toString();
    
    if (isOrganizer || activeParticipants.length === 0) {
      meeting.status = MeetingStatus.COMPLETED;
      meeting.actualEndTime = new Date();
      meeting.updateStatistics();
    }
    
    await meeting.save();
    
    res.json({
      success: true,
      message: 'Left meeting successfully',
      messageAr: 'تم مغادرة الاجتماع بنجاح'
    });
  })
);

/**
 * Start/Stop recording
 * POST /api/meetings/:id/recording
 */
router.post('/:id/recording',
  authMiddleware,
  requireDataClassification(ComplianceLevel.CONFIDENTIAL),
  auditLog('MEETING_RECORDING', 'Meeting'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { action } = req.body; // 'start' or 'stop'
    const user = req.user!;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found',
          messageAr: 'لم يتم العثور على الاجتماع'
        }
      });
    }
    
    // Check if user is host or co-host
    const isHost = meeting.organizerId.toString() === user._id.toString();
    const isCoHost = meeting.participants.some(p => 
      p.userId.toString() === user._id.toString() && p.role === 'co_host'
    );
    
    if (!isHost && !isCoHost) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only hosts can control recording',
          messageAr: 'المضيفون فقط يمكنهم التحكم في التسجيل'
        }
      });
    }
    
    if (action === 'start') {
      meeting.recording.enabled = true;
      meeting.recording.status = 'recording';
      meeting.recording.startedAt = new Date();
    } else if (action === 'stop') {
      meeting.recording.status = 'recorded';
      meeting.recording.endedAt = new Date();
      if (meeting.recording.startedAt) {
        meeting.recording.duration = Math.floor(
          (meeting.recording.endedAt.getTime() - meeting.recording.startedAt.getTime()) / 1000
        );
      }
    }
    
    await meeting.save();
    
    res.json({
      success: true,
      data: {
        recording: meeting.recording
      },
      message: `Recording ${action}ed successfully`,
      messageAr: action === 'start' ? 'بدأ التسجيل بنجاح' : 'توقف التسجيل بنجاح'
    });
  })
);

/**
 * Get meeting analytics
 * GET /api/meetings/:id/analytics
 */
router.get('/:id/analytics',
  authMiddleware,
  requireRole(['admin', 'org_admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const meeting = await Meeting.findById(id)
      .populate('participants.userId', 'profile.firstName profile.lastName profile.nationality');
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found',
          messageAr: 'لم يتم العثور على الاجتماع'
        }
      });
    }
    
    // Calculate analytics
    const analytics = {
      basic: meeting.statistics,
      cultural: {
        nationalityBreakdown: calculateNationalityBreakdown(meeting.participants),
        languagePreferences: calculateLanguagePreferences(meeting.participants),
        prayerTimeAlertsEnabled: meeting.participants.filter(p => 
          p.culturalPreferences?.prayerTimeAlerts
        ).length
      },
      engagement: {
        averageVideoTime: meeting.statistics.videoMinutes / meeting.statistics.totalParticipants || 0,
        averageAudioTime: meeting.statistics.audioMinutes / meeting.statistics.totalParticipants || 0,
        screenShareUsage: meeting.statistics.screenShareMinutes > 0,
        chatEngagement: meeting.statistics.chatMessages / meeting.statistics.totalParticipants || 0
      },
      compliance: {
        recordingCompliant: meeting.recording.enabled && meeting.security.dataResidency === 'UAE',
        encryptionLevel: meeting.security.encryptionLevel,
        dataResidency: meeting.security.dataResidency,
        auditTrail: true
      }
    };
    
    res.json({
      success: true,
      data: { analytics }
    });
  })
);

/**
 * Delete meeting
 * DELETE /api/meetings/:id
 */
router.delete('/:id',
  authMiddleware,
  auditLog('MEETING_DELETE', 'Meeting'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    
    const meeting = await Meeting.findById(id);
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Meeting not found',
          messageAr: 'لم يتم العثور على الاجتماع'
        }
      });
    }
    
    // Only organizer can delete meeting
    if (meeting.organizerId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Only meeting organizer can delete meeting',
          messageAr: 'منظم الاجتماع فقط يمكنه حذف الاجتماع'
        }
      });
    }
    
    // Cannot delete active meeting
    if (meeting.status === MeetingStatus.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot delete active meeting',
          messageAr: 'لا يمكن حذف اجتماع نشط'
        }
      });
    }
    
    await Meeting.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Meeting deleted successfully',
      messageAr: 'تم حذف الاجتماع بنجاح'
    });
  })
);

// Helper functions

/**
 * Check for cultural conflicts with prayer times and holidays
 */
async function checkCulturalConflicts(
  startTime: Date, 
  endTime?: Date, 
  participants?: any[]
): Promise<string[]> {
  const conflicts: string[] = [];
  
  // This would integrate with actual prayer time and holiday APIs
  // For now, return empty array
  
  return conflicts;
}

/**
 * Resolve participant emails to user objects
 */
async function resolveParticipants(participantEmails: any[]) {
  const participants = [];
  
  for (const participant of participantEmails) {
    const user = await User.findOne({ email: participant.email });
    if (user) {
      participants.push({
        userId: user._id,
        name: user.getDisplayName(),
        email: user.email,
        role: participant.role || 'participant',
        videoEnabled: true,
        audioEnabled: true,
        screenShared: false,
        culturalPreferences: {
          prayerTimeAlerts: user.profile.culturalPreferences?.prayerTimeAlerts || false,
          preferredLanguage: user.profile.preferredLanguage || 'en'
        }
      });
    }
  }
  
  return participants;
}

/**
 * Calculate nationality breakdown for analytics
 */
function calculateNationalityBreakdown(participants: any[]) {
  const breakdown: Record<string, number> = {};
  
  participants.forEach(participant => {
    const nationality = participant.userId?.profile?.nationality || 'Unknown';
    breakdown[nationality] = (breakdown[nationality] || 0) + 1;
  });
  
  return breakdown;
}

/**
 * Calculate language preferences for analytics
 */
function calculateLanguagePreferences(participants: any[]) {
  const preferences: Record<string, number> = { ar: 0, en: 0 };
  
  participants.forEach(participant => {
    const language = participant.culturalPreferences?.preferredLanguage || 'en';
    preferences[language]++;
  });
  
  return preferences;
}

export default router;