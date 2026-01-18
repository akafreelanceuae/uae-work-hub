/**
 * Cultural Intelligence Service
 * Core business logic for cultural awareness, prayer times, holidays, and conflict detection
 * UAE Work Hub - Cultural Intelligence Engine
 */

import { format, parseISO, isWithinInterval, addMinutes } from 'date-fns';
import HijriDate from 'hijri-converter';
import axios from 'axios';
import { getCache, setCache } from './redis-dev.js';

// Types and interfaces
export interface PrayerTimes {
  city: string;
  date: string;
  times: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
  timesAr: {
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
  qibla_direction: number;
  method_name: string;
}

export interface Holiday {
  name: string;
  nameAr: string;
  date: string;
  type: 'public' | 'national' | 'religious' | 'cultural';
  is_religious: boolean;
  duration_days?: number;
  description?: string;
}

export interface CulturalConflict {
  type: 'prayer_time' | 'holiday' | 'weekend' | 'ramadan' | 'cultural_event';
  severity: 'low' | 'medium' | 'high';
  description: string;
  descriptionAr: string;
  affectedParticipants?: number;
  recommendations?: string[];
  suggestedAlternatives?: string[];
}

export interface CulturalPreferences {
  nationality: string;
  language: 'en' | 'ar' | 'both';
  prayerTimeAlerts: boolean;
  ramadanMode: boolean;
  culturalHolidays: boolean;
  workingHours: {
    start: string;
    end: string;
    timezone: string;
  };
  weekendDays: string[];
}

export interface MeetingCulturalContext {
  startTime: Date;
  endTime: Date;
  duration: number;
  participants: Array<{
    nationality: string;
    culturalPreferences: CulturalPreferences;
  }>;
  location: string;
  timezone: string;
}

export interface CulturalIntelligenceResult {
  conflicts: CulturalConflict[];
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  recommendationsAr: string[];
  suggestedTimes: string[];
  culturalContext: {
    isHoliday: boolean;
    isWeekend: boolean;
    isRamadan: boolean;
    prayerTimesConflict: boolean;
    hijriDate: string;
  };
}

/**
 * Cultural Intelligence Service Class
 */
export class CulturalIntelligenceService {
  private static instance: CulturalIntelligenceService;
  private prayerApiEndpoint: string;
  private hijriApiEndpoint: string;

  private constructor() {
    this.prayerApiEndpoint = process.env.PRAYER_TIMES_API || 'https://api.aladhan.com/v1';
    this.hijriApiEndpoint = process.env.HIJRI_CALENDAR_API || 'https://api.aladhan.com/v1';
  }

  public static getInstance(): CulturalIntelligenceService {
    if (!CulturalIntelligenceService.instance) {
      CulturalIntelligenceService.instance = new CulturalIntelligenceService();
    }
    return CulturalIntelligenceService.instance;
  }

  /**
   * Get prayer times for a specific city and date
   */
  async getPrayerTimes(city: string, date: Date, method: number = 8): Promise<PrayerTimes> {
    const cacheKey = `prayer:${city}:${format(date, 'yyyy-MM-dd')}:${method}`;
    
    try {
      // Check cache first
      const cached = await getCache(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from API (mock implementation - replace with actual API)
      const prayerTimes = await this.fetchPrayerTimesFromAPI(city, date, method);
      
      // Cache for 1 day
      await setCache(cacheKey, JSON.stringify(prayerTimes), 86400);
      
      return prayerTimes;
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      // Return default times for Dubai if API fails
      return this.getDefaultPrayerTimes(city, date);
    }
  }

  /**
   * Get UAE and international holidays
   */
  async getHolidays(year: number, nationalities: string[] = ['AE']): Promise<Holiday[]> {
    const cacheKey = `holidays:${year}:${nationalities.sort().join(',')}`;
    
    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const allHolidays: Holiday[] = [];
      
      // Get UAE holidays
      const uaeHolidays = await this.getUAEHolidays(year);
      allHolidays.push(...uaeHolidays);

      // Get cultural holidays for each nationality
      for (const nationality of nationalities) {
        if (nationality !== 'AE') {
          const culturalHolidays = await this.getCulturalHolidays(nationality, year);
          allHolidays.push(...culturalHolidays);
        }
      }

      // Remove duplicates and sort by date
      const uniqueHolidays = this.removeDuplicateHolidays(allHolidays);
      uniqueHolidays.sort((a, b) => a.date.localeCompare(b.date));

      // Cache for 30 days
      await setCache(cacheKey, JSON.stringify(uniqueHolidays), 2592000);
      
      return uniqueHolidays;
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return [];
    }
  }

  /**
   * Analyze meeting for cultural conflicts
   */
  async analyzeMeetingCulturalContext(context: MeetingCulturalContext): Promise<CulturalIntelligenceResult> {
    const conflicts: CulturalConflict[] = [];
    const startTime = context.startTime;
    const endTime = context.endTime;

    // Check prayer time conflicts
    const prayerConflicts = await this.checkPrayerTimeConflicts(context);
    conflicts.push(...prayerConflicts);

    // Check holiday conflicts
    const holidayConflicts = await this.checkHolidayConflicts(context);
    conflicts.push(...holidayConflicts);

    // Check weekend conflicts
    const weekendConflicts = this.checkWeekendConflicts(context);
    conflicts.push(...weekendConflicts);

    // Check Ramadan conflicts
    const ramadanConflicts = await this.checkRamadanConflicts(context);
    conflicts.push(...ramadanConflicts);

    // Check cultural working hours
    const workingHourConflicts = this.checkWorkingHourConflicts(context);
    conflicts.push(...workingHourConflicts);

    // Calculate overall severity
    const severity = this.calculateSeverity(conflicts);

    // Generate recommendations
    const recommendations = this.generateRecommendations(conflicts, context);
    const recommendationsAr = this.generateRecommendationsAr(conflicts, context);

    // Suggest alternative times
    const suggestedTimes = await this.suggestAlternativeTimes(context, conflicts);

    // Get cultural context
    const culturalContext = await this.getCulturalContext(startTime);

    return {
      conflicts,
      severity,
      recommendations,
      recommendationsAr,
      suggestedTimes,
      culturalContext
    };
  }

  /**
   * Check if date is during Ramadan
   */
  async isRamadan(date: Date): Promise<boolean> {
    const year = date.getFullYear();
    const ramadanDates = await this.getRamadanDates(year);
    
    return isWithinInterval(date, {
      start: parseISO(ramadanDates.start),
      end: parseISO(ramadanDates.end)
    });
  }

  /**
   * Get Islamic calendar date
   */
  getHijriDate(date: Date): { date: string; month: string; monthAr: string; year: string } {
    const hijriDate = HijriDate.fromGregorian(date.getFullYear(), date.getMonth() + 1, date.getDate());
    
    return {
      date: hijriDate.format('iYYYY-iMM-iDD'),
      month: hijriDate.format('iMMMM'),
      monthAr: this.getArabicMonthName(parseInt(hijriDate.format('iM'))),
      year: hijriDate.format('iYYYY')
    };
  }

  /**
   * Get cultural working hours for nationality
   */
  getCulturalWorkingHours(nationality: string, isRamadan: boolean = false): { start: string; end: string; notes: string } {
    const workingHours: { [key: string]: any } = {
      'AE': {
        standard: { start: '09:00', end: '17:00' },
        ramadan: { start: '09:00', end: '15:00' },
        notes: 'UAE follows Sunday-Thursday working week. During Ramadan, working hours are reduced.'
      },
      'SA': {
        standard: { start: '08:00', end: '17:00' },
        ramadan: { start: '09:00', end: '15:00' },
        notes: 'Saudi Arabia follows Sunday-Thursday working week. Prayer breaks are common.'
      },
      'EG': {
        standard: { start: '09:00', end: '17:00' },
        ramadan: { start: '09:30', end: '15:30' },
        notes: 'Egypt follows Sunday-Thursday working week. Religious holidays are observed.'
      },
      'IN': {
        standard: { start: '09:30', end: '18:00' },
        notes: 'India follows Monday-Friday working week. Multiple religious festivals throughout the year.'
      },
      'PH': {
        standard: { start: '08:00', end: '17:00' },
        notes: 'Philippines follows Monday-Friday working week. Strong emphasis on family time.'
      },
      'PK': {
        standard: { start: '09:00', end: '17:00' },
        ramadan: { start: '09:00', end: '15:00' },
        notes: 'Pakistan follows Monday-Friday working week. Prayer times are strictly observed.'
      }
    };

    const config = workingHours[nationality] || workingHours['AE'];
    const hours = (isRamadan && config.ramadan) ? config.ramadan : config.standard;

    return {
      start: hours.start,
      end: hours.end,
      notes: config.notes
    };
  }

  // Private methods

  private async fetchPrayerTimesFromAPI(city: string, date: Date, method: number): Promise<PrayerTimes> {
    const dateStr = format(date, 'dd-MM-yyyy');
    
    try {
      // Mock API call - in production, use actual prayer times API
      const response = await axios.get(`${this.prayerApiEndpoint}/timings/${dateStr}`, {
        params: { city, country: 'AE', method },
        timeout: 5000
      });

      // Transform API response to our format
      const data = response.data.data;
      return {
        city,
        date: dateStr,
        times: {
          fajr: data.timings.Fajr,
          sunrise: data.timings.Sunrise,
          dhuhr: data.timings.Dhuhr,
          asr: data.timings.Asr,
          maghrib: data.timings.Maghrib,
          isha: data.timings.Isha
        },
        timesAr: {
          fajr: 'الفجر',
          sunrise: 'الشروق',
          dhuhr: 'الظهر',
          asr: 'العصر',
          maghrib: 'المغرب',
          isha: 'العشاء'
        },
        qibla_direction: 292.5, // Dubai
        method_name: data.meta.method.name
      };
    } catch (error) {
      // Fallback to default times
      return this.getDefaultPrayerTimes(city, date);
    }
  }

  private getDefaultPrayerTimes(city: string, date: Date): PrayerTimes {
    const dateStr = format(date, 'dd-MM-yyyy');
    
    // Default prayer times for Dubai (approximate)
    return {
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
  }

  private async getUAEHolidays(year: number): Promise<Holiday[]> {
    const holidays: Holiday[] = [
      {
        name: 'New Year Day',
        nameAr: 'رأس السنة الميلادية',
        date: `${year}-01-01`,
        type: 'public',
        is_religious: false
      },
      {
        name: 'UAE National Day',
        nameAr: 'اليوم الوطني للإمارات',
        date: `${year}-12-02`,
        type: 'national',
        is_religious: false,
        description: 'Celebrates the unification of the Emirates in 1971'
      },
      {
        name: 'Commemoration Day',
        nameAr: 'يوم الشهيد',
        date: `${year}-11-30`,
        type: 'national',
        is_religious: false,
        description: 'Honors Emirati martyrs'
      }
    ];

    // Add Islamic holidays
    const islamicHolidays = await this.getIslamicHolidays(year);
    holidays.push(...islamicHolidays);

    return holidays;
  }

  private async getIslamicHolidays(year: number): Promise<Holiday[]> {
    // In production, use precise Islamic calendar calculations
    // For now, using approximate dates
    return [
      {
        name: 'Eid Al Fitr',
        nameAr: 'عيد الفطر',
        date: `${year}-04-10`, // Approximate
        type: 'religious',
        is_religious: true,
        duration_days: 3,
        description: 'Festival of Breaking the Fast'
      },
      {
        name: 'Eid Al Adha',
        nameAr: 'عيد الأضحى',
        date: `${year}-06-17`, // Approximate
        type: 'religious',
        is_religious: true,
        duration_days: 4,
        description: 'Festival of Sacrifice'
      },
      {
        name: 'Islamic New Year',
        nameAr: 'رأس السنة الهجرية',
        date: `${year}-07-30`, // Approximate
        type: 'religious',
        is_religious: true,
        duration_days: 1
      },
      {
        name: 'Mawlid Al Nabi',
        nameAr: 'المولد النبوي',
        date: `${year}-09-16`, // Approximate
        type: 'religious',
        is_religious: true,
        duration_days: 1,
        description: 'Birthday of Prophet Muhammad (PBUH)'
      }
    ];
  }

  private async getCulturalHolidays(nationality: string, year: number): Promise<Holiday[]> {
    const holidays: { [key: string]: Holiday[] } = {
      'IN': [
        {
          name: 'Diwali',
          nameAr: 'ديوالي',
          date: `${year}-10-31`, // Approximate
          type: 'religious',
          is_religious: true,
          description: 'Festival of Lights'
        },
        {
          name: 'Holi',
          nameAr: 'هولي',
          date: `${year}-03-13`, // Approximate
          type: 'religious',
          is_religious: true,
          description: 'Festival of Colors'
        }
      ],
      'PH': [
        {
          name: 'Rizal Day',
          nameAr: 'يوم ريزال',
          date: `${year}-12-30`,
          type: 'national',
          is_religious: false,
          description: 'National hero José Rizal day'
        }
      ],
      'EG': [
        {
          name: 'Revolution Day',
          nameAr: 'يوم الثورة',
          date: `${year}-07-23`,
          type: 'national',
          is_religious: false,
          description: 'Egyptian Revolution Day'
        }
      ]
    };

    return holidays[nationality] || [];
  }

  private removeDuplicateHolidays(holidays: Holiday[]): Holiday[] {
    const unique = new Map();
    holidays.forEach(holiday => {
      const key = `${holiday.date}-${holiday.name}`;
      if (!unique.has(key)) {
        unique.set(key, holiday);
      }
    });
    return Array.from(unique.values());
  }

  private async checkPrayerTimeConflicts(context: MeetingCulturalContext): Promise<CulturalConflict[]> {
    const conflicts: CulturalConflict[] = [];
    const prayerTimes = await this.getPrayerTimes(context.location, context.startTime);

    for (const [prayer, timeStr] of Object.entries(prayerTimes.times)) {
      const [hour, minute] = timeStr.split(':').map(Number);
      const prayerTime = new Date(context.startTime);
      prayerTime.setHours(hour, minute, 0, 0);

      // Check for conflicts with 15-minute buffer
      const bufferStart = addMinutes(prayerTime, -15);
      const bufferEnd = addMinutes(prayerTime, 15);

      if (isWithinInterval(context.startTime, { start: bufferStart, end: bufferEnd }) ||
          isWithinInterval(context.endTime, { start: bufferStart, end: bufferEnd })) {
        
        const affectedParticipants = context.participants.filter(
          p => p.culturalPreferences.prayerTimeAlerts
        ).length;

        conflicts.push({
          type: 'prayer_time',
          severity: affectedParticipants > 0 ? 'high' : 'medium',
          description: `Meeting conflicts with ${prayer} prayer time (${timeStr})`,
          descriptionAr: `الاجتماع يتعارض مع وقت صلاة ${prayerTimes.timesAr[prayer as keyof typeof prayerTimes.timesAr]} (${timeStr})`,
          affectedParticipants,
          recommendations: [`Consider rescheduling to avoid ${prayer} prayer time`],
          suggestedAlternatives: this.getSuggestedTimesAroundPrayer(prayerTime)
        });
      }
    }

    return conflicts;
  }

  private async checkHolidayConflicts(context: MeetingCulturalContext): Promise<CulturalConflict[]> {
    const conflicts: CulturalConflict[] = [];
    const nationalities = [...new Set(context.participants.map(p => p.nationality))];
    const holidays = await this.getHolidays(context.startTime.getFullYear(), nationalities);

    const dateStr = format(context.startTime, 'yyyy-MM-dd');
    const conflictingHolidays = holidays.filter(h => h.date === dateStr);

    for (const holiday of conflictingHolidays) {
      const affectedParticipants = context.participants.filter(
        p => p.nationality === 'AE' || p.culturalPreferences.culturalHolidays
      ).length;

      conflicts.push({
        type: 'holiday',
        severity: holiday.type === 'national' ? 'high' : 'medium',
        description: `Meeting scheduled on ${holiday.name}`,
        descriptionAr: `الاجتماع مجدول في ${holiday.nameAr}`,
        affectedParticipants,
        recommendations: ['Consider rescheduling to avoid holiday conflicts'],
        suggestedAlternatives: []
      });
    }

    return conflicts;
  }

  private checkWeekendConflicts(context: MeetingCulturalContext): CulturalConflict[] {
    const conflicts: CulturalConflict[] = [];
    const dayOfWeek = context.startTime.getDay();
    
    // Check UAE weekend (Friday-Saturday)
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      const affectedParticipants = context.participants.filter(
        p => ['AE', 'SA', 'EG'].includes(p.nationality)
      ).length;

      conflicts.push({
        type: 'weekend',
        severity: 'medium',
        description: `Meeting scheduled on UAE weekend (${dayOfWeek === 5 ? 'Friday' : 'Saturday'})`,
        descriptionAr: `الاجتماع مجدول في عطلة نهاية الأسبوع (${dayOfWeek === 5 ? 'الجمعة' : 'السبت'})`,
        affectedParticipants,
        recommendations: ['Consider rescheduling to a weekday'],
        suggestedAlternatives: []
      });
    }

    // Check Western weekend for other nationalities
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const affectedParticipants = context.participants.filter(
        p => ['IN', 'PH'].includes(p.nationality)
      ).length;

      if (affectedParticipants > 0) {
        conflicts.push({
          type: 'weekend',
          severity: 'low',
          description: `Meeting scheduled on Western weekend`,
          descriptionAr: `الاجتماع مجدول في عطلة نهاية الأسبوع الغربية`,
          affectedParticipants,
          recommendations: ['Some participants may have limited availability'],
          suggestedAlternatives: []
        });
      }
    }

    return conflicts;
  }

  private async checkRamadanConflicts(context: MeetingCulturalContext): Promise<CulturalConflict[]> {
    const conflicts: CulturalConflict[] = [];
    
    if (await this.isRamadan(context.startTime)) {
      const hour = context.startTime.getHours();
      const duration = context.duration;

      // Check if meeting is during typical Iftar time or very early morning
      if ((hour >= 18 && hour <= 20) || (hour < 6) || duration > 90) {
        const affectedParticipants = context.participants.filter(
          p => p.culturalPreferences.ramadanMode
        ).length;

        conflicts.push({
          type: 'ramadan',
          severity: affectedParticipants > 0 ? 'high' : 'medium',
          description: 'Meeting during Ramadan - consider cultural sensitivities',
          descriptionAr: 'الاجتماع خلال رمضان - يُرجى مراعاة الحساسيات الثقافية',
          affectedParticipants,
          recommendations: [
            'Keep meeting duration under 90 minutes',
            'Avoid scheduling during Iftar time (sunset)',
            'Consider providing refreshments after sunset'
          ],
          suggestedAlternatives: []
        });
      }
    }

    return conflicts;
  }

  private checkWorkingHourConflicts(context: MeetingCulturalContext): CulturalConflict[] {
    const conflicts: CulturalConflict[] = [];
    const meetingHour = context.startTime.getHours();

    // Check if meeting is outside typical working hours
    for (const participant of context.participants) {
      const workingHours = this.getCulturalWorkingHours(
        participant.nationality,
        false // TODO: Check if Ramadan
      );
      
      const startHour = parseInt(workingHours.start.split(':')[0]);
      const endHour = parseInt(workingHours.end.split(':')[0]);

      if (meetingHour < startHour || meetingHour >= endHour) {
        conflicts.push({
          type: 'cultural_event',
          severity: 'low',
          description: `Meeting outside typical working hours for ${participant.nationality} participants`,
          descriptionAr: `الاجتماع خارج ساعات العمل المعتادة للمشاركين من ${participant.nationality}`,
          affectedParticipants: 1,
          recommendations: [`Consider ${participant.nationality} working hours: ${workingHours.start}-${workingHours.end}`],
          suggestedAlternatives: []
        });
        break; // Only add one conflict for working hours
      }
    }

    return conflicts;
  }

  private calculateSeverity(conflicts: CulturalConflict[]): 'low' | 'medium' | 'high' {
    if (conflicts.some(c => c.severity === 'high')) return 'high';
    if (conflicts.some(c => c.severity === 'medium')) return 'medium';
    return 'low';
  }

  private generateRecommendations(conflicts: CulturalConflict[], context: MeetingCulturalContext): string[] {
    const recommendations: string[] = [];

    if (conflicts.some(c => c.type === 'prayer_time')) {
      recommendations.push('Schedule meeting to avoid prayer times with 15-minute buffer');
    }

    if (conflicts.some(c => c.type === 'holiday')) {
      recommendations.push('Reschedule to avoid cultural or national holidays');
    }

    if (conflicts.some(c => c.type === 'ramadan')) {
      recommendations.push('Keep meetings shorter during Ramadan and provide flexibility');
    }

    if (conflicts.some(c => c.type === 'weekend')) {
      recommendations.push('Consider regional weekend differences when scheduling');
    }

    if (recommendations.length === 0) {
      recommendations.push('Meeting time appears culturally appropriate');
    }

    return recommendations;
  }

  private generateRecommendationsAr(conflicts: CulturalConflict[], context: MeetingCulturalContext): string[] {
    const recommendations: string[] = [];

    if (conflicts.some(c => c.type === 'prayer_time')) {
      recommendations.push('جدولة الاجتماع لتجنب أوقات الصلاة مع فاصل زمني 15 دقيقة');
    }

    if (conflicts.some(c => c.type === 'holiday')) {
      recommendations.push('إعادة جدولة لتجنب العطلات الثقافية أو الوطنية');
    }

    if (conflicts.some(c => c.type === 'ramadan')) {
      recommendations.push('إبقاء الاجتماعات أقصر خلال رمضان وتوفير المرونة');
    }

    if (conflicts.some(c => c.type === 'weekend')) {
      recommendations.push('مراعاة الاختلافات الإقليمية في عطل نهاية الأسبوع عند الجدولة');
    }

    if (recommendations.length === 0) {
      recommendations.push('وقت الاجتماع يبدو مناسباً ثقافياً');
    }

    return recommendations;
  }

  private async suggestAlternativeTimes(context: MeetingCulturalContext, conflicts: CulturalConflict[]): Promise<string[]> {
    const suggestions: string[] = [];
    const baseDate = format(context.startTime, 'yyyy-MM-dd');
    
    // Suggest safe times that avoid common conflicts
    const safeTimes = [
      '09:00', '10:00', '11:00', // Morning slots
      '14:00', '15:00', '16:00'  // Afternoon slots
    ];

    for (const time of safeTimes) {
      const suggestedDateTime = `${baseDate}T${time}:00.000Z`;
      
      // Quick check if this time would have fewer conflicts
      const testContext: MeetingCulturalContext = {
        ...context,
        startTime: new Date(suggestedDateTime),
        endTime: addMinutes(new Date(suggestedDateTime), context.duration)
      };

      const testConflicts = await this.analyzeMeetingCulturalContext(testContext);
      
      if (testConflicts.severity === 'low' || testConflicts.conflicts.length < conflicts.length) {
        suggestions.push(suggestedDateTime);
      }

      if (suggestions.length >= 3) break; // Limit to 3 suggestions
    }

    return suggestions;
  }

  private getSuggestedTimesAroundPrayer(prayerTime: Date): string[] {
    const suggestions: string[] = [];
    
    // 1 hour before prayer
    const before = addMinutes(prayerTime, -60);
    suggestions.push(format(before, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
    
    // 1 hour after prayer
    const after = addMinutes(prayerTime, 60);
    suggestions.push(format(after, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
    
    return suggestions;
  }

  private async getCulturalContext(date: Date) {
    const holidays = await this.getHolidays(date.getFullYear());
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    const prayerTimes = await this.getPrayerTimes('Dubai', date);
    
    return {
      isHoliday: holidays.some(h => h.date === dateStr),
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6, // UAE weekend
      isRamadan: await this.isRamadan(date),
      prayerTimesConflict: false, // This would need meeting time to determine
      hijriDate: this.getHijriDate(date).date
    };
  }

  private async getRamadanDates(year: number): Promise<{ start: string; end: string }> {
    // Approximate Ramadan dates - in production, use precise Islamic calendar
    return {
      start: `${year}-03-23`,
      end: `${year}-04-21`
    };
  }

  private getArabicMonthName(monthNumber: number): string {
    const arabicMonths = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
      'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    return arabicMonths[monthNumber - 1] || '';
  }
}

// Export singleton instance
export const culturalIntelligenceService = CulturalIntelligenceService.getInstance();