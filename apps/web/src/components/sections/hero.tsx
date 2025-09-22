'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowRight, Calendar, MessageSquare, Users, Video, Zap } from 'lucide-react'

interface HeroProps {
  className?: string
}

export function Hero({ className }: HeroProps) {
  const [language, setLanguage] = useState<'en' | 'ar'>('en')

  const features = [
    {
      icon: Video,
      title: language === 'ar' ? 'مؤتمرات فيديو مشفرة' : 'Encrypted Video Conferences',
      description: language === 'ar' ? 'تقنية تشفير متقدمة متوافقة مع معايير دولة الإمارات' : 'Advanced encryption compliant with UAE standards'
    },
    {
      icon: MessageSquare,
      title: language === 'ar' ? 'ترجمة صوتية بالذكاء الاصطناعي' : 'AI-Powered Transcription',
      description: language === 'ar' ? 'دعم اللهجة الإماراتية والعربية الخليجية' : 'Emirati dialect and Gulf Arabic support'
    },
    {
      icon: Calendar,
      title: language === 'ar' ? 'التقويم الثقافي الذكي' : 'Smart Cultural Calendar',
      description: language === 'ar' ? 'مراعاة أوقات الصلاة والمناسبات الإسلامية' : 'Prayer times and Islamic occasions awareness'
    },
    {
      icon: Users,
      title: language === 'ar' ? 'إدارة القوى العاملة المتنوعة' : 'Multicultural Workforce',
      description: language === 'ar' ? 'دعم أكثر من 10 جنسيات في بيئة العمل الإماراتية' : 'Support for 10+ nationalities in UAE workplace'
    }
  ]

  const stats = [
    { number: '50+', label: language === 'ar' ? 'شركة إماراتية' : 'UAE Companies', labelAr: 'شركة إماراتية' },
    { number: '10K+', label: language === 'ar' ? 'ساعات اجتماعات' : 'Meeting Hours', labelAr: 'ساعات اجتماعات' },
    { number: '99.9%', label: language === 'ar' ? 'وقت التشغيل' : 'Uptime', labelAr: 'وقت التشغيل' },
    { number: '12', label: language === 'ar' ? 'لغة مدعومة' : 'Languages', labelAr: 'لغة مدعومة' }
  ]

  return (
    <section className={cn(
      "relative min-h-screen flex items-center justify-center overflow-hidden",
      className
    )}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-desert-50 via-palm-50 to-gold-50" />
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm-15 15l15-15v30l-15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      {/* UAE Flag Inspired Gradient */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-uae-red via-uae-white via-uae-white to-uae-green" />
      
      <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gold-200 rounded-full px-4 py-2 mb-6">
            <div className="h-2 w-2 bg-uae-green rounded-full animate-pulse" />
            <span className="text-sm font-medium text-uae-green">
              {language === 'ar' ? 'متوافق مع معايير دولة الإمارات العربية المتحدة' : 'UAE Government Compliant'}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-uae-red via-uae-green to-gold-600 bg-clip-text text-transparent">
              {language === 'ar' ? 'مستقبل العمل' : 'Future of Work'}
            </span>
            <br />
            <span className="text-foreground">
              {language === 'ar' ? 'في دولة الإمارات' : 'in the UAE'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className={cn(
            "text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed",
            language === 'ar' && "arabic text-right"
          )}>
            {language === 'ar' 
              ? 'منصة تعاون ذكية مصممة خصيصاً للقوى العاملة المتعددة الثقافات في دولة الإمارات العربية المتحدة. مع الذكاء الاصطناعي والذكاء الثقافي المدمج.'
              : 'Intelligent collaboration platform designed for UAE\'s multicultural workforce. Built with AI and cultural intelligence for seamless hybrid work experiences.'
            }
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              variant="uae" 
              size="xl" 
              className="group"
              arabicText={language === 'ar' ? 'ابدأ مجاناً' : undefined}
            >
              {language === 'ar' ? 'Start Free' : 'Start Free Trial'}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="xl"
              arabicText={language === 'ar' ? 'شاهد العرض' : undefined}
            >
              <Video className="mr-2 h-5 w-5" />
              {language === 'ar' ? 'Watch Demo' : 'Watch Demo'}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/80 transition-all duration-300"
              >
                <div className="text-2xl md:text-3xl font-bold text-uae-green mb-1">
                  {stat.number}
                </div>
                <div className={cn(
                  "text-sm text-muted-foreground",
                  language === 'ar' && "arabic"
                )}>
                  {language === 'ar' ? stat.labelAr : stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-white/40 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/60 hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center justify-center h-12 w-12 bg-gradient-to-br from-uae-green to-palm-600 rounded-lg mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                
                <h3 className={cn(
                  "font-semibold text-lg mb-2 group-hover:text-uae-green transition-colors",
                  language === 'ar' && "arabic text-center"
                )}>
                  {feature.title}
                </h3>
                
                <p className={cn(
                  "text-sm text-muted-foreground",
                  language === 'ar' && "arabic text-center"
                )}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce-subtle">
        <div className="h-3 w-3 bg-gold-400 rounded-full opacity-60" />
      </div>
      <div className="absolute top-40 right-20 animate-bounce-subtle" style={{ animationDelay: '1s' }}>
        <div className="h-2 w-2 bg-palm-400 rounded-full opacity-60" />
      </div>
      <div className="absolute bottom-40 left-20 animate-bounce-subtle" style={{ animationDelay: '2s' }}>
        <div className="h-4 w-4 bg-desert-400 rounded-full opacity-60" />
      </div>
      
      {/* Language Toggle Floating */}
      <button
        onClick={() => setLanguage(prev => prev === 'en' ? 'ar' : 'en')}
        className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm border border-white/20 rounded-full p-3 hover:bg-white transition-all duration-300 shadow-lg"
      >
        <span className="text-sm font-medium">
          {language === 'ar' ? 'EN' : 'عر'}
        </span>
      </button>
    </section>
  )
}
