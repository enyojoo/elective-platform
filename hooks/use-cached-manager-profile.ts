"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

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
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // First, let's check what profile exists for this user
        const { data: profileCheck, error: profileCheckError } = await supabase
          .from("profiles")
          .select("id, role, full_name, email, degree_id, academic_year")
          .eq("id", userId)

        console.log("Profile check result:", { profileCheck, profileCheckError })

        if (profileCheckError) {
          throw new Error(`Profile check error: ${profileCheckError.message}`)
        }

        if (!profileCheck || profileCheck.length === 0) {
          throw new Error("No profile found for this user")
        }

        const userProfile = profileCheck[0]
        console.log("User profile found:", userProfile)

        // Check if user has manager role (could be 'program_manager', 'manager', or similar)
        const isManager =
          userProfile.role === "program_manager" ||
          userProfile.role === "manager" ||
          userProfile.role?.toLowerCase().includes("manager")

        if (!isManager) {
          throw new Error(`User role '${userProfile.role}' is not a manager role`)
        }

        // Now fetch the full profile with related data
        const { data: fullProfile, error: fullProfileError } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email,
            degree_id,
            academic_year,
            role,
            degrees:degree_id (
              id,
              name,
              name_ru
            )
          `)
          .eq("id", userId)
          .single()

        console.log("Full profile result:", { fullProfile, fullProfileError })

        if (fullProfileError) {
          // If single() fails, try without single() to see what we get
          const { data: profileArray, error: arrayError } = await supabase
            .from("profiles")
            .select(`
              id,
              full_name,
              email,
              degree_id,
              academic_year,
              role,
              degrees:degree_id (
                id,
                name,
                name_ru
              )
            `)
            .eq("id", userId)

          console.log("Profile array result:", { profileArray, arrayError })

          if (arrayError) {
            throw new Error(`Full profile fetch error: ${arrayError.message}`)
          }

          if (profileArray && profileArray.length > 0) {
            const profileData = profileArray[0]
            // Save to cache
            setCachedData(userId, profileData)
            setProfile(profileData)
          } else {
            throw new Error("No profile data found")
          }
        } else {
          // Save to cache
          setCachedData(userId, fullProfile)
          setProfile(fullProfile)
        }

        // Update the last fetched userId
        lastFetchedUserId.current = userId
      } catch (error: any) {
        console.error("Error fetching manager profile:", error)
        setError(error.message)

        // Only show toast for non-role related errors
        if (!error.message.includes("role")) {
          toast({
            title: "Error",
            description: "Failed to load manager profile",
            variant: "destructive",
          })
        }
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
