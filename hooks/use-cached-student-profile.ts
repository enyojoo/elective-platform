"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useCachedStudentProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

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
      console.log("Fetching student profile from API for user:", userId)
      try {
        // Fetch the profile data with proper relationships and explicit role filter
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            degrees:degree_id(id, name),
            groups:group_id(id, name)
          `)
          .eq("id", userId)
          .eq("role", "student") // Explicitly filter for student role
          .single()

        console.log("Student profile query result:", profileData, "Error:", profileError)

        if (profileError) {
          console.error("Student profile fetch error:", profileError)
          throw profileError
        }

        if (!profileData) {
          throw new Error("No student profile data found for user")
        }

        // Verify this is actually a student profile
        if (profileData.role !== "student") {
          throw new Error(`Expected student role, but got: ${profileData.role}`)
        }

        console.log("Raw student profile data:", profileData)

        // Use the profile data with proper relationships
        const processedProfile = {
          ...profileData,
          // Use academic_year directly as the year
          year: profileData.academic_year || "Not specified",
          enrollment_year: profileData.academic_year || "Not specified",
          // Use the proper relationship data
          degree: profileData.degrees || { name: "Not specified" },
          group: profileData.groups || { name: "Not assigned" },
        }

        console.log("Processed student profile data:", processedProfile)

        // Save to cache
        setCachedData("studentProfile", userId, processedProfile)

        // Update state
        setProfile(processedProfile)
      } catch (error: any) {
        console.error("Error fetching student profile:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: `Failed to load student profile: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, supabase, getCachedData, setCachedData, toast])

  return { profile, isLoading, error }
}
