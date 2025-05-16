"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface Institution {
  id: string
  name: string
  subdomain: string
  is_active: boolean
  favicon_url: string | null
  logo_url: string | null
  primary_color: string | null
  domain?: string | null
}

interface InstitutionContextType {
  institution: Institution | null
  updateInstitution: (updates: Partial<Institution>) => Promise<void>
  isLoading: boolean
  error: Error | null
  isSubdomainAccess: boolean
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined)

export function InstitutionProvider({
  children,
  initialInstitution = null,
}: {
  children: React.ReactNode
  initialInstitution?: Institution | null
}) {
  const [institution, setInstitution] = useState<Institution | null>(initialInstitution)
  const [isLoading, setIsLoading] = useState<boolean>(!initialInstitution)
  const [error, setError] = useState<Error | null>(null)
  const [isSubdomainAccess, setIsSubdomainAccess] = useState(false)

  useEffect(() => {
    const checkSubdomain = () => {
      const hostname = window.location.hostname
      setIsSubdomainAccess(
        hostname.includes(".electivepro.net") &&
          !hostname.startsWith("www") &&
          !hostname.startsWith("app") &&
          !hostname.startsWith("api"),
      )
    }

    // Check on mount and whenever the URL changes
    checkSubdomain()
    window.addEventListener("popstate", checkSubdomain)

    return () => {
      window.removeEventListener("popstate", checkSubdomain)
    }
  }, [])

  useEffect(() => {
    if (initialInstitution) {
      setInstitution(initialInstitution)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }, [initialInstitution])

  const updateInstitution = useCallback(async (updates: Partial<Institution>) => {
    setInstitution((prev) => (prev ? { ...prev, ...updates } : null))
  }, [])

  return (
    <InstitutionContext.Provider value={{ institution, updateInstitution, isLoading, error, isSubdomainAccess }}>
      {children}
    </InstitutionContext.Provider>
  )
}

export function useInstitution() {
  const context = useContext(InstitutionContext)
  if (context === undefined) {
    throw new Error("useInstitution must be used within an InstitutionProvider")
  }
  return context
}

export default InstitutionContext
