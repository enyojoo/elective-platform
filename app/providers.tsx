"use client"

import type React from "react"

import { InstitutionProvider } from "@/lib/institution-context"
import { LanguageProvider } from "@/lib/language-context"
import { DataCacheProvider } from "@/lib/data-cache-context"
import { DEFAULT_FAVICON_URL, DEFAULT_LOGO_URL, DEFAULT_PRIMARY_COLOR } from "@/lib/constants"

interface Institution {
  id: string
  name: string
  subdomain: string
  is_active: boolean
  favicon_url: string | null
  logo_url: string | null
  primary_color: string | null
}

export function Providers({
  children,
  institution = null,
}: {
  children: React.ReactNode
  institution?: Institution | null
}) {
  // Ensure default values are set
  const institutionWithDefaults = institution
    ? {
        ...institution,
        favicon_url: institution.favicon_url || DEFAULT_FAVICON_URL,
        logo_url: institution.logo_url || DEFAULT_LOGO_URL,
        primary_color: institution.primary_color || DEFAULT_PRIMARY_COLOR,
      }
    : null

  return (
    <DataCacheProvider>
      <InstitutionProvider initialInstitution={institutionWithDefaults}>
        <LanguageProvider>{children}</LanguageProvider>
      </InstitutionProvider>
    </DataCacheProvider>
  )
}
