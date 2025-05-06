"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedPrograms(institutionId: string | undefined) {
  const [programs, setPrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchPrograms = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedPrograms = getCachedData<any[]>("programs", institutionId)

      if (cachedPrograms) {
        console.log("Using cached programs data")
        setPrograms(cachedPrograms)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching programs data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("programs")
          .select("*, degrees(name)")
          .eq("institution_id", institutionId)

        if (error) throw error

        // Save to cache
        setCachedData("programs", institutionId, data)

        // Update state
        setPrograms(data)
      } catch (error: any) {
        console.error("Error fetching programs:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load programs data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrograms()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { programs, isLoading, error }
}
