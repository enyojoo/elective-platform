"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedExchangeElectives(institutionId: string | undefined) {
  const [exchangeElectives, setExchangeElectives] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchExchangeElectives = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedExchangeElectives = getCachedData<any[]>("exchangeElectives", institutionId)

      if (cachedExchangeElectives) {
        console.log("Using cached exchange electives data")
        setExchangeElectives(cachedExchangeElectives)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching exchange electives data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("elective_exchange")
          .select(`
            *,
            creator:profiles(full_name)
          `)
          .eq("institution_id", institutionId)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Process the data to include university count and creator name
        const processedData = (data || []).map((pack) => {
          // Get university count from the universities array
          const universityCount = pack.universities ? pack.universities.length : 0

          // Get creator name from the joined profiles data
          const creatorName = pack.creator?.full_name || "Unknown"

          return {
            ...pack,
            university_count: universityCount,
            creator_name: creatorName,
          }
        })

        // Save to cache
        setCachedData("exchangeElectives", institutionId, processedData)

        // Update state
        setExchangeElectives(processedData)
      } catch (error: any) {
        console.error("Error fetching exchange electives:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load exchange electives data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchangeElectives()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { exchangeElectives, isLoading, error }
}
