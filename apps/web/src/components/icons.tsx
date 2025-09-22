import { 
  Calendar,
  Globe,
  Shield,
  Video,
  Users,
  Clock,
  Building2,
  Zap,
  Menu,
  X,
  ChevronRight,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  calendar: Calendar,
  globe: Globe,
  shield: Shield,
  video: Video,
  users: Users,
  clock: Clock,
  building: Building2,
  zap: Zap,
  menu: Menu,
  close: X,
  chevronRight: ChevronRight,
  moon: Moon,
  sun: Sun,
  flag: ({ ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  ),
  logo: ({ ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      {...props}
    >
      {/* UAE Work Hub Logo - Modern geometric design */}
      <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#gradient)" />
      <path
        d="M8 12h16v2H8zm0 4h16v2H8zm0 4h12v2H8z"
        fill="white"
        opacity="0.9"
      />
      <circle cx="22" cy="20" r="2" fill="white" opacity="0.8" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CE1126" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#009639" />
        </linearGradient>
      </defs>
    </svg>
  ),
}
