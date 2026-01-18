/**
 * Cultural Intelligence Constants
 * Static data for UAE cultural awareness, holidays, and regional information
 * UAE Work Hub - Cultural Intelligence Engine
 */

// UAE Cities and Prayer Time Calculation Methods
export const UAE_CITIES = {
  'Abu Dhabi': { lat: 24.4539, lng: 54.3773, qibla: 292.5 },
  'Dubai': { lat: 25.2048, lng: 55.2708, qibla: 292.5 },
  'Sharjah': { lat: 25.3463, lng: 55.4209, qibla: 292.2 },
  'Ajman': { lat: 25.4052, lng: 55.5136, qibla: 292.1 },
  'Umm Al Quwain': { lat: 25.5641, lng: 55.5552, qibla: 291.9 },
  'Ras Al Khaimah': { lat: 25.7897, lng: 55.9433, qibla: 291.8 },
  'Fujairah': { lat: 25.1288, lng: 56.3264, qibla: 289.5 },
  'Al Ain': { lat: 24.2075, lng: 55.7447, qibla: 291.2 }
};

// Prayer Time Calculation Methods
export const PRAYER_METHODS = {
  8: 'University of Islamic Sciences, Karachi', // Most common for UAE
  2: 'Islamic Society of North America (ISNA)',
  3: 'Muslim World League',
  4: 'Umm Al-Qura University, Makkah',
  5: 'Egyptian General Authority of Survey',
  7: 'Institute of Geophysics, University of Tehran',
  12: 'Union Organization Islamic de France',
  13: 'Majlis Ugama Islam Singapura',
  15: 'Moonsighting Committee Worldwide',
  16: 'Turkey Directorate of Religious Affairs'
};

// Cultural Nationalities with Working Patterns
export const CULTURAL_WORKING_PATTERNS = {
  'AE': {
    name: 'United Arab Emirates',
    nameAr: 'دولة الإمارات العربية المتحدة',
    standardHours: { start: '09:00', end: '17:00' },
    ramadanHours: { start: '09:00', end: '15:00' },
    weekendDays: ['friday', 'saturday'],
    prayerBreaks: true,
    culturalNotes: {
      en: 'Sunday-Thursday working week. Prayer times observed. Reduced hours during Ramadan.',
      ar: 'أسبوع عمل من الأحد إلى الخميس. مراعاة أوقات الصلاة. ساعات مخففة في رمضان.'
    }
  },
  'SA': {
    name: 'Saudi Arabia',
    nameAr: 'المملكة العربية السعودية',
    standardHours: { start: '08:00', end: '17:00' },
    ramadanHours: { start: '09:00', end: '15:00' },
    weekendDays: ['friday', 'saturday'],
    prayerBreaks: true,
    culturalNotes: {
      en: 'Sunday-Thursday working week. Strict prayer time observance. Early start.',
      ar: 'أسبوع عمل من الأحد إلى الخميس. التزام صارم بأوقات الصلاة. بداية مبكرة.'
    }
  },
  'EG': {
    name: 'Egypt',
    nameAr: 'مصر',
    standardHours: { start: '09:00', end: '17:00' },
    ramadanHours: { start: '09:30', end: '15:30' },
    weekendDays: ['friday', 'saturday'],
    prayerBreaks: true,
    culturalNotes: {
      en: 'Sunday-Thursday working week. Religious holidays widely observed.',
      ar: 'أسبوع عمل من الأحد إلى الخميس. مراعاة واسعة للعطل الدينية.'
    }
  },
  'LB': {
    name: 'Lebanon',
    nameAr: 'لبنان',
    standardHours: { start: '08:30', end: '17:30' },
    ramadanHours: { start: '09:00', end: '15:00' },
    weekendDays: ['saturday', 'sunday'],
    prayerBreaks: false,
    culturalNotes: {
      en: 'Monday-Friday working week. Mixed religious practices.',
      ar: 'أسبوع عمل من الاثنين إلى الجمعة. ممارسات دينية متنوعة.'
    }
  },
  'JO': {
    name: 'Jordan',
    nameAr: 'الأردن',
    standardHours: { start: '08:00', end: '16:00' },
    ramadanHours: { start: '09:00', end: '14:00' },
    weekendDays: ['friday', 'saturday'],
    prayerBreaks: true,
    culturalNotes: {
      en: 'Sunday-Thursday working week. Shorter working hours.',
      ar: 'أسبوع عمل من الأحد إلى الخميس. ساعات عمل أقصر.'
    }
  },
  'IN': {
    name: 'India',
    nameAr: 'الهند',
    standardHours: { start: '09:30', end: '18:00' },
    ramadanHours: { start: '09:30', end: '17:00' },
    weekendDays: ['saturday', 'sunday'],
    prayerBreaks: false,
    culturalNotes: {
      en: 'Monday-Friday working week. Multiple religious festivals throughout the year.',
      ar: 'أسبوع عمل من الاثنين إلى الجمعة. مهرجانات دينية متعددة على مدار السنة.'
    }
  },
  'PH': {
    name: 'Philippines',
    nameAr: 'الفلبين',
    standardHours: { start: '08:00', end: '17:00' },
    weekendDays: ['saturday', 'sunday'],
    prayerBreaks: false,
    culturalNotes: {
      en: 'Monday-Friday working week. Strong emphasis on family time during weekends.',
      ar: 'أسبوع عمل من الاثنين إلى الجمعة. تركيز قوي على الوقت العائلي في عطل نهاية الأسبوع.'
    }
  },
  'PK': {
    name: 'Pakistan',
    nameAr: 'باكستان',
    standardHours: { start: '09:00', end: '17:00' },
    ramadanHours: { start: '09:00', end: '15:00' },
    weekendDays: ['saturday', 'sunday'],
    prayerBreaks: true,
    culturalNotes: {
      en: 'Monday-Friday working week. Prayer times strictly observed.',
      ar: 'أسبوع عمل من الاثنين إلى الجمعة. التزام صارم بأوقات الصلاة.'
    }
  },
  'BD': {
    name: 'Bangladesh',
    nameAr: 'بنغلاديش',
    standardHours: { start: '09:00', end: '17:00' },
    ramadanHours: { start: '09:00', end: '15:30' },
    weekendDays: ['friday', 'saturday'],
    prayerBreaks: true,
    culturalNotes: {
      en: 'Sunday-Thursday working week. Religious practices observed.',
      ar: 'أسبوع عمل من الأحد إلى الخميس. مراعاة الممارسات الدينية.'
    }
  }
};

// Islamic Calendar Months
export const ISLAMIC_MONTHS = [
  { name: 'Muharram', nameAr: 'محرم', number: 1, significance: 'Sacred month, Islamic New Year' },
  { name: 'Safar', nameAr: 'صفر', number: 2, significance: 'Second sacred month' },
  { name: 'Rabi al-awwal', nameAr: 'ربيع الأول', number: 3, significance: 'Birth of Prophet Muhammad (PBUH)' },
  { name: 'Rabi al-thani', nameAr: 'ربيع الآخر', number: 4, significance: 'Fourth month' },
  { name: 'Jumada al-awwal', nameAr: 'جمادى الأولى', number: 5, significance: 'Fifth month' },
  { name: 'Jumada al-thani', nameAr: 'جمادى الآخرة', number: 6, significance: 'Sixth month' },
  { name: 'Rajab', nameAr: 'رجب', number: 7, significance: 'Sacred month, Isra and Miraj' },
  { name: 'Shaban', nameAr: 'شعبان', number: 8, significance: 'Month before Ramadan' },
  { name: 'Ramadan', nameAr: 'رمضان', number: 9, significance: 'Fasting month, Quran revelation' },
  { name: 'Shawwal', nameAr: 'شوال', number: 10, significance: 'Eid al-Fitr celebration' },
  { name: 'Dhu al-Qadah', nameAr: 'ذو القعدة', number: 11, significance: 'Sacred month, pre-Hajj' },
  { name: 'Dhu al-Hijjah', nameAr: 'ذو الحجة', number: 12, significance: 'Hajj pilgrimage, Eid al-Adha' }
];

// UAE National Holidays (Fixed dates)
export const UAE_FIXED_HOLIDAYS = [
  {
    name: 'New Year Day',
    nameAr: 'رأس السنة الميلادية',
    date: '01-01',
    type: 'public',
    description: 'Beginning of the Gregorian calendar year',
    descriptionAr: 'بداية السنة الميلادية'
  },
  {
    name: 'UAE National Day',
    nameAr: 'اليوم الوطني للإمارات',
    date: '12-02',
    type: 'national',
    description: 'Celebrates the unification of the Emirates in 1971',
    descriptionAr: 'يحتفل بتوحيد الإمارات في عام 1971'
  },
  {
    name: 'Commemoration Day',
    nameAr: 'يوم الشهيد',
    date: '11-30',
    type: 'national',
    description: 'Honors Emirati martyrs who sacrificed for the nation',
    descriptionAr: 'تكريم الشهداء الإماراتيين الذين ضحوا من أجل الوطن'
  }
];

// Common Islamic Holidays (Variable dates based on Islamic calendar)
export const ISLAMIC_HOLIDAYS_TEMPLATE = [
  {
    name: 'Eid Al Fitr',
    nameAr: 'عيد الفطر',
    islamicDate: '01-10', // 1st Shawwal
    duration: 3,
    type: 'religious',
    description: 'Festival of Breaking the Fast, celebrating the end of Ramadan',
    descriptionAr: 'عيد الفطر، يحتفل بانتهاء شهر رمضان'
  },
  {
    name: 'Eid Al Adha',
    nameAr: 'عيد الأضحى',
    islamicDate: '10-12', // 10th Dhu al-Hijjah
    duration: 4,
    type: 'religious',
    description: 'Festival of Sacrifice, commemorating Abraham\'s willingness to sacrifice his son',
    descriptionAr: 'عيد الأضحى، إحياء ذكرى استعداد إبراهيم للتضحية بابنه'
  },
  {
    name: 'Islamic New Year',
    nameAr: 'رأس السنة الهجرية',
    islamicDate: '01-01', // 1st Muharram
    duration: 1,
    type: 'religious',
    description: 'Beginning of the Islamic calendar year',
    descriptionAr: 'بداية السنة الهجرية'
  },
  {
    name: 'Day of Ashura',
    nameAr: 'يوم عاشوراء',
    islamicDate: '10-01', // 10th Muharram
    duration: 1,
    type: 'religious',
    description: 'Day of mourning and remembrance',
    descriptionAr: 'يوم الحزن والذكرى'
  },
  {
    name: 'Mawlid Al Nabi',
    nameAr: 'المولد النبوي',
    islamicDate: '12-03', // 12th Rabi al-awwal
    duration: 1,
    type: 'religious',
    description: 'Birthday of Prophet Muhammad (Peace Be Upon Him)',
    descriptionAr: 'مولد النبي محمد صلى الله عليه وسلم'
  },
  {
    name: 'Isra and Miraj',
    nameAr: 'الإسراء والمعراج',
    islamicDate: '27-07', // 27th Rajab
    duration: 1,
    type: 'religious',
    description: 'Night Journey and Ascension of Prophet Muhammad',
    descriptionAr: 'رحلة الإسراء والمعراج للنبي محمد'
  }
];

// Prayer Times Names in Different Languages
export const PRAYER_NAMES = {
  fajr: { en: 'Fajr', ar: 'الفجر', description: 'Dawn prayer' },
  sunrise: { en: 'Sunrise', ar: 'الشروق', description: 'Sunrise time' },
  dhuhr: { en: 'Dhuhr', ar: 'الظهر', description: 'Noon prayer' },
  asr: { en: 'Asr', ar: 'العصر', description: 'Afternoon prayer' },
  maghrib: { en: 'Maghrib', ar: 'المغرب', description: 'Sunset prayer' },
  isha: { en: 'Isha', ar: 'العشاء', description: 'Night prayer' }
};

// Cultural Conflict Severity Levels
export const CONFLICT_SEVERITY = {
  LOW: { level: 'low', color: '#28a745', priority: 1 },
  MEDIUM: { level: 'medium', color: '#ffc107', priority: 2 },
  HIGH: { level: 'high', color: '#dc3545', priority: 3 },
  CRITICAL: { level: 'critical', color: '#6f42c1', priority: 4 }
};

// Common Cultural Meeting Recommendations
export const CULTURAL_RECOMMENDATIONS = {
  PRAYER_CONFLICT: {
    en: [
      'Schedule meeting to avoid prayer times with 15-minute buffer',
      'Consider shorter meeting duration during prayer times',
      'Provide break time for prayers if meeting is long'
    ],
    ar: [
      'جدولة الاجتماع لتجنب أوقات الصلاة مع فاصل 15 دقيقة',
      'النظر في مدة اجتماع أقصر أثناء أوقات الصلاة',
      'توفير وقت للاستراحة للصلاة إذا كان الاجتماع طويلاً'
    ]
  },
  RAMADAN: {
    en: [
      'Keep meetings shorter during Ramadan (max 90 minutes)',
      'Avoid scheduling during Iftar time (sunset)',
      'Consider energy levels during fasting hours',
      'Provide flexibility for pre-dawn Suhoor time'
    ],
    ar: [
      'إبقاء الاجتماعات أقصر خلال رمضان (حد أقصى 90 دقيقة)',
      'تجنب الجدولة أثناء وقت الإفطار (المغرب)',
      'مراعاة مستويات الطاقة خلال ساعات الصيام',
      'توفير المرونة لوقت السحور قبل الفجر'
    ]
  },
  HOLIDAY: {
    en: [
      'Reschedule to avoid cultural or national holidays',
      'Expect reduced attendance on cultural holidays',
      'Send advanced notice for meetings near holidays'
    ],
    ar: [
      'إعادة الجدولة لتجنب العطل الثقافية أو الوطنية',
      'توقع حضور مخفف في العطل الثقافية',
      'إرسال إشعار مسبق للاجتماعات القريبة من العطل'
    ]
  },
  WEEKEND: {
    en: [
      'Consider regional weekend differences when scheduling',
      'UAE weekend is Friday-Saturday, Western is Saturday-Sunday',
      'Provide alternative times for participants with different weekends'
    ],
    ar: [
      'مراعاة الاختلافات الإقليمية في عطل نهاية الأسبوع عند الجدولة',
      'عطلة الإمارات الجمعة-السبت، الغربية السبت-الأحد',
      'توفير أوقات بديلة للمشاركين مع عطل نهاية أسبوع مختلفة'
    ]
  }
};

// Time Zone Data for Regional Context
export const UAE_TIMEZONE = 'Asia/Dubai';
export const GULF_TIMEZONES = {
  'AE': 'Asia/Dubai',     // UTC+4
  'SA': 'Asia/Riyadh',    // UTC+3
  'KW': 'Asia/Kuwait',    // UTC+3
  'QA': 'Asia/Qatar',     // UTC+3
  'BH': 'Asia/Bahrain',   // UTC+3
  'OM': 'Asia/Muscat',    // UTC+4
};

// Default Meeting Times That Avoid Common Conflicts
export const SAFE_MEETING_TIMES = [
  { time: '09:00', reason: 'After Fajr prayer, good energy levels' },
  { time: '10:00', reason: 'Mid-morning, avoids prayer conflicts' },
  { time: '11:00', reason: 'Late morning, pre-Dhuhr' },
  { time: '14:00', reason: 'After Dhuhr prayer' },
  { time: '15:00', reason: 'Mid-afternoon, before Asr' },
  { time: '16:00', reason: 'Late afternoon, good for wrap-up meetings' }
];

// Ramadan Schedule Adjustments
export const RAMADAN_ADJUSTMENTS = {
  maxMeetingDuration: 90, // minutes
  avoidTimes: [
    { start: '18:00', end: '20:00', reason: 'Iftar time' },
    { start: '04:00', end: '06:00', reason: 'Suhoor time' }
  ],
  recommendedTimes: [
    { start: '09:00', end: '11:00', reason: 'Morning energy' },
    { start: '14:00', end: '16:00', reason: 'Afternoon focus' }
  ],
  culturalNotes: {
    en: 'During Ramadan, energy levels fluctuate due to fasting. Schedule shorter meetings and avoid meal times.',
    ar: 'خلال رمضان، تتقلب مستويات الطاقة بسبب الصيام. جدولة اجتماعات أقصر وتجنب أوقات الوجبات.'
  }
};

// Export all constants as a single object for easier import
export const CULTURAL_CONSTANTS = {
  UAE_CITIES,
  PRAYER_METHODS,
  CULTURAL_WORKING_PATTERNS,
  ISLAMIC_MONTHS,
  UAE_FIXED_HOLIDAYS,
  ISLAMIC_HOLIDAYS_TEMPLATE,
  PRAYER_NAMES,
  CONFLICT_SEVERITY,
  CULTURAL_RECOMMENDATIONS,
  UAE_TIMEZONE,
  GULF_TIMEZONES,
  SAFE_MEETING_TIMES,
  RAMADAN_ADJUSTMENTS
};