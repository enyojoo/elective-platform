"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase/supabaseBrowserClient"

// Cache constants
const CACHE_KEY = "managerProfile"
const CACHE_EXPIRY = 60 * 60 * 1000 // 60 minutes

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
  const [profile, setProfile] = useState<any>(() => {
    // Initialize with cached data if available
    if (typeof window !== "undefined" && userId) {
      try {
        return getCachedData(userId) || null
      } catch (e) {
        return null
      }
    }
    return null
  })

  const [isLoading, setIsLoading] = useState(() => {
    // If we have cached data, don't start in loading state
    if (typeof window !== "undefined" && userId) {
      try {
        const cachedData = getCachedData(userId)
        return !cachedData
      } catch (e) {
        return true
      }
    }
    return true
  })
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
      try {
        console.log(`Checking cache for manager profile: ${userId}`)
        // Try to get data from cache first
        const cachedProfile = getCachedData(userId)

        if (cachedProfile) {
          console.log("Using cached manager profile")
          setProfile(cachedProfile)
          setIsLoading(false)
          setError(null)
          // Update the last fetched userId
          lastFetchedUserId.current = userId
          return
        }

        // If not in cache, fetch from API
        console.log("Fetching manager profile from API")
        setIsLoading(true)
        setError(null)

        const supabase = getSupabaseBrowserClient()

        // First, try to fetch the profile without role restriction to see what we get
        console.log("Fetching profile for user ID:", userId)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
        id,
        full_name,
        email,
        role,
        degree_id,
        academic_year,
        institution_id,
        degrees (
          id,
          name,
          name_ru
        )
      `)
          .eq("id", userId)
          .single()

        if (profileError) {
          console.error("Profile fetch error:", profileError)

          // If no profile found, try to get basic user info from auth
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError || !user) {
            throw new Error("Unable to fetch user information")
          }

          // Create a basic profile object from auth data
          const basicProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
            email: user.email,
            role: "program_manager",
            degree_id: null,
            academic_year: null,
            institution_id: null,
            degrees: null,
          }

          console.log("Using basic profile from auth:", basicProfile)
          setProfile(basicProfile)
          setCachedData(userId, basicProfile)
          lastFetchedUserId.current = userId
          return
        }

        console.log("Fetched profile data:", profileData)

        // Check if the user has manager role or if role is null/undefined (might be a new user)
        if (profileData.role && profileData.role !== "program_manager") {
          console.warn(`User role is '${profileData.role}', expected 'program_manager'`)
          // Still proceed with the data we have
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
