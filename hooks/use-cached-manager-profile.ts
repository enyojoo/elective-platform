"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useCachedManagerProfile(userId?: string) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // 1. Determine the user ID to use for fetching.
        let effectiveUserId = userId
        if (!effectiveUserId) {
          // If no ID is passed, get it from the current session.
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError || !user) {
            // This is a critical error, not a silent failure.
            console.error("useCachedManagerProfile: User not authenticated.", userError)
            setError("You are not logged in or your session has expired.")
            setIsLoading(false)
            return
          }
          effectiveUserId = user.id
        }

        // 2. Try to get data from cache first.
        const cacheKey = "managerProfile"
        const cachedProfile = getCachedData<any>(cacheKey, effectiveUserId)
        if (cachedProfile) {
          console.log(`useCachedManagerProfile: Using cached data for user ${effectiveUserId}`)
          setProfile(cachedProfile)
          setIsLoading(false)
          return
        }

        // 3. If not in cache, fetch from the database.
        console.log(`useCachedManagerProfile: Fetching fresh data from API for user: ${effectiveUserId}`)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*, degrees:degree_id(id, name), academic_year")
          .eq("id", effectiveUserId)
          .eq("role", "program_manager")
          .single()

        if (profileError) {
          console.error("useCachedManagerProfile: Supabase error:", profileError)
          throw profileError // Let the catch block handle it.
        }

        if (!profileData) {
          throw new Error(`No program manager profile found for user.`)
        }

        // 4. Set state and update cache.
        console.log("useCachedManagerProfile: Fetched profile data:", profileData)
        setProfile(profileData)
        setCachedData(cacheKey, effectiveUserId, profileData)
      } catch (err: any) {
        console.error("useCachedManagerProfile: Error fetching manager profile:", err)
        const errorMessage = err.message || "An unknown error occurred."
        setError(errorMessage)
        toast({
          title: "Error Loading Profile",
          description: `Failed to load program manager profile: ${errorMessage}`,
          variant: "destructive",
        })
        setProfile(null) // Clear profile on error
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, supabase, getCachedData, setCachedData, toast])

  return { profile, isLoading, error }
}
