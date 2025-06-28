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
      console.log("useCachedManagerProfile: Starting profile fetch")

      try {
        let currentUserId = userId

        if (!currentUserId) {
          console.log("useCachedManagerProfile: No userId provided, checking session")
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (sessionError) {
            console.error("useCachedManagerProfile: Session error:", sessionError)
            throw new Error(`Authentication error: ${sessionError.message}`)
          }

          if (!session || !session.user) {
            console.log("useCachedManagerProfile: No active session found")
            setIsLoading(false)
            return
          }

          currentUserId = session.user.id
          console.log("useCachedManagerProfile: Got userId from session:", currentUserId)
        }

        const cacheKey = "managerProfile"
        const cachedProfile = getCachedData<any>(cacheKey, currentUserId)

        if (cachedProfile) {
          console.log(`useCachedManagerProfile: Using cached data for ${cacheKey} with id ${currentUserId}`)
          setProfile(cachedProfile)
          setIsLoading(false)
          return
        }

        console.log(
          `useCachedManagerProfile: Fetching fresh data for ${cacheKey} from API for userId: ${currentUserId}`,
        )
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*, degrees:degree_id(id, name), academic_year")
          .eq("id", currentUserId)
          .eq("role", "program_manager")
          .single()

        if (profileError) {
          console.error("useCachedManagerProfile: Supabase error:", profileError)
          throw profileError
        }

        if (!profileData) {
          console.warn(`useCachedManagerProfile: No program_manager profile found for userId: ${currentUserId}`)
          setProfile(null)
        } else {
          console.log("useCachedManagerProfile: Fetched profile data:", profileData)
          setProfile(profileData)
          setCachedData(cacheKey, currentUserId, profileData)
        }
      } catch (err: any) {
        console.error("useCachedManagerProfile: Error fetching manager profile:", err)
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load program manager profile",
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
