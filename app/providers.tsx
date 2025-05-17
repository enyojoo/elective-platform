"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/lib/language-context"
import { InstitutionProvider } from "@/lib/institution-context"
import { DataCacheProvider } from "@/lib/data-cache-context"

export function Providers({
  children,
  institution = null,
}: {
  children: React.ReactNode
  institution?: any | null
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <InstitutionProvider initialInstitution={institution}>
          <DataCacheProvider>{children}</DataCacheProvider>
        </InstitutionProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
