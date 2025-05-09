"use client"

import { useState, useEffect, useRef } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

export function useCachedUsers(institutionId: string | undefined) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const { language } = useLanguage()
  const isMounted = useRef(true)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Cleanup function to set isMounted to false when component unmounts
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!institutionId || fetchingRef.current) {
      return
    }

    const fetchUsers = async () => {
      // Prevent concurrent fetches
      if (fetchingRef.current) return
      fetchingRef.current = true

      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedUsers = getCachedData<any[]>("users", institutionId)

      if (cachedUsers) {
        console.log("Using cached users data")
        setUsers(cachedUsers)
        setIsLoading(false)
        fetchingRef.current = false
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching users data from API")
      try {
        // Fetch profiles with degree, group, and year information
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(`
            id, 
            full_name, 
            email, 
            role, 
            is_active, 
            student_profiles(group_id, enrollment_year),
            manager_profiles(degree_id, academic_year_id)
          `)
          .eq("institution_id", institutionId)

        if (profilesError) throw profilesError

        if (!isMounted.current) {
          fetchingRef.current = false
          return
        }

        // Fetch degrees and groups in separate queries to avoid deep nesting
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name, name_ru")
          .eq("institution_id", institutionId)

        if (degreesError) throw degreesError

        if (!isMounted.current) {
          fetchingRef.current = false
          return
        }

        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, name")
          .eq("institution_id", institutionId)

        if (groupsError) throw groupsError

        if (!isMounted.current) {
          fetchingRef.current = false
          return
        }

        // Create lookup maps for degrees and groups
        const degreesMap = new Map(degreesData.map((degree) => [degree.id, degree]))
        const groupsMap = new Map(groupsData.map((group) => [group.id, group]))

        // Transform the data
        const transformedUsers = profilesData.map((profile) => {
          // Get student profile data
          const studentProfile = profile.student_profiles && profile.student_profiles[0]
          const groupId = studentProfile ? studentProfile.group_id : null
          const year = studentProfile ? studentProfile.enrollment_year : null

          // Get manager profile data
          const managerProfile = profile.manager_profiles && profile.manager_profiles[0]
          const degreeId = managerProfile ? managerProfile.degree_id : null

          // Get degree name based on language
          let degreeName = ""
          if (degreeId) {
            const degree = degreesMap.get(degreeId)
            if (degree) {
              degreeName = language === "ru" && degree.name_ru ? degree.name_ru : degree.name || ""
            }
          }

          // Get group name
          const groupName = groupId && groupsMap.get(groupId) ? groupsMap.get(groupId)!.name : ""

          return {
            id: profile.id,
            name: profile.full_name || "",
            email: profile.email || "",
            role: profile.role || "",
            status: profile.is_active ? "active" : "inactive",
            degreeId: degreeId || "",
            degreeName: degreeName,
            groupId: groupId || "",
            groupName: groupName,
            year: year || "",
          }
        })

        // Save to cache
        setCachedData("users", institutionId, transformedUsers)

        // Update state
        setUsers(transformedUsers)
      } catch (error: any) {
        console.error("Error fetching users:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive",
        })
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
        fetchingRef.current = false
      }
    }

    fetchUsers()
  }, [institutionId, getCachedData, setCachedData, toast, language])

  return { users, isLoading, error }
}
