"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedInstitutionSettings(institutionId: string | undefined) {
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchSettings = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedSettings = getCachedData<any>("institutionSettings", institutionId)

      if (cachedSettings) {
        console.log("Using cached institution settings")
        setSettings(cachedSettings)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching institution settings from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase.from("institutions").select("*").eq("id", institutionId).single()

        if (error) throw error

        // Save to cache
        setCachedData("institutionSettings", institutionId, data)

        // Update state
        setSettings(data)
      } catch (error: any) {
        console.error("Error fetching institution settings:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load institution settings",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { settings, isLoading, error }
}
