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

      const cachedProfile = getCachedData<any>("studentProfile", userId)
      if (cachedProfile) {
        console.log("Using cached student profile:", cachedProfile)
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }

      console.log("Fetching student profile from API for userId:", userId)
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            degrees (id, name),
            groups (id, name)
          `)
          .eq("id", userId)
          .eq("role", "student")
          .single()

        if (profileError) {
          console.error("Supabase error fetching profile:", profileError)
          throw profileError
        }

        console.log("Raw profile data from Supabase:", profileData)

        if (!profileData) {
          throw new Error("Student profile not found.")
        }

        const processedProfile = {
          ...profileData,
          year: profileData.academic_year || "Not specified",
          enrollment_year: profileData.academic_year || "Not specified", // Keep for compatibility if used elsewhere
          degree: { name: profileData.degrees?.name || "Not specified" },
          group: { name: profileData.groups?.name || "Not assigned" },
        }

        console.log("Processed profile data for caching:", processedProfile)

        setCachedData("studentProfile", userId, processedProfile)
        setProfile(processedProfile)
      } catch (error: any) {
        console.error("Error fetching student profile:", error.message)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load student profile. " + error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId]) // Dependencies: getCachedData, setCachedData, toast removed to prevent loops

  return { profile, isLoading, error }
}
