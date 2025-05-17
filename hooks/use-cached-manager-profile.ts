"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// Cache constants
const CACHE_KEY = "managerProfile"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Cache helper functions
const getCachedData = (userId: string): any | null => {
  try {
    const cachedData = localStorage.getItem(`${CACHE_KEY}_${userId}`)
    if (!cachedData) return null

    const parsed = JSON.parse(cachedData)

    // Check if cache is expired
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`${CACHE_KEY}_${userId}`)
      return null
    }

    return parsed.data
  } catch (error) {
    console.error(`Error reading from cache (${CACHE_KEY}):`, error)
    return null
  }
}

const setCachedData = (userId: string, data: any) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(`${CACHE_KEY}_${userId}`, JSON.stringify(cacheData))
  } catch (error) {
    console.error(`Error writing to cache (${CACHE_KEY}):`, error)
  }
}

export function useCachedManagerProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchProfile = async () => {
      // Only show loading state on initial load
      if (isInitialLoad) {
        setIsLoading(true)
      }

      setError(null)

      try {
        // Try to get data from cache first
        const cachedProfile = getCachedData(userId)

        if (cachedProfile) {
          console.log("Using cached manager profile")
          setProfile(cachedProfile)
          setIsLoading(false)
          setIsInitialLoad(false)
          return
        }

        // If not in cache, fetch from API
        console.log("Fetching manager profile from API")
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch profile with related data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*, degrees(*), groups(*)")
          .eq("id", userId)
          .eq("role", "program_manager")
          .single()

        if (profileError) throw profileError

        // Save to cache
        setCachedData(userId, profileData)

        // Update state
        setProfile(profileData)
      } catch (error: any) {
        console.error("Error fetching manager profile:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load manager profile",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsInitialLoad(false)
      }
    }

    fetchProfile()
  }, [userId, toast, isInitialLoad])

  return { profile, isLoading, error }
}
