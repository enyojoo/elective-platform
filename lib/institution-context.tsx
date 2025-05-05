"use client"

import { type ReactNode, createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

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
        const hostname = window.location.hostname
        const isSubdomain =
          hostname.includes(".electivepro.net") && !hostname.startsWith("www") && !hostname.startsWith("app")

        setIsSubdomainAccess(isSubdomain)

        if (isSubdomain) {
          const subdomain = hostname.split(".")[0]

          const { data, error } = await supabase
            .from("institutions")
            .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
            .eq("subdomain", subdomain)
            .eq("is_active", true)
            .single()

          if (error) {
            console.error("Institution not found or not active:", error)
            // Redirect to main site if institution not found
            router.push("/")
            return
          }

          if (data) {
            setInstitution(data)
            // Set primary color as CSS variable
            if (data.primary_color) {
              document.documentElement.style.setProperty("--primary", data.primary_color)
            }
          } else {
            // Redirect to main site if institution not found
            router.push("/")
          }
        }
      } catch (err) {
        console.error("Error loading institution:", err)
        setError("Failed to load institution")
        // Redirect to main site on error
        router.push("/")
      } finally {
        setIsLoading(false)
      }
    }

    loadInstitution()
  }, [router])

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
