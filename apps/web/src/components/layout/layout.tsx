import { Header } from './header'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  className?: string
  showHeader?: boolean
}

export function Layout({ children, className, showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {showHeader && <Header />}
      
      <main className={cn("relative", className)}>
        {children}
      </main>
      
      {/* Cultural Footer Elements */}
      <footer className="border-t bg-muted/30">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-uae-red via-uae-green to-uae-gold p-0.5">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                  <span className="text-xs font-bold text-uae-green">UAE</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">UAE Work Hub</p>
                <p className="text-xs text-muted-foreground">
                  Built for UAE's multicultural workforce
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span>UAE Data Protection Compliant</span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
              <span>•</span>
              <span>Dubai 2040 Partner</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
