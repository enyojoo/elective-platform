"use client"

import { type ReactNode, createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export interface Institution {
  id: string
  name: string
  subdomain: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  is_active: boolean
}

interface InstitutionContextType {
  institution: Institution | null
  setInstitution: (institution: Institution | null) => void
  updateInstitution: (data: Partial<Institution>) => Promise<void>
  isLoading: boolean
  isSubdomainAccess: boolean
  error: string | null
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined)

interface InstitutionProviderProps {
  children: ReactNode
  initialInstitution?: Institution | null
}

export function InstitutionProvider({ children, initialInstitution = null }: InstitutionProviderProps) {
  const [institution, setInstitution] = useState<Institution | null>(initialInstitution)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubdomainAccess, setIsSubdomainAccess] = useState(false)

  const updateInstitution = async (data: Partial<Institution>) => {
    if (!institution?.id) {
      throw new Error("No institution found")
    }

    const { error } = await supabase.from("institutions").update(data).eq("id", institution.id)

    if (error) {
      throw error
    }

    // Update the local state
    setInstitution({
      ...institution,
      ...data,
    })

    // Set primary color as CSS variable if it's updated
    if (data.primary_color) {
      document.documentElement.style.setProperty("--primary", data.primary_color)
    }
  }

  useEffect(() => {
    async function loadInstitution() {
      try {
        // Skip institution loading on auth pages to avoid RLS policy issues
        const pathname = window.location.pathname
        const isAuthPage =
          pathname.includes("/login") ||
          pathname.includes("/signup") ||
          pathname.includes("/forgot-password") ||
          pathname.includes("/reset-password")

        if (isAuthPage) {
          console.log("Skipping institution loading on auth page:", pathname)
          setIsLoading(false)
          return
        }

        // For development/testing purposes, if no institution is found via subdomain,
        // we'll use a fallback institution to allow the admin pages to work
        const hostname = window.location.hostname
        console.log("Current hostname:", hostname)

        const isSubdomain =
          hostname.includes(".electivepro.net") && !hostname.startsWith("www") && !hostname.startsWith("app")

        setIsSubdomainAccess(isSubdomain)
        console.log("Is subdomain access:", isSubdomain)

        // If we already have an initialInstitution, use that
        if (initialInstitution) {
          console.log("Using initial institution:", initialInstitution)
          setInstitution(initialInstitution)
          if (initialInstitution.primary_color) {
            document.documentElement.style.setProperty("--primary", initialInstitution.primary_color)
          }
          setIsLoading(false)
          return
        }

        if (isSubdomain) {
          const subdomain = hostname.split(".")[0]
          console.log("Detected subdomain:", subdomain)

          try {
            const { data, error } = await supabase
              .from("institutions")
              .select("id, name, subdomain, logo_url, primary_color, is_active")
              .eq("subdomain", subdomain)
              .eq("is_active", true)
              .single()

            if (error) {
              console.error("Error fetching institution by subdomain:", error)
              // Continue without throwing to allow fallback
            } else if (data) {
              console.log("Found institution by subdomain:", data)
              setInstitution(data)
              // Set primary color as CSS variable
              if (data.primary_color) {
                document.documentElement.style.setProperty("--primary", data.primary_color)
              }
              setIsLoading(false)
              return
            }
          } catch (subdomainError) {
            console.error("Exception fetching institution by subdomain:", subdomainError)
            // Continue without throwing to allow fallback
          }
        }

        // Only attempt fallback if not on an auth page and no institution was found
        if (!isAuthPage) {
          try {
            // For development/testing - fetch the first active institution
            console.log("Attempting to fetch fallback institution for development")
            const { data, error } = await supabase
              .from("institutions")
              .select("id, name, subdomain, logo_url, primary_color, is_active")
              .eq("is_active", true)
              .limit(1)
              .single()

            if (error) {
              console.error("Error fetching fallback institution:", error)
              // Don't throw here, just log the error
            } else if (data) {
              console.log("Using fallback institution:", data)
              setInstitution(data)
              if (data.primary_color) {
                document.documentElement.style.setProperty("--primary", data.primary_color)
              }
            }
          } catch (fallbackError) {
            console.error("Exception fetching fallback institution:", fallbackError)
          }
        }
      } catch (err) {
        console.error("Error loading institution:", err)
        setError("Failed to load institution")
      } finally {
        setIsLoading(false)
      }
    }

    loadInstitution()
  }, [initialInstitution])

  return (
    <InstitutionContext.Provider
      value={{ institution, setInstitution, updateInstitution, isLoading, isSubdomainAccess, error }}
    >
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
