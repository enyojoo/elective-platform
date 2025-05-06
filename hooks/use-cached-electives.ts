"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedCourseElectives(institutionId: string | undefined) {
  const [electives, setElectives] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchElectives = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedElectives = getCachedData<any[]>("courseElectives", institutionId)

      if (cachedElectives) {
        console.log("Using cached course electives data")
        setElectives(cachedElectives)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching course electives data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("elective_packs")
          .select("*, programs(name, code)")
          .eq("institution_id", institutionId)
          .eq("type", "course")

        if (error) throw error

        // Save to cache
        setCachedData("courseElectives", institutionId, data)

        // Update state
        setElectives(data)
      } catch (error: any) {
        console.error("Error fetching course electives:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load course electives data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElectives()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { electives, isLoading, error }
}

export function useCachedExchangePrograms(institutionId: string | undefined) {
  const [exchangePrograms, setExchangePrograms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchExchangePrograms = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedExchangePrograms = getCachedData<any[]>("exchangePrograms", institutionId)

      if (cachedExchangePrograms) {
        console.log("Using cached exchange programs data")
        setExchangePrograms(cachedExchangePrograms)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching exchange programs data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase
          .from("elective_packs")
          .select("*, programs(name, code)")
          .eq("institution_id", institutionId)
          .eq("type", "exchange")

        if (error) throw error

        // Save to cache
        setCachedData("exchangePrograms", institutionId, data)

        // Update state
        setExchangePrograms(data)
      } catch (error: any) {
        console.error("Error fetching exchange programs:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load exchange programs data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchangePrograms()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { exchangePrograms, isLoading, error }
}
