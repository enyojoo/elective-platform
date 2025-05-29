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
      console.log("Fetching student profile from API for userId:", userId)
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch the profile data for the logged-in user
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (profileError) {
          console.error("Profile error:", profileError)
          throw profileError
        }

        console.log("Raw profile data:", profileData)

        // Fetch degree data if degree_id exists
        let degreeData = null
        if (profileData.degree_id) {
          console.log("Fetching degree for degree_id:", profileData.degree_id)
          const { data: degree, error: degreeError } = await supabase
            .from("degrees")
            .select("id, name")
            .eq("id", profileData.degree_id)
            .single()

          if (!degreeError && degree) {
            degreeData = degree
            console.log("Fetched degree data:", degreeData)
          }
        }

        // Fetch group data if group_id exists
        let groupData = null
        if (profileData.group_id) {
          console.log("Fetching group for group_id:", profileData.group_id)
          const { data: group, error: groupError } = await supabase
            .from("groups")
            .select("id, name")
            .eq("id", profileData.group_id)
            .single()

          if (!groupError && group) {
            groupData = group
            console.log("Fetched group data:", groupData)
          }
        }

        // Construct the final profile object
        const finalProfileData = {
          ...profileData,
          degrees: degreeData,
          groups: groupData,
        }

        console.log("Final profile data:", finalProfileData)

        // Save to cache
        setCachedData("studentProfile", userId, finalProfileData)

        // Update state
        setProfile(finalProfileData)
      } catch (error: any) {
        console.error("Error fetching student profile:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: `Failed to load profile: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  return { profile, isLoading, error }
}
