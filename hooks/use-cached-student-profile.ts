"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedStudentProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedProfile = getCachedData<any>("studentProfile", userId)

      if (cachedProfile) {
        console.log("Using cached student profile")
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching student profile from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch the profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .eq("role", "student")
          .single()

        if (profileError) throw profileError

        console.log("Raw profile data:", profileData)

        // Use the profile data directly
        const processedProfile = {
          ...profileData,
          // Use academic_year directly as the year
          year: profileData.academic_year || "Not specified",
          enrollment_year: profileData.academic_year || "Not specified",
          // Add placeholder data for missing relationships if needed
          degree: { name: profileData.degree_name || "Not specified" },
          group: { name: profileData.group_name || "Not assigned" },
        }

        console.log("Processed profile data:", processedProfile)

        // Save to cache
        setCachedData("studentProfile", userId, processedProfile)

        // Update state
        setProfile(processedProfile)
      } catch (error: any) {
        console.error("Error fetching student profile:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load student profile",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId]) // Removed function dependencies to prevent infinite loops

  return { profile, isLoading, error }
}
