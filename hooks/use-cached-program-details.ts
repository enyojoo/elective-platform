"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedProgramDetails(programId: string | undefined) {
  const [program, setProgram] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!programId) {
      setIsLoading(false)
      return
    }

    const fetchProgramDetails = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedProgram = getCachedData<any>("programDetails", programId)

      if (cachedProgram) {
        console.log("Using cached program details")
        setProgram(cachedProgram)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching program details from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data, error } = await supabase.from("programs").select("*, degrees(*)").eq("id", programId).single()

        if (error) throw error

        // Save to cache
        setCachedData("programDetails", programId, data)

        // Update state
        setProgram(data)
      } catch (error: any) {
        console.error("Error fetching program details:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load program details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgramDetails()
  }, [programId, getCachedData, setCachedData, toast])

  return { program, isLoading, error }
}
