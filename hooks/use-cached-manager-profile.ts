"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"

// Cache constants
const CACHE_KEY = "managerProfile"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Cache helper functions
const getCachedData = (userId: string): any | null => {
  if (typeof window === "undefined") return null

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
  if (typeof window === "undefined") return

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

  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true)

  // Use a ref to track the last userId we fetched for
  const lastFetchedUserId = useRef<string | undefined>(undefined)

  useEffect(() => {
    // If no userId, we can't fetch anything
    if (!userId) {
      setIsLoading(false)
      return
    }

    // If we already fetched for this userId and this isn't the initial mount, don't fetch again
    if (lastFetchedUserId.current === userId && !isInitialMount.current) {
      return
    }

    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        console.log(`Checking cache for manager profile: ${userId}`)
        // Try to get data from cache first
        const cachedProfile = getCachedData(userId)

        if (cachedProfile) {
          console.log("Using cached manager profile")
          setProfile(cachedProfile)
          setIsLoading(false)
          // Update the last fetched userId
          lastFetchedUserId.current = userId
          return
        }

        // If not in cache, fetch from API
        console.log("Fetching manager profile from API")

        // Use the browser client from our utility
        const supabase = getSupabaseBrowserClient()

        // First try to fetch using the profiles API endpoint
        try {
          const response = await fetch(`/api/admin/profile?userId=${userId}`)

          if (response.ok) {
            const profileData = await response.json()

            // If we got data from the API, use it
            if (profileData) {
              // Fetch related degree data if needed
              if (profileData.degree_id) {
                const { data: degreeData } = await supabase
                  .from("degrees")
                  .select("*")
                  .eq("id", profileData.degree_id)
                  .single()

                if (degreeData) {
                  profileData.degrees = degreeData
                }
              }

              // Save to cache
              setCachedData(userId, profileData)

              // Update state
              setProfile(profileData)

              // Update the last fetched userId
              lastFetchedUserId.current = userId
              setIsLoading(false)
              return
            }
          }
        } catch (apiError) {
          console.error("Error fetching from profile API:", apiError)
          // Continue to fallback method
        }

        // Fallback: Fetch profile with related data directly
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*, degrees(*), groups(*)")
          .eq("id", userId)
          .eq("role", "program_manager")
          .single()

        if (profileError) {
          // If we get a specific error about the role, try without the role filter
          if (profileError.message.includes("no rows returned")) {
            console.log("No profile found with program_manager role, trying without role filter")
            const { data: anyProfileData, error: anyProfileError } = await supabase
              .from("profiles")
              .select("*, degrees(*), groups(*)")
              .eq("id", userId)
              .single()

            if (anyProfileError) throw anyProfileError

            // Save to cache
            setCachedData(userId, anyProfileData)

            // Update state
            setProfile(anyProfileData)

            // Update the last fetched userId
            lastFetchedUserId.current = userId
            return
          }

          throw profileError
        }

        // Save to cache
        setCachedData(userId, profileData)

        // Update state
        setProfile(profileData)

        // Update the last fetched userId
        lastFetchedUserId.current = userId
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
      }
    }

    fetchProfile()

    // Mark that we're no longer on initial mount
    isInitialMount.current = false
  }, [userId, toast])

  return { profile, isLoading, error }
}
