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
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
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

      // Invalidate cache when language changes to force a refresh
      invalidateCache("users", institutionId)

      // Try to get data from cache first
      const cachedUsers = getCachedData<any[]>("users", institutionId)

      if (cachedUsers) {
        console.log("Using cached users data")
        setUsers(cachedUsers)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching users data from API")
      try {
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

        // Transform the data
        const transformedUsers = profilesData.map((profile) => {
          // Get degree name based on language
          let degreeName = ""
          if (profile.degrees) {
            degreeName = language === "ru" && profile.degrees.name_ru ? profile.degrees.name_ru : profile.degrees.name
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
  }, [institutionId, getCachedData, setCachedData, invalidateCache, toast, language])

  return { users, isLoading, error }
}
