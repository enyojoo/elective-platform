"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedCourses(institutionId: string | undefined) {
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchCourses = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedCourses = getCachedData<any[]>("courses", institutionId)

      if (cachedCourses) {
        console.log("Using cached courses data")
        setCourses(cachedCourses)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching courses data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("courses")
          .select("*, degree:degree_id(id, name, name_ru, code)")
          .eq("institution_id", institutionId)

        if (error) throw error

        // Save to cache
        setCachedData("courses", institutionId, data)

        // Update state
        setCourses(data)
      } catch (error: any) {
        console.error("Error fetching courses:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load courses data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { courses, isLoading, error }
}
