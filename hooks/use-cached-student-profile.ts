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
    // If userId is not yet available, set loading to false and wait.
    if (!userId) {
      console.log("useCachedStudentProfile: userId is undefined, waiting.")
      setIsLoading(false) // Not loading if no userId to fetch for
      setProfile(null) // Ensure profile is null if no userId
      setError(null)
      return
    }

    const fetchProfile = async () => {
      console.log(`useCachedStudentProfile: Starting fetch for userId: ${userId}`)
      setIsLoading(true)
      setError(null)
      setProfile(null) // Reset profile before fetching

      // Try to get data from cache first
      const cacheKey = `studentProfile-${userId}`
      const cachedProfile = getCachedData<any>(cacheKey) // Use a more specific cache key

      if (cachedProfile) {
        console.log(`useCachedStudentProfile: Found cached profile for userId: ${userId}`, cachedProfile)
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }

      console.log(`useCachedStudentProfile: No cache found for userId: ${userId}. Fetching from API.`)
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch the profile data for the logged-in user
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single() // This expects exactly one row

        if (profileError) {
          // This block will be hit if .single() finds 0 or more than 1 row.
          console.error(`useCachedStudentProfile: Supabase error fetching profile for userId ${userId}:`, profileError)
          throw new Error(
            `Profile query failed for user ${userId}: ${profileError.message} (Hint: ${profileError.hint}, Code: ${profileError.code})`,
          )
        }

        if (!profileData) {
          // This case should ideally be caught by profileError with .single(),
          // but as a safeguard:
          console.error(
            `useCachedStudentProfile: No profile data returned for userId ${userId}, though no explicit Supabase error.`,
          )
          throw new Error(`No profile data found for user ${userId}.`)
        }

        console.log(`useCachedStudentProfile: Raw profile data for userId ${userId}:`, profileData)

        // Fetch degree data if degree_id exists
        let degreeData = null
        if (profileData.degree_id) {
          console.log(`useCachedStudentProfile: Fetching degree for degree_id: ${profileData.degree_id}`)
          const { data: degree, error: degreeError } = await supabase
            .from("degrees")
            .select("id, name")
            .eq("id", profileData.degree_id)
            .single()

          if (degreeError) {
            console.warn(
              `useCachedStudentProfile: Could not fetch degree for id ${profileData.degree_id}: ${degreeError.message}`,
            )
            // Not throwing an error, just means degree info will be missing
          } else if (degree) {
            degreeData = degree
            console.log(`useCachedStudentProfile: Fetched degree data:`, degreeData)
          }
        }

        // Fetch group data if group_id exists
        let groupData = null
        if (profileData.group_id) {
          console.log(`useCachedStudentProfile: Fetching group for group_id: ${profileData.group_id}`)
          const { data: group, error: groupError } = await supabase
            .from("groups")
            .select("id, name")
            .eq("id", profileData.group_id)
            .single()

          if (groupError) {
            console.warn(
              `useCachedStudentProfile: Could not fetch group for id ${profileData.group_id}: ${groupError.message}`,
            )
            // Not throwing an error, just means group info will be missing
          } else if (group) {
            groupData = group
            console.log(`useCachedStudentProfile: Fetched group data:`, groupData)
          }
        }

        // Construct the final profile object
        const finalProfileData = {
          ...profileData,
          degrees: degreeData, // Will be null if not found/error
          groups: groupData, // Will be null if not found/error
        }

        console.log(`useCachedStudentProfile: Final profile data for userId ${userId}:`, finalProfileData)

        // Save to cache
        setCachedData(cacheKey, finalProfileData)

        // Update state
        setProfile(finalProfileData)
      } catch (error: any) {
        console.error(`useCachedStudentProfile: Catch block error for userId ${userId}:`, error.message)
        setError(error.message) // Set the error state
        toast({
          title: "Profile Error",
          description: `Failed to load profile: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        console.log(`useCachedStudentProfile: Fetch finished for userId: ${userId}. Loading: ${false}`)
      }
    }

    fetchProfile()
  }, [userId, getCachedData, setCachedData, toast]) // Added getCachedData, setCachedData, toast as they are used.
  // If these functions from context are not memoized, this could still cause loops.
  // Assuming they are stable or memoized.

  return { profile, isLoading, error }
}
