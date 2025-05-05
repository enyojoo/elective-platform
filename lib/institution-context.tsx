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
  const [isLoading, setIsLoading] = useState(!initialInstitution)
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
        // If we already have an institution from props, use it
        if (initialInstitution) {
          console.log("Context: Using initial institution:", initialInstitution.name)
          setInstitution(initialInstitution)
          if (initialInstitution.primary_color) {
            document.documentElement.style.setProperty("--primary", initialInstitution.primary_color)
          }
          setIsLoading(false)
          return
        }

        const hostname = window.location.hostname
        const isSubdomain =
          hostname.includes(".electivepro.net") && !hostname.startsWith("www") && !hostname.startsWith("app")

        setIsSubdomainAccess(isSubdomain)
        console.log("Context: Checking for subdomain access:", { hostname, isSubdomain })

        if (isSubdomain) {
          const subdomain = hostname.split(".")[0]
          console.log("Context: Detected subdomain:", subdomain)

          // Simple direct query - no RPC functions
          const { data, error } = await supabase
            .from("institutions")
            .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
            .eq("subdomain", subdomain)
            .eq("is_active", true)
            .single()

          console.log("Context: Institution query result:", { data, error })

          if (error) {
            console.error("Context: Institution not found:", error)
            setError("Institution not found")
          } else if (data) {
            console.log("Context: Found institution:", data.name)
            setInstitution(data)
            // Set primary color as CSS variable
            if (data.primary_color) {
              document.documentElement.style.setProperty("--primary", data.primary_color)
            }
          }
        } else {
          // If not accessing via subdomain, try to get institution from auth session
          console.log("Context: Not a subdomain access, checking auth session")
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            console.log("Context: User is authenticated, fetching profile")
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("institution_id")
              .eq("id", session.user.id)
              .single()

            if (profileError) {
              console.error("Context: Error fetching profile:", profileError)
            } else if (profileData?.institution_id) {
              console.log("Context: Found institution ID in profile:", profileData.institution_id)

              const { data: institutionData, error: institutionError } = await supabase
                .from("institutions")
                .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
                .eq("id", profileData.institution_id)
                .single()

              if (institutionError) {
                console.error("Context: Error fetching institution:", institutionError)
              } else {
                console.log("Context: Found institution from profile:", institutionData.name)
                setInstitution(institutionData)
                if (institutionData.primary_color) {
                  document.documentElement.style.setProperty("--primary", institutionData.primary_color)
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Context: Error loading institution:", err)
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
