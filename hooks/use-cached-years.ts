"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedYears() {
  const [years, setYears] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    const fetchYears = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedYears = getCachedData<any[]>("years", "global")

      if (cachedYears && cachedYears.length > 0) {
        console.log("Using cached years data")
        setYears(cachedYears)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching years data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data: yearsData, error: yearsError } = await supabase
          .from("years")
          .select("*")
          .order("year", { ascending: false })

        if (yearsError) throw yearsError

        if (!yearsData) {
          setYears([])
          setIsLoading(false)
          return
        }

        // Format the years data
        const formattedYears = yearsData.map((year) => ({
          id: year.id.toString(),
          year: year.year,
        }))

        // Save to cache
        setCachedData("years", "global", formattedYears)

        // Update state
        setYears(formattedYears)
      } catch (error: any) {
        console.error("Error fetching years:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load years data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchYears()
  }, [getCachedData, setCachedData, toast])

  return { years, isLoading, error }
}
