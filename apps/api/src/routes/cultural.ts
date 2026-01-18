/**
 * Cultural Routes - Simplified Version
 * Prayer times, holidays, Ramadan features, and cultural intelligence
 * UAE Work Hub - Cultural Intelligence Engine
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { format } from 'date-fns';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Simple validation schema
const culturalCheckSchema = z.object({
  meetingTime: z.string(),
  duration: z.number().min(15).max(480),
  participants: z.array(z.object({
    nationality: z.string()
  })).optional()
});

/**
 * Get current prayer times for UAE cities
 * GET /api/cultural/prayer-times
 */
router.get('/prayer-times',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { city = 'Dubai', date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    // Mock prayer times for Dubai
    const prayerTimes = {
      city,
      date: dateStr,
      times: {
        fajr: '05:15',
        sunrise: '06:35',
        dhuhr: '12:20',
        asr: '15:45',
        maghrib: '18:05',
        isha: '19:25'
      },
      timesAr: {
        fajr: 'الفجر',
        sunrise: 'الشروق',
        dhuhr: 'الظهر',
        asr: 'العصر',
        maghrib: 'المغرب',
        isha: 'العشاء'
      },
      qibla_direction: 292.5,
      method_name: 'University of Islamic Sciences, Karachi'
    };

    res.json({
      success: true,
      data: prayerTimes,
      message: 'Prayer times retrieved successfully',
      messageAr: 'تم استرداد أوقات الصلاة بنجاح'
    });
  })
);

/**
 * Get UAE and cultural holidays
 * GET /api/cultural/holidays
 */
router.get('/holidays',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year as string);

    const holidays = [
      {
        name: 'New Year Day',
        nameAr: 'رأس السنة الميلادية',
        date: `${targetYear}-01-01`,
        type: 'public',
        is_religious: false
      },
      {
        name: 'UAE National Day',
        nameAr: 'اليوم الوطني للإمارات',
        date: `${targetYear}-12-02`,
        type: 'national',
        is_religious: false,
        description: 'Celebrates the unification of the Emirates in 1971'
      },
      {
        name: 'Eid Al Fitr',
        nameAr: 'عيد الفطر',
        date: `${targetYear}-04-10`, // Approximate
        type: 'religious',
        is_religious: true,
        duration_days: 3,
        description: 'Festival of Breaking the Fast'
      },
      {
        name: 'Eid Al Adha',
        nameAr: 'عيد الأضحى',
        date: `${targetYear}-06-17`, // Approximate
        type: 'religious',
        is_religious: true,
        duration_days: 4,
        description: 'Festival of Sacrifice'
      }
    ];

    res.json({
      success: true,
      data: {
        holidays,
        year: targetYear,
        total: holidays.length
      },
      message: 'Holidays retrieved successfully',
      messageAr: 'تم استرداد العطلات بنجاح'
    });
  })
);

/**
 * Check for cultural conflicts in meeting scheduling
 * POST /api/cultural/check-conflicts
 */
router.post('/check-conflicts',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = culturalCheckSchema.parse(req.body);
    
    const meetingStart = new Date(validatedData.meetingTime);
    const conflicts = [];
    
    // Simple conflict detection
    const dayOfWeek = meetingStart.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      conflicts.push({
        type: 'weekend',
        severity: 'medium',
        description: 'Meeting scheduled on UAE weekend',
        descriptionAr: 'الاجتماع مجدول في عطلة نهاية الأسبوع'
      });
    }

    const hour = meetingStart.getHours();
    if (hour < 9 || hour > 17) {
      conflicts.push({
        type: 'working_hours',
        severity: 'low',
        description: 'Meeting outside typical working hours',
        descriptionAr: 'الاجتماع خارج ساعات العمل المعتادة'
      });
    }

    const severity = conflicts.length > 0 ? 
      (conflicts.some(c => c.severity === 'high') ? 'high' : 'medium') : 'low';

    res.json({
      success: true,
      data: {
        conflicts,
        meeting_time: validatedData.meetingTime,
        duration_minutes: validatedData.duration,
        has_conflicts: conflicts.length > 0,
        severity,
        recommendations: conflicts.length > 0 ? 
          ['Consider rescheduling to avoid conflicts'] : 
          ['Meeting time appears culturally appropriate']
      },
      message: conflicts.length > 0 ? 'Cultural conflicts detected' : 'No cultural conflicts found',
      messageAr: conflicts.length > 0 ? 'تم اكتشاف تعارضات ثقافية' : 'لم يتم العثور على تعارضات ثقافية'
    });
  })
);

/**
 * Get Ramadan schedule and information
 * GET /api/cultural/ramadan
 */
router.get('/ramadan',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year as string);

    const ramadanInfo = {
      year: targetYear,
      location: 'Dubai',
      start_date: `${targetYear}-03-23`, // Approximate
      end_date: `${targetYear}-04-21`,   // Approximate
      duration_days: 30,
      is_current: false, // Simplified
      special_considerations: {
        recommended_meeting_hours: ['09:00-11:00', '14:00-16:00'],
        avoid_hours: ['12:00-13:30', '18:00-19:30'],
        max_meeting_duration: 90,
        cultural_notes: {
          en: 'During Ramadan, consider shorter meetings and avoid scheduling during Iftar time',
          ar: 'خلال رمضان، يُنصح بالاجتماعات القصيرة وتجنب وقت الإفطار'
        }
      }
    };
    
    res.json({
      success: true,
      data: ramadanInfo,
      message: 'Ramadan information retrieved successfully',
      messageAr: 'تم استرداد معلومات رمضان بنجاح'
    });
  })
);

/**
 * Get Islamic calendar information
 * GET /api/cultural/islamic-calendar
 */
router.get('/islamic-calendar',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    // Simple Islamic calendar info without HijriDate dependency
    const islamicInfo = {
      gregorian: {
        date: format(targetDate, 'yyyy-MM-dd'),
        day: format(targetDate, 'EEEE'),
        month: format(targetDate, 'MMMM'),
        year: targetDate.getFullYear()
      },
      hijri: {
        note: 'Hijri date calculation temporarily unavailable - feature in development',
        noteAr: 'حساب التاريخ الهجري غير متاح مؤقتاً - الميزة قيد التطوير'
      },
      is_weekend: (targetDate.getDay() === 5 || targetDate.getDay() === 6),
      cultural_context: 'UAE weekend (Friday-Saturday)'
    };

    res.json({
      success: true,
      data: islamicInfo,
      message: 'Islamic calendar information retrieved',
      messageAr: 'تم استرداد معلومات التقويم الإسلامي'
    });
  })
);

/**
 * Get cultural working hours for different nationalities
 * GET /api/cultural/working-hours
 */
router.get('/working-hours',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { nationality = 'AE', date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    const workingHourPatterns: { [key: string]: any } = {
      'AE': {
        standard: { start: '09:00', end: '17:00' },
        weekend: ['friday', 'saturday'],
        notes: 'UAE follows Sunday-Thursday working week'
      },
      'SA': {
        standard: { start: '08:00', end: '17:00' },
        weekend: ['friday', 'saturday'],
        notes: 'Saudi Arabia follows Sunday-Thursday working week'
      },
      'IN': {
        standard: { start: '09:30', end: '18:00' },
        weekend: ['saturday', 'sunday'],
        notes: 'India follows Monday-Friday working week'
      },
      'PH': {
        standard: { start: '08:00', end: '17:00' },
        weekend: ['saturday', 'sunday'],
        notes: 'Philippines follows Monday-Friday working week'
      }
    };

    const pattern = workingHourPatterns[nationality as string] || workingHourPatterns['AE'];
    
    res.json({
      success: true,
      data: {
        nationality,
        working_hours: pattern.standard,
        weekend_days: pattern.weekend,
        cultural_notes: pattern.notes,
        date: format(targetDate, 'yyyy-MM-dd')
      },
      message: 'Working hours information retrieved',
      messageAr: 'تم استرداد معلومات ساعات العمل'
    });
  })
);

/**
 * Health check for cultural intelligence
 * GET /api/cultural/health
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'cultural-intelligence',
    status: 'active',
    features: [
      'Prayer times (UAE cities)',
      'UAE and cultural holidays',
      'Meeting conflict detection',
      'Ramadan scheduling guidance',
      'Cultural working hours',
      'Islamic calendar awareness'
    ],
    message: 'Cultural Intelligence Engine is operational',
    messageAr: 'محرك الذكاء الثقافي يعمل بشكل طبيعي'
  });
});

export default router;