"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useCachedStudentProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error("No authenticated user found")
        }

        // Try to get data from cache first
        const cachedProfile = getCachedData<any>("studentProfile", user.id)

        if (cachedProfile) {
          console.log("Using cached student profile")
          setProfile(cachedProfile)
          setIsLoading(false)
          return
        }

        // If not in cache, fetch from API
        console.log("Fetching student profile from API")

        // Fetch the profile data with proper relationships
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            degrees:degree_id(id, name),
            groups:group_id(id, name)
          `)
          .eq("id", user.id)
          .eq("role", "student")
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          throw new Error(`Failed to fetch profile: ${profileError.message}`)
        }

        if (!profileData) {
          throw new Error("No profile data found")
        }

        console.log("Raw profile data:", profileData)

        // Process the profile data
        const processedProfile = {
          ...profileData,
          year: profileData.academic_year || "Not specified",
          degree: profileData.degrees || { name: "Not specified" },
          group: profileData.groups || { name: "Not assigned" },
        }

        console.log("Processed profile data:", processedProfile)

        // Save to cache
        setCachedData("studentProfile", user.id, processedProfile)

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
  }, []) // Remove dependencies to prevent infinite loops

  return { profile, isLoading, error }
}
