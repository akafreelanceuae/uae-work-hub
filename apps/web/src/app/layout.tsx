import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "UAE Work Hub - Smart Collaboration Platform",
  description: "GCC-compliant, culturally intelligent hybrid work collaboration platform for UAE multinational workforces",
  keywords: ["UAE", "GCC", "collaboration", "hybrid work", "cultural intelligence", "Dubai 2040"],
  authors: [{ name: "UAE Work Hub Team" }],
  openGraph: {
    title: "UAE Work Hub",
    description: "Smart collaboration platform designed for UAE's diverse workforce",
    type: "website",
    locale: "en_AE",
    alternateLocale: "ar_AE",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
