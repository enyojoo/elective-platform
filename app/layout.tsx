import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { cookies, headers } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { DynamicBranding } from "@/components/dynamic-branding"
import { getSubdomain } from "@/lib/subdomain-utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ElectivePRO",
  description:
    "The complete platform for managing the selection of elective courses, exchange programs, and academic pathways.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const headersList = headers()
  const host = headersList.get("host") || ""
  const subdomain = getSubdomain(host)
  const institutionId = headersList.get("x-institution-id")

  console.log("Layout: Processing request for", { host, subdomain, institutionId })

  // If subdomain exists, fetch institution data
  let institution = null
  if (subdomain) {
    try {
      // Simple direct query - no RPC functions
      const { data, error } = await supabase
        .from("institutions")
        .select("id, name, subdomain, logo_url, primary_color")
        .eq("subdomain", subdomain)
        .eq("is_active", true)
        .single()

      console.log("Layout: Institution query result:", { data, error })

      if (!error && data) {
        institution = data
        console.log("Layout: Found institution:", institution.name)
      }
    } catch (error) {
      console.error("Layout: Error fetching institution:", error)
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {institution?.primary_color && (
          <style>{`
            :root {
              --primary: ${institution.primary_color};
              --primary-foreground: #ffffff;
            }
          `}</style>
        )}
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
