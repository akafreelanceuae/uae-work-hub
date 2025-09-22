'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn, formatUAEDate, isDuringPrayerTime, toArabicNumbers } from '@/lib/utils'
import { Bell, Calendar, Clock, Globe, Menu, Moon, Sun, User } from 'lucide-react'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPrayerTime, setIsPrayerTime] = useState(false)
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      setIsPrayerTime(isDuringPrayerTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
    // In a real app, this would update the document class
  }

  const formatTime = (date: Date) => {
    const timeString = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Dubai'
    })
    return language === 'ar' ? toArabicNumbers(timeString) : timeString
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      {/* Prayer Time Indicator Bar */}
      {isPrayerTime && (
        <div className="bg-gold-500 text-gold-900 px-4 py-1 text-center text-sm font-medium animate-pulse">
          <div className="flex items-center justify-center gap-2">
            <Bell className="h-4 w-4" />
            <span className={language === 'ar' ? 'arabic' : ''}>
              {language === 'ar' 
                ? 'وقت الصلاة الآن - يرجى مراعاة الوقت المقدس' 
                : 'Prayer time now - Please respect the sacred time'
              }
            </span>
          </div>
        </div>
      )}

      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-uae-red via-uae-green to-uae-gold p-0.5">
              <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                <span className="text-xs font-bold text-uae-green">UAE</span>
              </div>
            </div>
            <div>
              <h1 className="font-semibold text-lg">
                {language === 'ar' ? 'مركز العمل الإماراتي' : 'UAE Work Hub'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === 'ar' ? 'منصة العمل الذكية' : 'Intelligent Work Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Center - Cultural Info */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Current Time in UAE */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono">{formatTime(currentTime)}</span>
            <span className="text-muted-foreground">Dubai</span>
          </div>

          {/* Current Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatUAEDate(currentTime, 'MMM d, yyyy', language)}</span>
          </div>

          {/* Prayer Time Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-xs",
            isPrayerTime 
              ? "bg-gold-100 text-gold-800 border border-gold-200" 
              : "bg-palm-100 text-palm-800 border border-palm-200"
          )}>
            <div className={cn(
              "h-2 w-2 rounded-full",
              isPrayerTime ? "bg-gold-500 animate-pulse" : "bg-palm-500"
            )} />
            <span>
              {isPrayerTime 
                ? (language === 'ar' ? 'وقت الصلاة' : 'Prayer Time')
                : (language === 'ar' ? 'عمل اعتيادي' : 'Regular Time')
              }
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">
              {language === 'ar' ? 'English' : 'العربية'}
            </span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-uae-red rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </div>
          </Button>

          {/* User Profile */}
          <Button variant="ghost" size="icon">
            <User className="h-4 w-4" />
          </Button>

          {/* CTA Button */}
          <Button variant="uae" size="sm" className="hidden md:flex">
            {language === 'ar' ? 'ابدأ الاجتماع' : 'Start Meeting'}
          </Button>
        </div>
      </div>
    </header>
  )
}
