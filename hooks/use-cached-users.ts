"use client"

import { useState, useEffect, useRef } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

// Helper function to transform user data based on language
const transformUserData = (data: any[], currentLanguage: string) => {
  return data.map((profile) => {
    // Get degree name based on language
    let degreeName = ""
    if (profile.degrees) {
      degreeName =
        currentLanguage === "ru" && profile.degrees.name_ru ? profile.degrees.name_ru : profile.degrees.name || ""
    }

    return {
      id: profile.id,
      name: profile.full_name || "",
      email: profile.email || "",
      role: profile.role || "",
      status: profile.is_active ? "active" : "inactive",
      degreeId: profile.degree_id || "",
      degreeName: degreeName,
      groupId: profile.group_id || "",
      groupName: profile.groups ? profile.groups.name : "",
      year: profile.academic_year || "",
    }
  })
}

export function useCachedUsers(institutionId: string | undefined) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false) // Start with false
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const { language } = useLanguage()

  // Use a ref to track if data has been fetched
  const dataFetchedRef = useRef(false)

  // Raw data ref to store the original data with all language versions
  const rawDataRef = useRef<any[]>([])

  useEffect(() => {
    // Return early if we don't have an institution
    if (!institutionId) {
      return
    }

    const fetchUsers = async () => {
      // Check if we have cached data first
      const cacheKey = `users-${institutionId}`
      const cachedData = getCachedData(cacheKey)

      // If we have cached data, use it without showing loading state
      if (cachedData && cachedData.length > 0) {
        console.log("Using cached users data")
        rawDataRef.current = cachedData
        const transformedUsers = transformUserData(rawDataRef.current, language)
        setUsers(transformedUsers)
        dataFetchedRef.current = true
        return
      }

      // If we already have raw data, just transform it based on the current language
      if (rawDataRef.current.length > 0) {
        console.log("Using existing raw data with new language:", language)
        const transformedUsers = transformUserData(rawDataRef.current, language)
        setUsers(transformedUsers)
        return
      }

      // Only set loading to true if we need to fetch from API
      setIsLoading(true)

      try {
        console.log("Fetching users data from API")
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch profiles with degree, group, and year information
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(`
        id, 
        full_name, 
        email, 
        role, 
        is_active, 
        degree_id, 
        group_id, 
        academic_year,
        degrees(id, name, name_ru),
        groups(id, name)
      `)
          .eq("institution_id", institutionId)

        if (profilesError) throw profilesError

        // Store the raw data for future language switches
        rawDataRef.current = profilesData

        // Cache the data
        setCachedData(cacheKey, profilesData)

        // Transform the data based on current language
        const transformedUsers = transformUserData(profilesData, language)

        // Update state
        setUsers(transformedUsers)
        dataFetchedRef.current = true
      } catch (error: any) {
        console.error("Error fetching users:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [institutionId, language, toast, getCachedData, setCachedData])

  return { users, isLoading, error }
}
