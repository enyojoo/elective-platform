"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@supabase/supabase-js"

type Institution = {
  id: string
  name: string
  subdomain: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  setup_completed: boolean
  created_at: string
}

type InstitutionContextType = {
  institution: Institution | null
  isLoading: boolean
  error: string | null
  refreshInstitution: () => Promise<void>
}

const InstitutionContext = createContext<InstitutionContextType>({
  institution: null,
  isLoading: true,
  error: null,
  refreshInstitution: async () => {},
})

export function useInstitution() {
  return useContext(InstitutionContext)
}

export function InstitutionProvider({ children }: { children: ReactNode }) {
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const fetchInstitution = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setIsLoading(false)
        return
      }

      // Get institution based on the current subdomain
      const hostname = window.location.hostname
      let subdomain

      if (hostname.includes(".electivepro.net")) {
        subdomain = hostname.split(".")[0]
      } else if (hostname === "localhost") {
        // For local development, you might want to use a query param or env var
        const urlParams = new URLSearchParams(window.location.search)
        subdomain = urlParams.get("subdomain") || "demo"
      }

      if (!subdomain) {
        setError("Invalid subdomain")
        setIsLoading(false)
        return
      }

      // Fetch institution data
      const { data, error: fetchError } = await supabase
        .from("institutions")
        .select("*")
        .eq("subdomain", subdomain)
        .single()

      if (fetchError) {
        throw fetchError
      }

      setInstitution(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch institution")
      console.error("Error fetching institution:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInstitution()
  }, [])

  const refreshInstitution = async () => {
    await fetchInstitution()
  }

  return (
    <InstitutionContext.Provider value={{ institution, isLoading, error, refreshInstitution }}>
      {children}
    </InstitutionContext.Provider>
  )
}
