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

        // This query attempts to embed related degree and group information.
        // It assumes 'profiles' has 'degree_id' and 'group_id' foreign keys.
        // It also assumes 'degrees' and 'groups' tables have a 'name' column for the display text.
        // If your FK columns or display name columns are different, this query will need adjustment.
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            degree:degrees!inner(id, name), 
            group:groups!inner(id, name)
          `)
          // Using !inner to ensure that if a degree_id or group_id is present but doesn't match,
          // the profile itself might not be returned, or the embedded field will be null.
          // If you want profiles even without a degree/group, remove !inner or use !left.
          // For this to work, 'degree_id' in 'profiles' must point to 'degrees(id)'
          // and 'group_id' in 'profiles' must point to 'groups(id)'.
          // Supabase might infer this if FKs are named 'degree_id' and 'group_id'.
          // If not, you might need to specify the FK like: degrees!profiles_degree_id_fkey(id, name)
          .eq("id", userId)
          .eq("role", "student")
          .single()

        if (profileError) {
          console.error("Supabase error fetching profile with embedded data:", profileError)
          // Fallback to fetching profile without embedding if the join fails
          console.log("Falling back to fetching profile without embedded data...")
          const { data: plainProfileData, error: plainProfileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .eq("role", "student")
            .single()

          if (plainProfileError) {
            console.error("Supabase error fetching plain profile data:", plainProfileError)
            throw plainProfileError
          }
          if (!plainProfileData) throw new Error("Student profile not found (fallback).")

          console.log("Plain profile data (fallback):", plainProfileData)
          // If using fallback, degree and group names will be default
          const processedFallbackProfile = {
            ...plainProfileData,
            year: plainProfileData.academic_year || "Not specified",
            enrollment_year: plainProfileData.academic_year || "Not specified",
            degree: { name: "Not specified (fallback)" },
            group: { name: "Not assigned (fallback)" },
          }
          setCachedData("studentProfile", userId, processedFallbackProfile)
          setProfile(processedFallbackProfile)
          toast({
            title: "Partial Profile Data",
            description: "Could not load full degree/group details. Displaying basic profile.",
            variant: "default",
          })
          setIsLoading(false)
          return
        }

        console.log("Raw profile data with embedded degree/group from Supabase:", profileData)

        if (!profileData) {
          throw new Error("Student profile not found.")
        }

        // The embedded data will be under profileData.degree and profileData.group
        const processedProfile = {
          ...profileData,
          year: profileData.academic_year || "Not specified",
          enrollment_year: profileData.academic_year || "Not specified",
          degree: { name: profileData.degree?.name || "Not specified" },
          group: { name: profileData.group?.name || "Not assigned" },
        }

        console.log("Processed profile data for caching (with embedding):", processedProfile)

        setCachedData("studentProfile", userId, processedProfile)
        setProfile(processedProfile)
      } catch (error: any) {
        console.error("Error in fetchProfile:", error.message)
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
  }, [userId])

  return { profile, isLoading, error }
}
