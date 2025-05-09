"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"

export function useCachedUsers(institutionId: string | undefined) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const { language } = useLanguage()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchUsers = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedUsers = getCachedData<any[]>("users", institutionId)

      if (cachedUsers) {
        setUsers(cachedUsers)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, is_active, degree_id, group_id, academic_year")
          .eq("institution_id", institutionId)

        if (profilesError) throw profilesError

        // Create a map to store degree and group information
        const degreeMap = new Map()
        const groupMap = new Map()

        // Fetch degrees if there are any degree_ids
        const degreeIds = profilesData.filter((profile) => profile.degree_id).map((profile) => profile.degree_id)

        if (degreeIds.length > 0) {
          const { data: degreesData, error: degreesError } = await supabase
            .from("degrees")
            .select("id, name, name_ru")
            .in("id", degreeIds)

          if (degreesError) throw degreesError

          // Store degrees in the map
          degreesData.forEach((degree) => {
            degreeMap.set(degree.id, degree)
          })
        }

        // Fetch groups if there are any group_ids
        const groupIds = profilesData.filter((profile) => profile.group_id).map((profile) => profile.group_id)

        if (groupIds.length > 0) {
          const { data: groupsData, error: groupsError } = await supabase
            .from("groups")
            .select("id, name")
            .in("id", groupIds)

          if (groupsError) throw groupsError

          // Store groups in the map
          groupsData.forEach((group) => {
            groupMap.set(group.id, group)
          })
        }

        // Transform the data
        const transformedUsers = profilesData.map((profile) => {
          // Get degree information
          let degreeName = ""
          if (profile.degree_id && degreeMap.has(profile.degree_id)) {
            const degree = degreeMap.get(profile.degree_id)
            degreeName = language === "ru" && degree.name_ru ? degree.name_ru : degree.name
          }

          // Get group information
          let groupName = ""
          if (profile.group_id && groupMap.has(profile.group_id)) {
            groupName = groupMap.get(profile.group_id).name
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
            groupName: groupName,
            year: profile.academic_year || "",
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
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [institutionId, getCachedData, setCachedData, toast, language])

  // Function to invalidate cache and refresh data
  const refreshUsers = () => {
    if (institutionId) {
      setCachedData("users", institutionId, null)
    }
  }

  return { users, isLoading, error, refreshUsers }
}
