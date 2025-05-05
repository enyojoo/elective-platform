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
        const hostname = window.location.hostname
        const isSubdomain =
          hostname.includes(".electivepro.net") && !hostname.startsWith("www") && !hostname.startsWith("app")

        setIsSubdomainAccess(isSubdomain)

        if (isSubdomain) {
          const subdomain = hostname.split(".")[0]
          console.log(`Looking up institution with subdomain: ${subdomain}`)

          // First, let's check if any institutions exist at all (for debugging)
          const { data: allInstitutions, error: allError } = await supabase
            .from("institutions")
            .select("id, subdomain")
            .limit(5)

          if (allError) {
            console.error("Error fetching institutions:", allError)
          } else {
            console.log(
              `Found ${allInstitutions.length} institutions in database:`,
              allInstitutions.map((i) => i.subdomain).join(", "),
            )
          }

          // Now look for the specific institution
          const { data, error } = await supabase
            .from("institutions")
            .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
            .eq("subdomain", subdomain)
            .eq("is_active", true)
            .single()

          console.log("Institution query result:", { data, error })

          if (error) {
            if (error.code === "PGRST116") {
              console.error(`No institution found for subdomain: ${subdomain}`)

              // Try without the is_active filter to see if it exists but is inactive
              const { data: inactiveData } = await supabase
                .from("institutions")
                .select("id, is_active")
                .eq("subdomain", subdomain)
                .single()

              if (inactiveData) {
                console.log("Institution exists but is inactive:", inactiveData)
                setError("Institution is inactive")
              } else {
                console.log("Institution does not exist in database")
                setError("Institution not found")
              }

              setInstitution(null)
            } else {
              console.error("Error fetching institution:", error)
              throw error
            }
          } else if (data) {
            console.log("Institution found:", data)
            setInstitution(data)
            // Set primary color as CSS variable
            if (data.primary_color) {
              document.documentElement.style.setProperty("--primary", data.primary_color)
            }
          } else {
            console.error("No data returned but no error either")
            setInstitution(null)
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
  }, [])

  // Only redirect if we're sure there's no institution
  useEffect(() => {
    if (!isLoading && isSubdomainAccess && !institution && error && typeof window !== "undefined") {
      console.log("Redirecting to invalid institution page due to:", error)
      // Wait a moment to ensure logs are visible
      setTimeout(() => {
        window.location.href = "https://app.electivepro.net/invalid-institution"
      }, 1000)
    }
  }, [isLoading, isSubdomainAccess, institution, error])

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
