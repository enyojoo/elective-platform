"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedGroups(institutionId: string | undefined) {
  const [groups, setGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchGroups = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedGroups = getCachedData<any[]>("groups", institutionId)

      if (cachedGroups) {
        console.log("Using cached groups data")
        setGroups(cachedGroups)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching groups data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("groups")
          .select("*, programs(name, code)")
          .eq("institution_id", institutionId)

        if (error) throw error

        // Save to cache
        setCachedData("groups", institutionId, data)

        // Update state
        setGroups(data)
      } catch (error: any) {
        console.error("Error fetching groups:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load groups data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { groups, isLoading, error }
}
