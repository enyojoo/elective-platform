"use client"

import type { ReactNode } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { InstitutionProvider } from "@/lib/institution-context"
import { LanguageProvider } from "@/lib/language-context"

export function Providers({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient()

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <InstitutionProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </InstitutionProvider>
    </SessionContextProvider>
  )
}
