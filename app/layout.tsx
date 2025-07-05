import type { ReactNode } from "react"
import { headers } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { Providers } from "@/app/providers"
import { Toaster } from "@/components/ui/toaster"
import type { Institution } from "@/lib/institution-context"
import type { Database } from "@/types/supabase"
import "@/styles/globals.css"

export const dynamic = "force-dynamic"

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = headers()
  const subdomain = headersList.get("x-electivepro-subdomain")
  let initialInstitution: Institution | null = null

  if (subdomain) {
    // Since the middleware already validated the subdomain,
    // we can fetch the institution data here to pass to the client.
    const supabase = createServerComponentClient<Database>({ cookies })
    const { data } = await supabase
      .from("institutions")
      .select("id, name, subdomain, logo_url, favicon_url, primary_color, is_active")
      .eq("subdomain", subdomain)
      .single()
    initialInstitution = data
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers initialInstitution={initialInstitution}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
