import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { ar, enUS } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// UAE Time Zone
export const UAE_TIMEZONE = 'Asia/Dubai'

// UAE Locales
export const UAE_LOCALES = {
  ar: ar,
  en: enUS,
}

/**
 * Format date for UAE context with Arabic/English support
 */
export function formatUAEDate(
  date: Date | string,
  formatStr: string = 'PPP',
  locale: 'ar' | 'en' = 'en',
  includeTime: boolean = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const finalFormat = includeTime ? `${formatStr} 'at' p` : formatStr
  
  return formatInTimeZone(
    dateObj,
    UAE_TIMEZONE,
    finalFormat,
    { locale: UAE_LOCALES[locale] }
  )
}

/**
 * Check if current time is during prayer time
 */
export function isDuringPrayerTime(): boolean {
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  // Approximate prayer times for Dubai
  const prayerTimes = {
    fajr: 5 * 60 + 15,      // 5:15 AM
    dhuhr: 12 * 60 + 15,     // 12:15 PM
    asr: 15 * 60 + 30,       // 3:30 PM
    maghrib: 18 * 60 + 45,   // 6:45 PM
    isha: 20 * 60 + 0        // 8:00 PM
  }

  // Check if within 15 minutes of any prayer time
  const buffer = 15
  return Object.values(prayerTimes).some(
    prayerTime => Math.abs(currentTime - prayerTime) <= buffer
  )
}

/**
 * Format Arabic numbers (convert to Arabic-Indic digits)
 */
export function toArabicNumbers(num: number | string): string {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(num).replace(/\d/g, (d) => arabicDigits[parseInt(d)])
}

/**
 * Detect if text contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
  return arabicRegex.test(text)
}

/**
 * Get appropriate text direction based on content
 */
export function getTextDirection(text: string): 'ltr' | 'rtl' {
  return containsArabic(text) ? 'rtl' : 'ltr'
}

/**
 * UAE Emirates list
 */
export const UAE_EMIRATES = [
  { code: 'AD', name: 'Abu Dhabi', nameArabic: 'أبو ظبي' },
  { code: 'DU', name: 'Dubai', nameArabic: 'دبي' },
  { code: 'SH', name: 'Sharjah', nameArabic: 'الشارقة' },
  { code: 'AJ', name: 'Ajman', nameArabic: 'عجمان' },
  { code: 'UQ', name: 'Umm Al Quwain', nameArabic: 'أم القيوين' },
  { code: 'RK', name: 'Ras Al Khaimah', nameArabic: 'رأس الخيمة' },
  { code: 'FU', name: 'Fujairah', nameArabic: 'الفجيرة' },
] as const

export function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleDateString("en-AE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatTime(date: Date | string | number) {
  return new Date(date).toLocaleTimeString("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
