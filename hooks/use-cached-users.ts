"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

export function useCachedUsers(institutionId: string | undefined) {
  // Get cache key based on institution ID
  const cacheKey = institutionId ? `users-${institutionId}` : ""

  // Get cache utilities
  const { getCachedData, setCachedData, isCacheValid } = useDataCache()

  // Check if we have valid cached data immediately
  const initialCachedData = institutionId ? getCachedData(cacheKey) : null
  const hasCachedData = initialCachedData && initialCachedData.length > 0

  // Initialize state based on cache availability
  const [isLoading, setIsLoading] = useState(!hasCachedData)
  const { language } = useLanguage()
  const [users, setUsers] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()

  // Raw data ref to store the original data with all language versions
  const rawDataRef = useRef<any[]>([])

  // Track if we've already fetched data in this session
  const hasInitializedRef = useRef(false)

  // Helper function to transform user data based on language
  const transformUserData = useCallback((data: any[], currentLanguage: string) => {
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
  }, [])

  // Function to fetch users from the API
  const fetchUsersFromAPI = useCallback(async () => {
    if (!institutionId) return

    setIsLoading(true)

    try {
      console.log("Fetching users data from API")
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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

      // Store the raw data
      rawDataRef.current = profilesData || []

      // Cache the data
      setCachedData(cacheKey, profilesData)

      // Transform and update state
      const transformedUsers = transformUserData(profilesData || [], language)
      setUsers(transformedUsers)
      hasInitializedRef.current = true

      return transformedUsers
    } catch (error: any) {
      console.error("Error fetching users:", error)
      setError(error.message)
      toast({
        title: "Error",
        description: "Failed to load users data",
        variant: "destructive",
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [institutionId, language, toast, setCachedData, cacheKey, transformUserData])

  // Effect to handle data fetching and language changes
  useEffect(() => {
    if (!institutionId) return

    const handleDataFetching = async () => {
      // Check if we have cached data
      const cachedData = getCachedData(cacheKey)

      if (cachedData && cachedData.length > 0) {
        console.log("Using cached users data")
        rawDataRef.current = cachedData
        const transformedUsers = transformUserData(cachedData, language)
        setUsers(transformedUsers)
        setIsLoading(false)
        hasInitializedRef.current = true
      }
      // If we have raw data but language changed, just transform it
      else if (rawDataRef.current.length > 0) {
        console.log("Using existing raw data with new language:", language)
        const transformedUsers = transformUserData(rawDataRef.current, language)
        setUsers(transformedUsers)
        setIsLoading(false)
      }
      // Otherwise fetch from API
      else if (!hasInitializedRef.current) {
        await fetchUsersFromAPI()
      }
    }

    handleDataFetching()
  }, [institutionId, language, getCachedData, cacheKey, fetchUsersFromAPI, transformUserData])

  // Function to refresh data (can be called manually)
  const refreshUsers = useCallback(async () => {
    return await fetchUsersFromAPI()
  }, [fetchUsersFromAPI])

  useEffect(() => {
    if (hasCachedData) {
      setUsers(transformUserData(initialCachedData, language))
      rawDataRef.current = initialCachedData
    }
  }, [hasCachedData, initialCachedData, language, transformUserData])

  return {
    users,
    isLoading,
    error,
    refreshUsers, // Expose refresh function
  }
}
