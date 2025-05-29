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
      console.log("Fetching student profile from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch profile with related data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
    *,
    degree:degrees(*),
    group:groups(*)
  `)
          .eq("id", userId)
          .eq("role", "student")
          .single()

        if (profileError) throw profileError

        // Save to cache
        setCachedData("studentProfile", userId, profileData)

        // Update state
        setProfile(profileData)
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
  }, [userId, getCachedData, setCachedData, toast])

  return { profile, isLoading, error }
}
