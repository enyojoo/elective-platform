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

        console.log("Current user ID:", user.id)

        // Try to get data from cache first
        const cachedProfile = getCachedData<any>("studentProfile", user.id)

        if (cachedProfile) {
          console.log("Using cached student profile")
          setProfile(cachedProfile)
          setIsLoading(false)
          return
        }

        console.log("Fetching student profile from API")

        // First, let's just get the basic profile without joins
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)
          throw new Error(`Failed to fetch profile: ${profileError.message}`)
        }

        if (!profileData) {
          throw new Error("No profile data found")
        }

        console.log("Raw profile data:", profileData)

        // Now get degree info if degree_id exists
        let degreeData = null
        if (profileData.degree_id) {
          const { data: degree } = await supabase
            .from("degrees")
            .select("id, name")
            .eq("id", profileData.degree_id)
            .single()
          degreeData = degree
        }

        // Now get group info if group_id exists
        let groupData = null
        if (profileData.group_id) {
          const { data: group } = await supabase
            .from("groups")
            .select("id, name")
            .eq("id", profileData.group_id)
            .single()
          groupData = group
        }

        // Process the profile data
        const processedProfile = {
          ...profileData,
          year: profileData.academic_year || "Not specified",
          degree: degreeData || { name: "Not specified" },
          group: groupData || { name: "Not assigned" },
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
  }, [])

  return { profile, isLoading, error }
}
