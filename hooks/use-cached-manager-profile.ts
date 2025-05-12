"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedManagerProfile(userId: string | undefined) {
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
      const cachedProfile = getCachedData<any>("managerProfile", userId)

      if (cachedProfile) {
        console.log("Using cached manager profile")
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching manager profile from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (profileError) throw profileError

        // Manager data is now directly in the profiles table
        const managerDetails = {
          degree_id: profileData.degree_id || null,
          group_id: profileData.group_id || null,
          academic_year: profileData.academic_year || null,
        }

        // Combine the data
        const combinedProfile = {
          ...profileData,
          managerDetails: managerDetails,
        }

        // Save to cache
        setCachedData("managerProfile", userId, combinedProfile)

        // Update state
        setProfile(combinedProfile)
      } catch (error: any) {
        console.error("Error fetching manager profile:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load manager profile",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, getCachedData, setCachedData, toast])

  return { profile, isLoading, error }
}
