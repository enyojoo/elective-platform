"use client"

import type { ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { InstitutionProvider } from "@/lib/institution-context"
import { LanguageProvider } from "@/lib/language-context"

interface Institution {
  id: string
  name: string
  subdomain: string
  logo_url?: string
  primary_color?: string
}

interface ProvidersProps {
  children: ReactNode
  institution: Institution | null
}

export function Providers({ children, institution }: ProvidersProps) {
  const supabase = createClientComponentClient()

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <InstitutionProvider initialInstitution={institution}>
        <LanguageProvider>{children}</LanguageProvider>
      </InstitutionProvider>
    </SessionContextProvider>
  )
}
