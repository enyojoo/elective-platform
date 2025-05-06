"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedStudentCourseSelections(userId: string | undefined) {
  const [selections, setSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchSelections = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedSelections = getCachedData<any[]>("studentCourseSelections", userId)

      if (cachedSelections) {
        console.log("Using cached student course selections")
        setSelections(cachedSelections)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching student course selections from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("student_elective_selections")
          .select("*, elective_packs(*), elective_courses(*)")
          .eq("student_id", userId)
          .eq("type", "course")

        if (error) throw error

        // Save to cache
        setCachedData("studentCourseSelections", userId, data)

        // Update state
        setSelections(data)
      } catch (error: any) {
        console.error("Error fetching student course selections:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load student course selections",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSelections()
  }, [userId, getCachedData, setCachedData, toast])

  return { selections, isLoading, error }
}

export function useCachedStudentExchangeSelections(userId: string | undefined) {
  const [selections, setSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchSelections = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedSelections = getCachedData<any[]>("studentExchangeSelections", userId)

      if (cachedSelections) {
        console.log("Using cached student exchange selections")
        setSelections(cachedSelections)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching student exchange selections from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("student_elective_selections")
          .select("*, elective_packs(*), exchange_universities(*)")
          .eq("student_id", userId)
          .eq("type", "exchange")

        if (error) throw error

        // Save to cache
        setCachedData("studentExchangeSelections", userId, data)

        // Update state
        setSelections(data)
      } catch (error: any) {
        console.error("Error fetching student exchange selections:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load student exchange selections",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSelections()
  }, [userId, getCachedData, setCachedData, toast])

  return { selections, isLoading, error }
}
