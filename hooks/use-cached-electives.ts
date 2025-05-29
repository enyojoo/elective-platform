"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// Update the function to fetch from elective_courses table
export function useCachedElectives(institutionId: string | undefined) {
  const [electives, setElectives] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    console.log(`useCachedElectives: Hook triggered. institutionId: ${institutionId}`)
    if (!institutionId) {
      console.log("useCachedElectives: No institutionId, returning.")
      setIsLoading(false)
      setElectives([]) // Ensure electives is empty if no institutionId
      return
    }

    const fetchElectives = async () => {
      setIsLoading(true)
      setError(null)
      console.log(`useCachedElectives: Starting fetch for institutionId: ${institutionId}`)

      // Try to get data from cache first
      const cacheKey = "courseElectives" // Explicitly define cache key
      const cachedElectives = getCachedData<any[]>(cacheKey, institutionId)

      if (cachedElectives) {
        console.log(`useCachedElectives: Using cached data for ${cacheKey} with id ${institutionId}`)
        setElectives(cachedElectives)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log(
        `useCachedElectives: Fetching fresh data for ${cacheKey} from API for institutionId: ${institutionId}`,
      )
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Update to fetch from elective_courses table
        const { data, error: dbError } = await supabase
          .from("elective_courses")
          .select("*, programs:program_id(name, code)") // Assuming program_id is the foreign key in elective_courses
          .eq("institution_id", institutionId)

        if (dbError) {
          console.error("useCachedElectives: Supabase error:", dbError)
          throw dbError
        }
        console.log("useCachedElectives: Fetched data:", data)

        // Add course_count based on courses array
        const formattedData = (data || []).map((item) => ({
          ...item,
          course_count: item.courses && Array.isArray(item.courses) ? item.courses.length : 0,
        }))
        console.log("useCachedElectives: Formatted data:", formattedData)

        // Save to cache
        setCachedData(cacheKey, institutionId, formattedData)

        // Update state
        setElectives(formattedData)
      } catch (err: any) {
        console.error("useCachedElectives: Error fetching course electives:", err)
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load course electives data",
          variant: "destructive",
        })
        setElectives([]) // Clear data on error
      } finally {
        setIsLoading(false)
        console.log("useCachedElectives: Fetch process finished.")
      }
    }

    fetchElectives()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { electives, isLoading, error }
}
