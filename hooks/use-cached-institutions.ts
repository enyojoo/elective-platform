"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"

export function useCachedInstitutions() {
  const [institutions, setInstitutions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    const fetchInstitutions = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedInstitutions = getCachedData<any[]>("institutions", "all")

      if (cachedInstitutions) {
        console.log("Using cached institutions data")
        setInstitutions(cachedInstitutions)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching institutions data from API")
      try {
        const response = await fetch("/api/super-admin/institutions")

        if (!response.ok) {
          throw new Error(`Error fetching institutions: ${response.status}`)
        }

        const data = await response.json()

        // Save to cache
        setCachedData("institutions", "all", data)

        // Update state
        setInstitutions(data)
      } catch (error: any) {
        console.error("Error fetching institutions:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load institutions data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchInstitutions()
  }, [getCachedData, setCachedData, toast])

  return { institutions, isLoading, error }
}
