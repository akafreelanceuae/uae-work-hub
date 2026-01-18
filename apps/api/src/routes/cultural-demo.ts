/**
 * Cultural Intelligence Demo Routes (Public Access)
 * Demonstration endpoints for testing cultural intelligence features without authentication
 * UAE Work Hub - Cultural Intelligence Engine Demo
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { format, addMinutes } from 'date-fns';
import { asyncHandler } from '../middleware/errorHandler.js';
import { culturalIntelligenceService, type MeetingCulturalContext } from '../services/cultural.js';

const router = Router();

// Demo validation schema for cultural conflict checking
const demoConflictCheckSchema = z.object({
  meetingTime: z.string(),
  duration: z.number().min(15).max(480).default(60),
  participants: z.array(z.object({
    nationality: z.string(),
    prayerTimeAlerts: z.boolean().optional().default(false),
    ramadanMode: z.boolean().optional().default(false)
  })).optional().default([])
});

/**
 * Welcome and API documentation for cultural intelligence demo
 * GET /demo/cultural/
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'UAE Work Hub - Cultural Intelligence Demo',
    version: '0.1.0',
    description: 'Public demo endpoints for testing cultural intelligence features',
    descriptionAr: 'نقاط الوصول التجريبية العامة لاختبار ميزات الذكاء الثقافي',
    available_endpoints: {
      prayer_times: {
        endpoint: '/demo/cultural/prayer-times',
        method: 'GET',
        description: 'Get current prayer times for UAE cities',
        parameters: {
          city: 'Dubai (default), Abu Dhabi, Sharjah, etc.',
          date: 'YYYY-MM-DD (optional, defaults to today)'
        }
      },
      holidays: {
        endpoint: '/demo/cultural/holidays',
        method: 'GET', 
        description: 'Get UAE and cultural holidays',
        parameters: {
          year: 'YYYY (optional, defaults to current year)',
          nationality: 'AE, SA, IN, PH, etc. (optional)'
        }
      },
      conflict_check: {
        endpoint: '/demo/cultural/check-conflicts',
        method: 'POST',
        description: 'Check for cultural conflicts in meeting scheduling',
        body: {
          meetingTime: '2025-09-23T14:00:00.000Z',
          duration: 60,
          participants: [
            { nationality: 'AE', prayerTimeAlerts: true, ramadanMode: false },
            { nationality: 'IN', prayerTimeAlerts: false, ramadanMode: false }
          ]
        }
      },
      ramadan_info: {
        endpoint: '/demo/cultural/ramadan',
        method: 'GET',
        description: 'Get Ramadan schedule and cultural considerations'
      },
      islamic_calendar: {
        endpoint: '/demo/cultural/islamic-calendar',
        method: 'GET',
        description: 'Get Islamic calendar information',
        parameters: {
          date: 'YYYY-MM-DD (optional, defaults to today)'
        }
      },
      working_hours: {
        endpoint: '/demo/cultural/working-hours',
        method: 'GET',
        description: 'Get cultural working hours for different nationalities',
        parameters: {
          nationality: 'AE, SA, IN, PH, etc.'
        }
      }
    },
    examples: {
      curl_examples: [
        'curl "http://localhost:5001/demo/cultural/prayer-times?city=Dubai"',
        'curl "http://localhost:5001/demo/cultural/holidays?year=2025&nationality=AE"',
        'curl -X POST "http://localhost:5001/demo/cultural/check-conflicts" -H "Content-Type: application/json" -d \'{"meetingTime":"2025-09-23T14:00:00.000Z","duration":90,"participants":[{"nationality":"AE","prayerTimeAlerts":true}]}\''
      ]
    },
    cultural_intelligence_features: [
      'Prayer time conflict detection',
      'Multi-nationality holiday awareness', 
      'Ramadan scheduling adjustments',
      'Cultural working hours integration',
      'Smart meeting recommendations',
      'Islamic calendar integration',
      'Cross-cultural compromise suggestions'
    ]
  });
});

/**
 * Get current prayer times for UAE cities (Demo)
 * GET /demo/cultural/prayer-times
 */
router.get('/prayer-times',
  asyncHandler(async (req: Request, res: Response) => {
    const { city = 'Dubai', date, method = 8 } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    try {
      const prayerTimes = await culturalIntelligenceService.getPrayerTimes(
        city as string, 
        targetDate, 
        method as number
      );
      
      res.json({
        success: true,
        data: {
          ...prayerTimes,
          demo: true,
          notes: {
            en: 'This is a demo endpoint. Prayer times are approximate for demonstration purposes.',
            ar: 'هذه نقطة وصول تجريبية. أوقات الصلاة تقريبية لأغراض العرض التوضيحي.'
          }
        },
        message: 'Prayer times retrieved successfully (Demo)',
        messageAr: 'تم استرداد أوقات الصلاة بنجاح (تجريبي)'
      });
    } catch (error) {
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
 * Get UAE and cultural holidays (Demo)
 * GET /demo/cultural/holidays
 */
router.get('/holidays',
  asyncHandler(async (req: Request, res: Response) => {
    const { year = new Date().getFullYear(), nationality } = req.query;
    const targetYear = parseInt(year as string);
    
    try {
      const nationalities = nationality ? [nationality as string, 'AE'] : ['AE'];
      const holidays = await culturalIntelligenceService.getHolidays(targetYear, nationalities);
      
      res.json({
        success: true,
        data: {
          holidays,
          year: targetYear,
          nationalities_included: nationalities,
          total_holidays: holidays.length,
          religious_holidays: holidays.filter(h => h.is_religious).length,
          national_holidays: holidays.filter(h => h.type === 'national').length,
          demo: true
        },
        message: 'Holidays retrieved successfully (Demo)',
        messageAr: 'تم استرداد العطلات بنجاح (تجريبي)'
      });
    } catch (error) {
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
 * Check for cultural conflicts in meeting scheduling (Demo)
 * POST /demo/cultural/check-conflicts
 */
router.post('/check-conflicts',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const validatedData = demoConflictCheckSchema.parse(req.body);
      
      const meetingStart = new Date(validatedData.meetingTime);
      const meetingEnd = addMinutes(meetingStart, validatedData.duration);
      
      // Create cultural context for the meeting
      const meetingContext: MeetingCulturalContext = {
        startTime: meetingStart,
        endTime: meetingEnd,
        duration: validatedData.duration,
        participants: validatedData.participants.map(p => ({
          nationality: p.nationality,
          culturalPreferences: {
            nationality: p.nationality,
            language: 'en' as const,
            prayerTimeAlerts: p.prayerTimeAlerts || false,
            ramadanMode: p.ramadanMode || false,
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
      
      res.json({
        success: true,
        data: {
          meeting_analysis: {
            conflicts: analysisResult.conflicts,
            meeting_time: validatedData.meetingTime,
            duration_minutes: validatedData.duration,
            has_conflicts: analysisResult.conflicts.length > 0,
            severity: analysisResult.severity,
            participants_count: validatedData.participants.length
          },
          cultural_intelligence: {
            recommendations: analysisResult.recommendations,
            recommendations_ar: analysisResult.recommendationsAr,
            suggested_times: analysisResult.suggestedTimes,
            cultural_context: analysisResult.culturalContext
          },
          analysis_summary: {
            total_conflicts: analysisResult.conflicts.length,
            high_priority_conflicts: analysisResult.conflicts.filter(c => c.severity === 'high').length,
            medium_priority_conflicts: analysisResult.conflicts.filter(c => c.severity === 'medium').length,
            low_priority_conflicts: analysisResult.conflicts.filter(c => c.severity === 'low').length,
            conflict_types: [...new Set(analysisResult.conflicts.map(c => c.type))],
            is_holiday: analysisResult.culturalContext.isHoliday,
            is_weekend: analysisResult.culturalContext.isWeekend,
            is_ramadan: analysisResult.culturalContext.isRamadan,
            hijri_date: analysisResult.culturalContext.hijriDate
          },
          demo: true,
          notes: {
            en: 'This is a demo analysis. In production, this would integrate with real calendar systems and user preferences.',
            ar: 'هذا تحليل تجريبي. في الإنتاج، سيتكامل هذا مع أنظمة التقويم الحقيقية وتفضيلات المستخدم.'
          }
        },
        message: analysisResult.conflicts.length > 0 ? 'Cultural conflicts detected (Demo)' : 'No cultural conflicts found (Demo)',
        messageAr: analysisResult.conflicts.length > 0 ? 'تم اكتشاف تعارضات ثقافية (تجريبي)' : 'لم يتم العثور على تعارضات ثقافية (تجريبي)'
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Invalid request data',
            messageAr: 'بيانات الطلب غير صحيحة',
            validation_errors: error.errors
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            message: 'Failed to analyze cultural conflicts',
            messageAr: 'فشل في تحليل التعارضات الثقافية'
          }
        });
      }
    }
  })
);

/**
 * Get Ramadan schedule and information (Demo)
 * GET /demo/cultural/ramadan
 */
router.get('/ramadan',
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
        cultural_adjustments: {
          recommended_meeting_hours: ['09:00-11:00', '14:00-16:00'],
          avoid_hours: ['12:00-13:30', '18:00-19:30'],
          max_meeting_duration_minutes: 90,
          iftar_considerations: {
            en: 'Schedule meetings to end at least 30 minutes before Maghrib prayer',
            ar: 'جدولة الاجتماعات لتنتهي قبل صلاة المغرب بـ30 دقيقة على الأقل'
          },
          suhoor_considerations: {
            en: 'Early morning meetings may have lower attendance during Suhoor time',
            ar: 'الاجتماعات المبكرة قد تشهد حضوراً أقل أثناء وقت السحور'
          }
        },
        cultural_notes: {
          en: 'During Ramadan, consider shorter meetings and avoid scheduling during Iftar time',
          ar: 'خلال رمضان، يُنصح بالاجتماعات القصيرة وتجنب وقت الإفطار'
        },
        demo: true
      };
      
      res.json({
        success: true,
        data: ramadanInfo,
        message: 'Ramadan information retrieved successfully (Demo)',
        messageAr: 'تم استرداد معلومات رمضان بنجاح (تجريبي)'
      });
    } catch (error) {
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
 * Get Islamic calendar information (Demo)
 * GET /demo/cultural/islamic-calendar
 */
router.get('/islamic-calendar',
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
        cultural_context: {
          is_weekend: (targetDate.getDay() === 5 || targetDate.getDay() === 6),
          is_ramadan: isCurrentlyRamadan,
          weekend_type: 'UAE (Friday-Saturday)',
          prayer_times_available: true
        },
        prayer_times_summary: {
          fajr: prayerTimes.times.fajr,
          dhuhr: prayerTimes.times.dhuhr,
          asr: prayerTimes.times.asr,
          maghrib: prayerTimes.times.maghrib,
          isha: prayerTimes.times.isha
        },
        demo: true,
        notes: {
          en: 'Hijri dates are calculated using astronomical algorithms and may vary slightly from local moon sighting.',
          ar: 'التواريخ الهجرية محسوبة باستخدام خوارزميات فلكية وقد تختلف قليلاً عن رؤية الهلال المحلية.'
        }
      };
      
      res.json({
        success: true,
        data: islamicInfo,
        message: 'Islamic calendar information retrieved (Demo)',
        messageAr: 'تم استرداد معلومات التقويم الإسلامي (تجريبي)'
      });
    } catch (error) {
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
 * Get cultural working hours for different nationalities (Demo)
 * GET /demo/cultural/working-hours
 */
router.get('/working-hours',
  asyncHandler(async (req: Request, res: Response) => {
    const { nationality = 'AE', date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    try {
      const isCurrentlyRamadan = await culturalIntelligenceService.isRamadan(targetDate);
      const workingHours = culturalIntelligenceService.getCulturalWorkingHours(
        nationality as string, 
        isCurrentlyRamadan
      );
      
      const workingHoursInfo = {
        nationality: nationality as string,
        date: format(targetDate, 'yyyy-MM-dd'),
        working_hours: {
          start: workingHours.start,
          end: workingHours.end,
          duration_hours: calculateHoursDifference(workingHours.start, workingHours.end)
        },
        cultural_adjustments: {
          is_ramadan_adjusted: isCurrentlyRamadan,
          ramadan_reduction_hours: isCurrentlyRamadan ? 2 : 0,
          weekend_days: nationality === 'AE' || nationality === 'SA' ? ['friday', 'saturday'] : ['saturday', 'sunday'],
          prayer_breaks_included: ['AE', 'SA', 'EG', 'PK', 'BD'].includes(nationality as string)
        },
        cultural_notes: workingHours.notes,
        recommendations: {
          best_meeting_times: getBestMeetingTimes(workingHours, isCurrentlyRamadan),
          avoid_times: getAvoidTimes(nationality as string, isCurrentlyRamadan),
          timezone_considerations: {
            en: 'Consider time zone differences when scheduling with international participants',
            ar: 'اعتبار اختلاف المناطق الزمنية عند الجدولة مع المشاركين الدوليين'
          }
        },
        demo: true
      };
      
      res.json({
        success: true,
        data: workingHoursInfo,
        message: 'Working hours information retrieved (Demo)',
        messageAr: 'تم استرداد معلومات ساعات العمل (تجريبي)'
      });
    } catch (error) {
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

// Helper functions
function calculateHoursDifference(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
}

function getBestMeetingTimes(workingHours: any, isRamadan: boolean): string[] {
  if (isRamadan) {
    return ['09:00-11:00', '14:00-15:30'];
  }
  return ['09:00-11:00', '14:00-16:00', '16:30-17:00'];
}

function getAvoidTimes(nationality: string, isRamadan: boolean): string[] {
  const avoidTimes = [];
  
  if (['AE', 'SA', 'EG'].includes(nationality)) {
    avoidTimes.push('12:00-13:30'); // Dhuhr prayer time
    avoidTimes.push('15:30-16:00'); // Asr prayer time
  }
  
  if (isRamadan) {
    avoidTimes.push('18:00-19:30'); // Iftar time
    avoidTimes.push('04:30-06:00'); // Suhoor time
  }
  
  return avoidTimes;
}

export default router;