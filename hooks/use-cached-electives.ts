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
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchElectives = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedElectives = getCachedData<any[]>("courseElectives", institutionId)

      if (cachedElectives) {
        console.log("Using cached course electives data")
        setElectives(cachedElectives)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching course electives data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Update to fetch from elective_courses table
        const { data, error } = await supabase.from("elective_courses").select("*").eq("institution_id", institutionId)

        if (error) throw error

        // Get unique creator IDs
        const creatorIds = data
          .map((item) => item.created_by)
          .filter((id): id is string => id !== null && id !== undefined)
          .filter((id, index, self) => self.indexOf(id) === index)

        // Fetch creator profiles in a single query
        let creatorProfiles: Record<string, string> = {}
        if (creatorIds.length > 0) {
          try {
            const { data: profiles, error: profilesError } = await supabase
              .from("profiles")
              .select("id, full_name")
              .in("id", creatorIds)

            if (profilesError) {
              console.error("Error fetching creator profiles:", profilesError)
            } else if (profiles) {
              // Create a map of profile IDs to names
              creatorProfiles = profiles.reduce(
                (acc, profile) => {
                  if (profile && profile.id) {
                    acc[profile.id] = profile.full_name || "Unknown"
                  }
                  return acc
                },
                {} as Record<string, string>,
              )
            }
          } catch (profileError) {
            console.error("Error in profile fetching:", profileError)
          }
        }

        // Add course_count based on courses array and creator name
        const formattedData = data.map((item) => {
          const creatorName = item.created_by ? creatorProfiles[item.created_by] || null : null
          const courseCount = item.courses && Array.isArray(item.courses) ? item.courses.length : 0

          return {
            ...item,
            course_count: courseCount,
            creator_name: creatorName,
          }
        })

        // Save to cache
        setCachedData("courseElectives", institutionId, formattedData)

        // Update state
        setElectives(formattedData)
      } catch (error: any) {
        console.error("Error fetching course electives:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load course electives data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElectives()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { electives, isLoading, error }
}
