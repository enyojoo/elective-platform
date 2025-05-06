"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"

export function useCachedSuperAdminProfile(userId: string | undefined) {
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
      const cachedProfile = getCachedData<any>("superAdminProfile", userId)

      if (cachedProfile) {
        console.log("Using cached super admin profile")
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching super admin profile from API")
      try {
        const response = await fetch(`/api/super-admin/profile?userId=${userId}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Failed to fetch super admin profile")
        }

        const profileData = await response.json()

        // Save to cache
        setCachedData("superAdminProfile", userId, profileData)

        // Update state
        setProfile(profileData)
      } catch (error: any) {
        console.error("Error fetching super admin profile:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load super admin profile",
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
