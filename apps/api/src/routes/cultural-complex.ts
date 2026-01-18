/**
 * Cultural Routes
 * Prayer times, holidays, Ramadan features, and cultural intelligence
 * UAE Work Hub - Cultural Intelligence Engine
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { format, addDays, isWithinInterval } from 'date-fns';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { auditLog } from '../middleware/compliance.js';
import { cachePrayerTimes, getCachedPrayerTimes, cacheUAEHolidays, getCachedUAEHolidays } from '../services/redis-dev.js';
import { culturalIntelligenceService, type MeetingCulturalContext } from '../services/cultural.js';
import HijriDate from 'hijri-converter';

const router = Router();

// Validation schema for cultural conflict checking
const culturalCheckSchema = z.object({
  meetingTime: z.string(),
  duration: z.number().min(15).max(480),
  participants: z.array(z.object({
    nationality: z.string(),
    culturalPreferences: z.object({
      prayerTimeAlerts: z.boolean().optional(),
      ramadanMode: z.boolean().optional()
    }).optional()
  })).optional()
});

/**
 * Get current prayer times for UAE cities
 * GET /api/cultural/prayer-times
 */
router.get('/prayer-times',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { city = 'Dubai', date, timezone = 'Asia/Dubai', method = 8 } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    try {
      // Check cache first
      const cachedTimes = await getCachedPrayerTimes(city as string, dateStr);
      if (cachedTimes) {
        return res.json({
          success: true,
          data: {
            ...cachedTimes,
            cached: true
          },
          message: 'Prayer times retrieved successfully',
          messageAr: 'تم استرداد أوقات الصلاة بنجاح'
        });
      }

      // Fetch from cultural intelligence service
      const prayerTimes = await culturalIntelligenceService.getPrayerTimes(city as string, targetDate, method as number);
      
      // Cache the results
      await cachePrayerTimes(city as string, dateStr, prayerTimes);

      res.json({
        success: true,
        data: {
          ...prayerTimes,
          timezone,
          cached: false
        },
        message: 'Prayer times retrieved successfully',
        messageAr: 'تم استرداد أوقات الصلاة بنجاح'
      });

    } catch (error) {
      console.error('Prayer times error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch prayer times',
          messageAr: 'فشل في جلب أوقات الصلاة'
        }
      });
    }
  })
);

/**
 * Get UAE and cultural holidays
 * GET /api/cultural/holidays
 */
router.get('/holidays',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { year = new Date().getFullYear(), nationality } = req.query;
    const targetYear = parseInt(year as string);

    try {
      // Check cache
      const cachedHolidays = await getCachedUAEHolidays(targetYear);
      if (cachedHolidays && !nationality) {
        return res.json({
          success: true,
          data: {
            holidays: cachedHolidays,
            year: targetYear,
            cached: true
          }
        });
      }

      // Get nationalities to fetch holidays for
      const nationalities = nationality ? [nationality as string, 'AE'] : ['AE'];
      
      // Fetch holidays using cultural intelligence service
      const allHolidays = await culturalIntelligenceService.getHolidays(targetYear, nationalities);
      
      // Cache holidays
      const uaeHolidays = allHolidays.filter(h => h.type === 'national' || h.type === 'public');
      await cacheUAEHolidays(targetYear, uaeHolidays);

      res.json({
        success: true,
        data: {
          holidays: allHolidays,
          year: targetYear,
          uae_holidays: uaeHolidays.length,
          religious_holidays: allHolidays.filter(h => h.is_religious).length,
          total_holidays: allHolidays.length,
          cached: false
        },
        message: 'Holidays retrieved successfully',
        messageAr: 'تم استرداد العطلات بنجاح'
      });

    } catch (error) {
      console.error('Holidays error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch holidays',
          messageAr: 'فشل في جلب العطلات'
        }
      });
    }
  })
);

/**
 * Check for cultural conflicts in meeting scheduling
 * POST /api/cultural/check-conflicts
 */
router.post('/check-conflicts',
  authMiddleware,
  auditLog('CULTURAL_CONFLICT_CHECK', 'Meeting'),
  asyncHandler(async (req: Request, res: Response) => {
    const validatedData = culturalCheckSchema.parse(req.body);
    
    try {
      const meetingStart = new Date(validatedData.meetingTime);
      const meetingEnd = addDays(meetingStart, validatedData.duration / (24 * 60)); // Convert minutes to days
      
      // Create cultural context for the meeting
      const meetingContext: MeetingCulturalContext = {
        startTime: meetingStart,
        endTime: meetingEnd,
        duration: validatedData.duration,
        participants: (validatedData.participants || []).map(p => ({
          nationality: p.nationality,
          culturalPreferences: {
            nationality: p.nationality,
            language: 'en' as const,
            prayerTimeAlerts: p.culturalPreferences?.prayerTimeAlerts || false,
            ramadanMode: p.culturalPreferences?.ramadanMode || false,
            culturalHolidays: true,
            workingHours: {
              start: '09:00',
              end: '17:00',
              timezone: 'Asia/Dubai'
            },
            weekendDays: ['friday', 'saturday']
          }
        })),
        location: 'Dubai',
        timezone: 'Asia/Dubai'
      };
      
      // Use the comprehensive cultural intelligence service
      const analysisResult = await culturalIntelligenceService.analyzeMeetingCulturalContext(meetingContext);
      const conflicts = analysisResult.conflicts;

      res.json({
        success: true,
        data: {
          conflicts: analysisResult.conflicts,
          meeting_time: validatedData.meetingTime,
          duration_minutes: validatedData.duration,
          has_conflicts: analysisResult.conflicts.length > 0,
          severity: analysisResult.severity,
          recommendations: analysisResult.recommendations,
          recommendations_ar: analysisResult.recommendationsAr,
          suggested_times: analysisResult.suggestedTimes,
          cultural_context: analysisResult.culturalContext,
          analysis_summary: {
            total_conflicts: analysisResult.conflicts.length,
            high_priority: analysisResult.conflicts.filter(c => c.severity === 'high').length,
            is_holiday: analysisResult.culturalContext.isHoliday,
            is_weekend: analysisResult.culturalContext.isWeekend,
            is_ramadan: analysisResult.culturalContext.isRamadan,
            hijri_date: analysisResult.culturalContext.hijriDate
          }
        },
        message: conflicts.length > 0 ? 'Cultural conflicts detected' : 'No cultural conflicts found',
        messageAr: conflicts.length > 0 ? 'تم اكتشاف تعارضات ثقافية' : 'لم يتم العثور على تعارضات ثقافية'
      });

    } catch (error) {
      console.error('Cultural conflict check error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to check cultural conflicts',
          messageAr: 'فشل في فحص التعارضات الثقافية'
        }
      });
    }
  })
);

/**
 * Get Ramadan schedule and information
 * GET /api/cultural/ramadan
 */
router.get('/ramadan',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { year = new Date().getFullYear(), location = 'Dubai' } = req.query;
    const targetYear = parseInt(year as string);

    try {
      const currentDate = new Date();
      const isCurrentlyRamadan = await culturalIntelligenceService.isRamadan(currentDate);
      const workingHours = culturalIntelligenceService.getCulturalWorkingHours('AE', isCurrentlyRamadan);
      
      const ramadanInfo = {
        year: targetYear,
        location: location as string,
        start_date: `${targetYear}-03-23`, // Approximate - in production use precise calculation
        end_date: `${targetYear}-04-21`,   // Approximate
        duration_days: 30,
        is_current: isCurrentlyRamadan,
        working_hours: workingHours,
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

    } catch (error) {
      console.error('Ramadan info error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get Ramadan information',
          messageAr: 'فشل في الحصول على معلومات رمضان'
        }
      });
    }
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

    try {
      const hijriInfo = culturalIntelligenceService.getHijriDate(targetDate);
      const isCurrentlyRamadan = await culturalIntelligenceService.isRamadan(targetDate);
      const prayerTimes = await culturalIntelligenceService.getPrayerTimes('Dubai', targetDate);
      
      const islamicInfo = {
        gregorian: {
          date: format(targetDate, 'yyyy-MM-dd'),
          day: format(targetDate, 'EEEE'),
          month: format(targetDate, 'MMMM'),
          year: targetDate.getFullYear()
        },
        hijri: {
          date: hijriInfo.date,
          month: hijriInfo.month,
          monthAr: hijriInfo.monthAr,
          year: hijriInfo.year
        },
        special_occasions: [
          ...(isCurrentlyRamadan ? [{
            name: 'Ramadan',
            nameAr: 'رمضان',
            type: 'holy_month',
            description: 'The holy month of fasting'
          }] : [])
        ],
        is_weekend: (targetDate.getDay() === 5 || targetDate.getDay() === 6),
        is_ramadan: isCurrentlyRamadan,
        prayer_times_summary: {
          next_prayer: getNextPrayer(prayerTimes.times),
          total_prayers: 5,
          fajr: prayerTimes.times.fajr,
          dhuhr: prayerTimes.times.dhuhr,
          asr: prayerTimes.times.asr,
          maghrib: prayerTimes.times.maghrib,
          isha: prayerTimes.times.isha
        }
      };

      res.json({
        success: true,
        data: islamicInfo,
        message: 'Islamic calendar information retrieved',
        messageAr: 'تم استرداد معلومات التقويم الإسلامي'
      });

    } catch (error) {
      console.error('Islamic calendar error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get Islamic calendar information',
          messageAr: 'فشل في الحصول على معلومات التقويم الإسلامي'
        }
      });
    }
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

    try {
      const isCurrentlyRamadan = await culturalIntelligenceService.isRamadan(targetDate);
      const workingHours = culturalIntelligenceService.getCulturalWorkingHours(nationality as string, isCurrentlyRamadan);
      
      const workingHoursInfo = {
        nationality: nationality as string,
        working_hours: {
          start: workingHours.start,
          end: workingHours.end
        },
        is_ramadan_adjusted: isCurrentlyRamadan,
        cultural_notes: workingHours.notes,
        date: format(targetDate, 'yyyy-MM-dd'),
        weekend_days: nationality === 'AE' ? ['friday', 'saturday'] : ['saturday', 'sunday']
      };
      
      res.json({
        success: true,
        data: workingHoursInfo,
        message: 'Working hours information retrieved',
        messageAr: 'تم استرداد معلومات ساعات العمل'
      });

    } catch (error) {
      console.error('Working hours error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get working hours information',
          messageAr: 'فشل في الحصول على معلومات ساعات العمل'
        }
      });
    }
  })
);

/**
 * Get prayer time alerts for upcoming meetings
 * GET /api/cultural/prayer-alerts
 */
router.get('/prayer-alerts',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { date, city = 'Dubai' } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    try {
      const prayerTimes = await culturalIntelligenceService.getPrayerTimes(city as string, targetDate);
      
      const alerts = [];
      for (const [prayer, time] of Object.entries(prayerTimes.times)) {
        const alertTime = new Date(targetDate);
        const [hour, minute] = (time as string).split(':').map(Number);
        alertTime.setHours(hour - 1, minute - 15, 0, 0); // 15 minutes before
        
        alerts.push({
          prayer_name: prayer,
          prayer_name_ar: prayerTimes.timesAr[prayer as keyof typeof prayerTimes.timesAr],
          prayer_time: time,
          alert_time: format(alertTime, 'HH:mm'),
          message: `Prayer time approaching: ${prayer} at ${time}`,
          messageAr: `يحين وقت الصلاة: ${prayerTimes.timesAr[prayer as keyof typeof prayerTimes.timesAr]} في ${time}`
        });
      }

      res.json({
        success: true,
        data: {
          alerts,
          date: format(targetDate, 'yyyy-MM-dd'),
          city,
          user_preferences: user.profile.culturalPreferences
        },
        message: 'Prayer time alerts retrieved',
        messageAr: 'تم استرداد تنبيهات أوقات الصلاة'
      });

    } catch (error) {
      console.error('Prayer alerts error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to get prayer time alerts',
          messageAr: 'فشل في الحصول على تنبيهات أوقات الصلاة'
        }
      });
    }
  })
);

// Helper functions

function getNextPrayer(times: any) {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');
  
  const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  for (const prayer of prayerOrder) {
    if (times[prayer] > currentTime) {
      return {
        name: prayer,
        time: times[prayer]
      };
    }
  }
  
  // If all prayers have passed, next is tomorrow's Fajr
  return {
    name: 'fajr',
    time: times.fajr,
    tomorrow: true
  };
}


export default router;