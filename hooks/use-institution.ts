"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { isValidSubdomain } from "@/lib/subdomain-utils"

interface InstitutionContextType {
  institution: any | null
  isLoading: boolean
  isSubdomainAccess: boolean
  error: string | null
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined)

export function InstitutionProvider({
  children,
  institution: initialInstitution,
}: { children: React.ReactNode; institution?: any }) {
  const [institution, setInstitution] = useState<any | null>(initialInstitution || null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubdomainAccess, setIsSubdomainAccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadInstitution() {
      setIsLoading(true)
      try {
        const hostname = window.location.hostname
        const isSubdomain = hostname.includes(".electivepro.net")

        setIsSubdomainAccess(isSubdomain)

        if (isSubdomain) {
          const subdomain = hostname.split(".")[0]

          // Check if the subdomain is valid
          const isValid = await isValidSubdomain(subdomain, {
            from: () => ({
              select: () => ({
                eq: () => ({
                  eq: () => ({
                    single: () => Promise.resolve({ data: { id: "123" }, error: null }),
                  }),
                }),
              }),
            }),
          })

          if (isValid) {
            setInstitution({ id: "123", name: "Test Institution", subdomain: subdomain })
          } else {
            setError("Invalid subdomain")
          }
        }
      } catch (err) {
        setError("Failed to load institution")
      } finally {
        setIsLoading(false)
      }
    }

    loadInstitution()
  }, [])

  return (
    <InstitutionContext.Provider value={{ institution, isLoading, isSubdomainAccess, error }}>
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
\
"
