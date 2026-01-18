/**
 * Cultural Intelligence Utilities
 * Helper functions for cultural awareness, date conversions, and formatting
 * UAE Work Hub - Cultural Intelligence Engine
 */

import { format, parseISO, isValid, addDays, subDays, startOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { 
  UAE_TIMEZONE, 
  PRAYER_NAMES, 
  ISLAMIC_MONTHS, 
  CULTURAL_WORKING_PATTERNS,
  CONFLICT_SEVERITY
} from '../constants/cultural.js';

/**
 * Date and Time Utilities
 */

/**
 * Convert date to UAE timezone
 */
export function toUAETime(date: Date): Date {
  return toZonedTime(date, UAE_TIMEZONE);
}

/**
 * Convert UAE time to UTC
 */
export function fromUAETime(date: Date): Date {
  return fromZonedTime(date, UAE_TIMEZONE);
}

/**
 * Get current UAE time
 */
export function getCurrentUAETime(): Date {
  return toUAETime(new Date());
}

/**
 * Format time for UAE locale (24-hour format)
 */
export function formatUAETime(date: Date, includeSeconds: boolean = false): string {
  const uaeTime = toUAETime(date);
  const formatString = includeSeconds ? 'HH:mm:ss' : 'HH:mm';
  return format(uaeTime, formatString);
}

/**
 * Format date for UAE locale
 */
export function formatUAEDate(date: Date, formatString: string = 'yyyy-MM-dd'): string {
  const uaeTime = toUAETime(date);
  return format(uaeTime, formatString);
}

/**
 * Parse date string in UAE timezone
 */
export function parseUAEDate(dateString: string): Date {
  const parsed = parseISO(dateString);
  if (!isValid(parsed)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return fromUAETime(parsed);
}

/**
 * Islamic Calendar Utilities
 */

/**
 * Convert Gregorian date to Islamic (Hijri) date
 */
interface IslamicDateInfo {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
  formatted: string;
  formattedAr: string;
  iso: string;
}

export function toIslamicDate(gregorianDate: Date): IslamicDateInfo | null {
  // Placeholder implementation: precise Hijri conversion requires a reliable library or API.
  // For now, return null to avoid incorrect calculations.
  try {
    void gregorianDate;
    return null;
  } catch (error) {
    console.error('Error converting to Islamic date:', error);
    return null;
  }
}

/**
 * Convert Islamic (Hijri) date to Gregorian date
 */
export function fromIslamicDate(islamicYear: number, islamicMonth: number, islamicDay: number): Date | null {
  // Placeholder implementation: precise Hijri conversion requires a reliable library or API.
  try {
    void islamicYear; void islamicMonth; void islamicDay;
    return null;
  } catch (error) {
    console.error('Error converting from Islamic date:', error);
    return null;
  }
}

/**
 * Get Islamic month name in Arabic
 */
export function getIslamicMonthName(monthNumber: number): string {
  const month = ISLAMIC_MONTHS.find(m => m.number === monthNumber);
  return month ? month.nameAr : '';
}

/**
 * Get Islamic month significance
 */
export function getIslamicMonthSignificance(monthNumber: number): string {
  const month = ISLAMIC_MONTHS.find(m => m.number === monthNumber);
  return month ? month.significance : '';
}

/**
 * Check if current Islamic month is Ramadan
 */
export function isCurrentlyRamadan(date: Date = new Date()): boolean {
  const islamicDate = toIslamicDate(date);
  return islamicDate ? islamicDate.month === 9 : false;
}

/**
 * Text and Localization Utilities
 */

/**
 * Convert English numbers to Arabic numerals
 */
export function convertToArabicNumbers(text: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return text.replace(/[0-9]/g, (match) => arabicNumerals[Number(match)] ?? match);
}

/**
 * Convert Arabic numerals to English numbers
 */
export function convertFromArabicNumbers(text: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = text;
  arabicNumerals.forEach((numeral, index) => {
    result = result.replace(new RegExp(numeral, 'g'), index.toString());
  });
  return result;
}

/**
 * Format prayer name in both languages
 */
export function formatPrayerName(prayerKey: string, language: 'en' | 'ar' | 'both' = 'both') {
  const prayer = PRAYER_NAMES[prayerKey as keyof typeof PRAYER_NAMES];
  if (!prayer) return prayerKey;

  switch (language) {
    case 'en':
      return prayer.en;
    case 'ar':
      return prayer.ar;
    case 'both':
      return `${prayer.en} / ${prayer.ar}`;
    default:
      return prayer.en;
  }
}

/**
 * Cultural Working Hours Utilities
 */

/**
 * Check if time is within working hours for a nationality
 */
export function isWithinWorkingHours(
  time: Date, 
  nationality: string, 
  isRamadan: boolean = false
): boolean {
  const pattern = CULTURAL_WORKING_PATTERNS[nationality as keyof typeof CULTURAL_WORKING_PATTERNS] as any;
  if (!pattern) return true; // Default to allow if pattern not found

  const hours = isRamadan && pattern.ramadanHours ? pattern.ramadanHours : pattern.standardHours;
  const timeString = formatUAETime(time);
  
  return timeString >= hours.start && timeString <= hours.end;
}

/**
 * Get working hours for nationality
 */
export function getWorkingHours(nationality: string, isRamadan: boolean = false) {
  const pattern = CULTURAL_WORKING_PATTERNS[nationality as keyof typeof CULTURAL_WORKING_PATTERNS] as any;
  if (!pattern) return { start: '09:00', end: '17:00' }; // Default hours

  return isRamadan && pattern.ramadanHours ? pattern.ramadanHours : pattern.standardHours;
}

/**
 * Check if date is weekend for nationality
 */
export function isWeekendForNationality(date: Date, nationality: string): boolean {
  const pattern = CULTURAL_WORKING_PATTERNS[nationality as keyof typeof CULTURAL_WORKING_PATTERNS];
  if (!pattern) return false;

  const dayName = format(date, 'EEEE').toLowerCase();
  return pattern.weekendDays.includes(dayName);
}

/**
 * Get cultural notes for nationality
 */
export function getCulturalNotes(nationality: string, language: 'en' | 'ar' = 'en'): string {
  const pattern = CULTURAL_WORKING_PATTERNS[nationality as keyof typeof CULTURAL_WORKING_PATTERNS];
  if (!pattern) return '';

  return pattern.culturalNotes[language] || pattern.culturalNotes.en;
}

/**
 * Prayer Time Utilities
 */

/**
 * Calculate time until next prayer
 */
export function getTimeUntilNextPrayer(currentTime: Date, prayerTimes: any): {
  nextPrayer: string;
  nextPrayerAr: string;
  timeUntil: string;
  minutesUntil: number;
} | null {
  const currentTimeStr = formatUAETime(currentTime);
  const prayerOrder = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  
  for (const prayer of prayerOrder) {
    if (prayerTimes[prayer] && prayerTimes[prayer] > currentTimeStr) {
      const [prayerHour, prayerMinute] = prayerTimes[prayer].split(':').map(Number);
      const prayerDateTime = new Date(currentTime);
      prayerDateTime.setHours(prayerHour, prayerMinute, 0, 0);
      
      const minutesUntil = Math.floor((prayerDateTime.getTime() - currentTime.getTime()) / 60000);
      const hours = Math.floor(minutesUntil / 60);
      const minutes = minutesUntil % 60;
      
      return {
        nextPrayer: prayer,
        nextPrayerAr: PRAYER_NAMES[prayer as keyof typeof PRAYER_NAMES].ar,
        timeUntil: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
        minutesUntil
      };
    }
  }

  // If all prayers have passed, next is tomorrow's Fajr
  const minutesUntilMidnight = Math.floor((startOfDay(addDays(currentTime, 1)).getTime() - currentTime.getTime()) / 60000);
  const fajrMinutes = prayerTimes.fajr ? 
    parseInt(prayerTimes.fajr.split(':')[0]) * 60 + parseInt(prayerTimes.fajr.split(':')[1]) : 
    5 * 60 + 15; // Default Fajr at 5:15

  const totalMinutesUntilFajr = minutesUntilMidnight + fajrMinutes;
  const hours = Math.floor(totalMinutesUntilFajr / 60);
  const minutes = totalMinutesUntilFajr % 60;

  return {
    nextPrayer: 'fajr',
    nextPrayerAr: 'الفجر',
    timeUntil: `${hours}h ${minutes}m (tomorrow)`,
    minutesUntil: totalMinutesUntilFajr
  };
}

/**
 * Check if time conflicts with prayer time
 */
export function conflictsWithPrayer(
  startTime: Date, 
  endTime: Date, 
  prayerTimes: any,
  bufferMinutes: number = 15
): { conflicts: boolean; conflictingPrayers: string[] } {
  const conflictingPrayers: string[] = [];
  
  for (const [prayer, timeStr] of Object.entries(prayerTimes)) {
    if (!timeStr || typeof timeStr !== 'string') continue;
    
const [hourStr, minuteStr] = (timeStr as string).split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr ?? 0);
    const prayerTime = new Date(startTime);
    prayerTime.setHours(hour, minute, 0, 0);
Number(prayerMinuteRaw ?? 0);
      const prayerDateTime = new Date(currentTime);
      prayerDateTime.setHours(prayerHourNum, prayerMinuteNum, 0, 0);
    
    const bufferStart = new Date(prayerTime.getTime() - bufferMinutes * 60000);
    const bufferEnd = new Date(prayerTime.getTime() + bufferMinutes * 60000);
    
    if ((startTime >= bufferStart && startTime <= bufferEnd) ||
        (endTime >= bufferStart && endTime <= bufferEnd) ||
        (startTime <= bufferStart && endTime >= bufferEnd)) {
      conflictingPrayers.push(prayer);
    }
  }
  
  return {
    conflicts: conflictingPrayers.length > 0,
    conflictingPrayers
  };
}

/**
 * Conflict Severity Utilities
 */

/**
 * Calculate overall conflict severity
 */
export function calculateConflictSeverity(conflicts: any[]): 'low' | 'medium' | 'high' | 'critical' {
  if (conflicts.length === 0) return 'low';
  
  const severities = conflicts.map(c => c.severity);
  
  if (severities.includes('critical')) return 'critical';
  if (severities.includes('high')) return 'high';
  if (severities.includes('medium')) return 'medium';
  return 'low';
}

/**
 * Get conflict severity color
 */
export function getConflictSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return CONFLICT_SEVERITY.CRITICAL.color;
    case 'high': return CONFLICT_SEVERITY.HIGH.color;
    case 'medium': return CONFLICT_SEVERITY.MEDIUM.color;
    case 'low': return CONFLICT_SEVERITY.LOW.color;
    default: return CONFLICT_SEVERITY.LOW.color;
  }
}

/**
 * Validation Utilities
 */

/**
 * Validate UAE phone number format
 */
export function isValidUAEPhone(phoneNumber: string): boolean {
  // UAE phone numbers: +971XXXXXXXXX or 971XXXXXXXXX or 0XXXXXXXXX
  const patterns = [
    /^\+971[0-9]{8,9}$/,      // +971XXXXXXXX or +971XXXXXXXXX
    /^971[0-9]{8,9}$/,        // 971XXXXXXXX or 971XXXXXXXXX  
    /^0[0-9]{8,9}$/           // 0XXXXXXXX or 0XXXXXXXXX
  ];
  
  return patterns.some(pattern => pattern.test(phoneNumber.replace(/\s/g, '')));
}

/**
 * Validate UAE Emirates ID format
 */
export function isValidEmiratesID(emiratesId: string): boolean {
  // Emirates ID format: 784-YYYY-NNNNNNN-N (where 784 is UAE country code)
  const pattern = /^784-[0-9]{4}-[0-9]{7}-[0-9]$/;
  return pattern.test(emiratesId.replace(/\s/g, ''));
}

/**
 * Format UAE phone number
 */
export function formatUAEPhone(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('971')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+971${cleaned.substring(1)}`;
  } else if (cleaned.length === 8 || cleaned.length === 9) {
    return `+971${cleaned}`;
  }
  
  return phoneNumber; // Return original if format is unclear
}

/**
 * Ramadan Utilities
 */

/**
 * Get approximate Ramadan dates for a year (this is simplified - in production use precise calculations)
 */
export function getRamadanDatesForYear(year: number): { start: Date; end: Date } {
  // This is a simplified calculation. In production, use Islamic calendar libraries
  // or APIs for precise Ramadan dates as they depend on moon sighting
  
  // Ramadan moves approximately 11 days earlier each Gregorian year
  const baseYear = 2024;
  const baseRamadanStart = new Date(2024, 2, 11); // March 11, 2024 (approximate)
  
  const yearDiff = year - baseYear;
  const dayOffset = yearDiff * 11; // Approximate shift
  
  const start = subDays(baseRamadanStart, dayOffset);
  const end = addDays(start, 30); // Ramadan is approximately 30 days
  
  return { start, end };
}

/**
 * Check if a date falls within Ramadan
 */
export function isDateInRamadan(date: Date): boolean {
  const year = date.getFullYear();
  const { start, end } = getRamadanDatesForYear(year);
  
  return date >= start && date <= end;
}

/**
 * Export utility functions as a collection
 */
export const CulturalUtils = {
  // Date/Time
  toUAETime,
  fromUAETime,
  getCurrentUAETime,
  formatUAETime,
  formatUAEDate,
  parseUAEDate,
  
  // Islamic Calendar
  toIslamicDate,
  fromIslamicDate,
  getIslamicMonthName,
  getIslamicMonthSignificance,
  isCurrentlyRamadan,
  
  // Text/Localization
  convertToArabicNumbers,
  convertFromArabicNumbers,
  formatPrayerName,
  
  // Working Hours
  isWithinWorkingHours,
  getWorkingHours,
  isWeekendForNationality,
  getCulturalNotes,
  
  // Prayer Times
  getTimeUntilNextPrayer,
  conflictsWithPrayer,
  
  // Conflicts
  calculateConflictSeverity,
  getConflictSeverityColor,
  
  // Validation
  isValidUAEPhone,
  isValidEmiratesID,
  formatUAEPhone,
  
  // Ramadan
  getRamadanDatesForYear,
  isDateInRamadan
};