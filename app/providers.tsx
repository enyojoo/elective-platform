"use client"

import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import { useState } from "react"
import { DataCacheProvider } from "@/lib/data-cache-context"
import { InstitutionProvider, type Institution } from "@/lib/institution-context"
import { LanguageProvider } from "@/lib/language-context"
import { supabase } from "@/lib/supabase"

export function Providers({
  children,
  initialInstitution,
}: {
  children: ReactNode
  initialInstitution: Institution | null
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SessionContextProvider supabaseClient={supabase}>
      <QueryClientProvider client={queryClient}>
        <DataCacheProvider>
          <LanguageProvider>
            <InstitutionProvider initialInstitution={initialInstitution}>{children}</InstitutionProvider>
          </LanguageProvider>
        </DataCacheProvider>
      </QueryClientProvider>
    </SessionContextProvider>
  )
}
