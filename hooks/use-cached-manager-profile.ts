"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useCachedManagerProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    console.log(`useCachedManagerProfile: Hook triggered. userId: ${userId}`)
    if (!userId) {
      console.log("useCachedManagerProfile: No userId, returning.")
      setIsLoading(false)
      setProfile(null)
      return
    }

    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      console.log(`useCachedManagerProfile: Starting fetch for userId: ${userId}`)

      const cacheKey = "managerProfile"
      const cachedProfile = getCachedData<any>(cacheKey, userId)

      if (cachedProfile) {
        console.log(`useCachedManagerProfile: Using cached data for ${cacheKey} with id ${userId}`)
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }

      console.log(`useCachedManagerProfile: Fetching fresh data for ${cacheKey} from API for userId: ${userId}`)
      try {
        // Fetch academic_year directly as a column from profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*, degrees:degree_id(id, name), academic_year") // Changed here
          .eq("id", userId)
          .eq("role", "manager")
          .single()

        if (profileError) {
          console.error("useCachedManagerProfile: Supabase error:", profileError)
          throw profileError
        }

        if (!profileData) {
          console.warn(`useCachedManagerProfile: No manager profile found for userId: ${userId}`)
          setProfile(null)
        } else {
          console.log("useCachedManagerProfile: Fetched profile data:", profileData)
          setProfile(profileData)
          setCachedData(cacheKey, userId, profileData)
        }
      } catch (err: any) {
        console.error("useCachedManagerProfile: Error fetching manager profile:", err)
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load manager profile: " + err.message, // Include actual error message
          variant: "destructive",
        })
        setProfile(null)
      } finally {
        setIsLoading(false)
        console.log("useCachedManagerProfile: Fetch process finished.")
      }
    }

    fetchProfile()
  }, [userId, supabase, getCachedData, setCachedData, toast])

  return { profile, isLoading, error }
}
