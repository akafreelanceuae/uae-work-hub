import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true,
})

// UAE-specific test utilities
export const mockPrayerTimes = {
  fajr: '05:15',
  sunrise: '06:35',
  dhuhr: '12:15',
  asr: '15:30',
  maghrib: '18:45',
  isha: '20:00',
}

export const mockUAEDate = new Date('2024-12-02T10:00:00+04:00') // UAE National Day

export const mockCulturalEvents = [
  {
    id: 'uae-national-day',
    name: 'UAE National Day',
    nameArabic: 'اليوم الوطني لدولة الإمارات',
    date: '2024-12-02',
    type: 'national_holiday',
  },
]
