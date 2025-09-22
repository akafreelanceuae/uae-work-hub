import Link from "next/link"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"

export function Footer() {
  const navigation = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Video Conferencing", href: "#video" },
      { name: "Project Management", href: "#projects" },
      { name: "Cultural Intelligence", href: "#culture" },
      { name: "Integrations", href: "#integrations" },
    ],
    company: [
      { name: "About Us", href: "#about" },
      { name: "Careers", href: "#careers" },
      { name: "Press", href: "#press" },
      { name: "Partners", href: "#partners" },
      { name: "Contact", href: "#contact" },
    ],
    compliance: [
      { name: "Privacy Policy", href: "#privacy" },
      { name: "Terms of Service", href: "#terms" },
      { name: "GCC Compliance", href: "#compliance" },
      { name: "Security", href: "#security" },
      { name: "Data Protection", href: "#data" },
    ],
    support: [
      { name: "Help Center", href: "#help" },
      { name: "API Documentation", href: "#docs" },
      { name: "System Status", href: "#status" },
      { name: "Community", href: "#community" },
      { name: "Training", href: "#training" },
    ],
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Icons.logo className="h-8 w-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-uae-red to-uae-green bg-clip-text text-transparent">
                UAE Work Hub
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              The GCC's first culturally intelligent collaboration platform, 
              designed for UAE's diverse workforce.
            </p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Icons.shield className="h-4 w-4 text-uae-green" />
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Icons.flag className="h-4 w-4 text-uae-red" />
              <span>UAE Data Residency</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:col-span-4">
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2">
                {navigation.product.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-uae-green transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <ul className="space-y-2">
                {navigation.company.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-uae-green transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Compliance</h3>
              <ul className="space-y-2">
                {navigation.compliance.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-uae-green transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Support</h3>
              <ul className="space-y-2">
                {navigation.support.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-uae-green transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h4 className="font-semibold mb-2">Stay updated on UAE's digital transformation</h4>
              <p className="text-sm text-muted-foreground">
                Get insights on GCC compliance, cultural intelligence, and Dubai 2040 updates.
              </p>
            </div>
            <div className="flex space-x-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-uae-green focus:border-transparent"
              />
              <Button className="bg-uae-green hover:bg-uae-green/90 text-white">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 UAE Work Hub. Built with ❤️ in the UAE.
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Icons.globe className="h-4 w-4" />
              <span>العربية</span>
            </span>
            <span className="flex items-center space-x-1">
              <Icons.clock className="h-4 w-4" />
              <span>GST +4</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
