"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useCachedElectives(institutionId: string | undefined) {
  const [electives, setElectives] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchElectives = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedElectives = getCachedData<any[]>("electives", institutionId)

      if (cachedElectives) {
        console.log("Using cached electives data")
        setElectives(cachedElectives)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching electives data from API")
      try {
        // Use the correct table name: elective_courses instead of elective_packs
        const { data, error } = await supabase.from("elective_courses").select("*").eq("institution_id", institutionId)

        if (error) throw error

        // Save to cache
        setCachedData("electives", institutionId, data)

        // Update state
        setElectives(data)
      } catch (error: any) {
        console.error("Error fetching electives:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load electives data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElectives()
  }, [institutionId, getCachedData, setCachedData, toast, supabase])

  return { electives, isLoading, error }
}
