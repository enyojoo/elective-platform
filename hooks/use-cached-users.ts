"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedUsers(institutionId: string | undefined) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

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
        console.log("Using cached users data")
        setUsers(cachedUsers)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching users data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, is_active")
          .eq("institution_id", institutionId)

        if (profilesError) throw profilesError

        // Fetch additional data (student profiles, manager profiles, etc.)
        // ... (similar to the code in the users page)

        // Transform the data
        const transformedUsers = profilesData.map((profile) => ({
          id: profile.id,
          name: profile.full_name || "",
          email: profile.email || "",
          role: profile.role || "",
          status: profile.is_active ? "active" : "inactive",
          // Add other fields as needed
        }))

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
  }, [institutionId, getCachedData, setCachedData, toast])

  return { users, isLoading, error }
}
