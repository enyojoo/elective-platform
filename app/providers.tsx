"use client"

import type React from "react"
import { LanguageProvider } from "@/lib/language-context"
import { InstitutionProvider } from "@/lib/institution-context"
import { DataCacheProvider } from "@/lib/data-cache-context"
import { SuperAdminAuthProvider } from "@/lib/super-admin-auth-context"

interface ProvidersProps {
  children: React.ReactNode
  institution?: string
}

export function Providers({ children, institution }: ProvidersProps) {
  return (
    <LanguageProvider>
      <InstitutionProvider initialInstitution={institution}>
        <DataCacheProvider>
          <SuperAdminAuthProvider>{children}</SuperAdminAuthProvider>
        </DataCacheProvider>
      </InstitutionProvider>
    </LanguageProvider>
  )
}
