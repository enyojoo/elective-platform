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
      console.log("useCachedStudentProfile: Starting profile fetch")

      try {
        let currentUserId = userId

        if (!currentUserId) {
          console.log("useCachedStudentProfile: No userId provided, checking session")
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (sessionError) {
            console.error("useCachedStudentProfile: Session error:", sessionError)
            throw new Error(`Authentication error: ${sessionError.message}`)
          }

          if (!session || !session.user) {
            console.log("useCachedStudentProfile: No active session found")
            setIsLoading(false)
            return
          }

          currentUserId = session.user.id
          console.log("useCachedStudentProfile: Got userId from session:", currentUserId)
        }

        const cachedProfile = getCachedData<any>("studentProfile", currentUserId)

        if (cachedProfile) {
          console.log("useCachedStudentProfile: Using cached student profile")
          setProfile(cachedProfile)
          setIsLoading(false)
          return
        }

        console.log("useCachedStudentProfile: Fetching student profile from API for user:", currentUserId)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            `
            *,
            degrees:degree_id(id, name),
            groups:group_id(id, name)
          `,
          )
          .eq("id", currentUserId)
          .eq("role", "student")
          .single()

        console.log("useCachedStudentProfile: Query result:", profileData, "Error:", profileError)

        if (profileError) {
          console.error("useCachedStudentProfile: Profile fetch error:", profileError)
          throw profileError
        }

        if (!profileData) {
          console.error("useCachedStudentProfile: No profile data found")
          throw new Error("No student profile data found for user")
        }

        if (profileData.role !== "student") {
          console.error(`useCachedStudentProfile: Expected student role, but got: ${profileData.role}`)
          throw new Error(`Expected student role, but got: ${profileData.role}`)
        }

        console.log("useCachedStudentProfile: Raw student profile data:", profileData)

        const processedProfile = {
          ...profileData,
          year: profileData.academic_year || "Not specified",
          enrollment_year: profileData.academic_year || "Not specified",
          degree: profileData.degrees || { name: "Not specified" },
          group: profileData.groups || { name: "Not assigned" },
        }

        console.log("useCachedStudentProfile: Processed student profile data:", processedProfile)

        setCachedData("studentProfile", currentUserId, processedProfile)
        setProfile(processedProfile)
      } catch (error: any) {
        console.error("useCachedStudentProfile: Error:", error)
        setError(error.message)
        toast({
          title: "Profile Error",
          description: `Failed to load student profile: ${error.message}`,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId, supabase, getCachedData, setCachedData, toast])

  return { profile, isLoading, error }
}
