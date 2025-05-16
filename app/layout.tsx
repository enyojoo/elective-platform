import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DynamicBranding } from "@/components/dynamic-branding"
import { getSubdomain } from "@/lib/subdomain-utils"

const inter = Inter({ subsets: ["latin"] })

// Updated default favicon URL
const DEFAULT_FAVICON_URL =
  "https://pbqvvvdhssghkpvsluvw.supabase.co/storage/v1/object/public/favicons//epro_favicon.svg"

export const metadata: Metadata = {
  title: "ElectivePRO",
  description:
    "The complete platform for managing the selection of elective courses, exchange programs, and academic pathways.",
  icons: {
    icon: DEFAULT_FAVICON_URL,
    shortcut: DEFAULT_FAVICON_URL,
    apple: DEFAULT_FAVICON_URL,
  },
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = headers()
  const host = headersList.get("host") || ""
  const subdomain = getSubdomain(host)
  const institutionId = headersList.get("x-institution-id")
  const institutionName = headersList.get("x-institution-name")
  const institutionFaviconUrl = headersList.get("x-institution-favicon-url")
  const institutionPrimaryColor = headersList.get("x-institution-primary-color")

  console.log("Layout: Processing request for", {
    host,
    subdomain,
    institutionId,
    institutionName,
    hasFavicon: !!institutionFaviconUrl,
    hasPrimaryColor: !!institutionPrimaryColor,
  })

  // If we have institution info from headers, use it
  let institution = null
  if (institutionId && subdomain) {
    institution = {
      id: institutionId,
      name: institutionName || "Institution",
      subdomain: subdomain,
      is_active: true,
      favicon_url: institutionFaviconUrl || null,
      primary_color: institutionPrimaryColor || null,
    }
    console.log("Layout: Using institution from headers:", institution.name)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Add a meta tag to help debug */}
        <meta name="x-subdomain" content={subdomain || "none"} />
        <meta name="x-institution-id" content={institutionId || "none"} />
        {institutionPrimaryColor && <meta name="theme-color" content={institutionPrimaryColor} />}
      </head>
      <body className={inter.className}>
        <Providers institution={institution}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <DynamicBranding />
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
