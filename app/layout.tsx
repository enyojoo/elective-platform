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

// Default primary color
const DEFAULT_PRIMARY_COLOR = "#027659"

// Default platform name
const DEFAULT_PLATFORM_NAME = "ElectivePRO"

// This is a dynamic metadata function instead of the static metadata object
export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const headersList = headers()
  const host = headersList.get("host") || ""
  const subdomain = getSubdomain(host)
  const institutionId = headersList.get("x-institution-id")
  const institutionName = headersList.get("x-institution-name")
  const institutionFaviconUrl = headersList.get("x-institution-favicon-url")

  // Check if this is an admin path
  const url = headersList.get("x-url") || ""
  const isAdminPath = url.includes("/admin")

  // For admin paths, always use the default favicon
  const faviconUrl = isAdminPath ? DEFAULT_FAVICON_URL : institutionFaviconUrl || DEFAULT_FAVICON_URL

  // Set the page title based on whether it's a subdomain access or not
  let pageTitle = DEFAULT_PLATFORM_NAME

  // If it's a subdomain access and not an admin path, use the institution name
  if (subdomain && institutionName && !isAdminPath) {
    pageTitle = institutionName
  }

  return {
    title: pageTitle,
    description:
      "The complete platform for managing the selection of elective courses, exchange programs, and academic pathways.",
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
  }
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

  // Check if this is an admin path
  const url = headersList.get("x-url") || ""
  const isAdminPath = url.includes("/admin")

  console.log("Layout: Processing request for", {
    host,
    subdomain,
    institutionId,
    institutionName,
    hasFavicon: !!institutionFaviconUrl,
    hasPrimaryColor: !!institutionPrimaryColor,
    url,
    isAdminPath,
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

  // For admin paths, always use the default color
  const primaryColor = isAdminPath ? DEFAULT_PRIMARY_COLOR : institutionPrimaryColor || DEFAULT_PRIMARY_COLOR

  // For admin paths, always use the default favicon
  const faviconUrl = isAdminPath ? DEFAULT_FAVICON_URL : institutionFaviconUrl || DEFAULT_FAVICON_URL

  return (
    <html lang="en" suppressHydrationWarning style={{ "--primary": primaryColor } as React.CSSProperties}>
      <head>
        {/* Add a meta tag to help debug */}
        <meta name="x-subdomain" content={subdomain || "none"} />
        <meta name="x-institution-id" content={institutionId || "none"} />
        <meta name="theme-color" content={primaryColor} />
        <meta name="x-primary-color" content={primaryColor} />
        <meta name="x-is-admin" content={isAdminPath ? "true" : "false"} />
        <meta name="x-favicon-url" content={faviconUrl} />
        <meta name="x-institution-name" content={institutionName || DEFAULT_PLATFORM_NAME} />

        {/* Set favicon explicitly for server-side rendering */}
        <link rel="icon" href={faviconUrl} />
        <link rel="shortcut icon" href={faviconUrl} />
        <link rel="apple-touch-icon" href={faviconUrl} />
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

export const metadata = {
      generator: 'v0.dev'
    };
