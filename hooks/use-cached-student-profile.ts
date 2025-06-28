"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function useCachedStudentProfile(userId?: string) {
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
            console.error("useCachedStudentProfile: User not authenticated.", userError)
            setError("You are not logged in or your session has expired.")
            setIsLoading(false)
            return
          }
          effectiveUserId = user.id
        }

        // 2. Try to get data from cache first.
        const cacheKey = "studentProfile"
        const cachedProfile = getCachedData<any>(cacheKey, effectiveUserId)
        if (cachedProfile) {
          console.log(`useCachedStudentProfile: Using cached data for user ${effectiveUserId}`)
          setProfile(cachedProfile)
          setIsLoading(false)
          return
        }

        // 3. If not in cache, fetch from the database.
        console.log(`useCachedStudentProfile: Fetching fresh data from API for user: ${effectiveUserId}`)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
            *,
            degrees:degree_id(id, name),
            groups:group_id(id, name)
          `,
          )
          .eq("id", effectiveUserId)
          .eq("role", "student")
          .single()

        if (profileError) {
          console.error("useCachedStudentProfile: Supabase error:", profileError)
          throw profileError // Let the catch block handle it.
        }

        if (!profileData) {
          throw new Error("No student profile data found for user.")
        }

        // 4. Process data, set state, and update cache.
        const processedProfile = {
          ...profileData,
          year: profileData.academic_year || "Not specified",
          enrollment_year: profileData.academic_year || "Not specified",
          degree: profileData.degrees || { name: "Not specified" },
          group: profileData.groups || { name: "Not assigned" },
        }

        console.log("useCachedStudentProfile: Processed student profile data:", processedProfile)
        setProfile(processedProfile)
        setCachedData(cacheKey, effectiveUserId, processedProfile)
      } catch (err: any) {
        console.error("useCachedStudentProfile: Error fetching student profile:", err)
        const errorMessage = err.message || "An unknown error occurred."
        setError(errorMessage)
        toast({
          title: "Error Loading Profile",
          description: `Failed to load student profile: ${errorMessage}`,
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
