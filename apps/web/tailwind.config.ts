import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // UAE Flag Colors & Cultural Palette
        uae: {
          red: "#CE1126",
          green: "#009639",
          black: "#000000",
          white: "#FFFFFF",
          gold: "#FFD700",
        },
        // UAE Cultural Color Extensions
        desert: {
          50: "#FDF7F0",
          100: "#F9E8D3",
          200: "#F0D0A7",
          300: "#E5B87B",
          400: "#D8A04F",
          500: "#C48B23",
          600: "#9A6E1C",
          700: "#6F5015",
          800: "#45320E",
          900: "#1C1407",
        },
        palm: {
          50: "#F0F9F4",
          100: "#DCF2E3",
          200: "#B8E5C7",
          300: "#95D8AB",
          400: "#71CB8F",
          500: "#4DBE73",
          600: "#3D985C",
          700: "#2E7245",
          800: "#1E4C2E",
          900: "#0F2617",
        },
        gold: {
          50: "#FFFCF0",
          100: "#FFF8DC",
          200: "#FFF0B9",
          300: "#FFE896",
          400: "#FFE073",
          500: "#FFD700",
          600: "#CCAC00",
          700: "#998100",
          800: "#665600",
          900: "#332B00",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "Noto Sans Arabic", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        "glow": {
          "0%": { boxShadow: "0 0 5px rgba(255, 215, 0, 0.5)" },
          "100%": { boxShadow: "0 0 20px rgba(255, 215, 0, 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-in-out",
        "slide-in": "slide-in 0.3s ease-out",
        "bounce-subtle": "bounce-subtle 2s infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
