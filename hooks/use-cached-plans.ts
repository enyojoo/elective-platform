"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"

export function useCachedPlans() {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedPlans = getCachedData<any[]>("plans", "all")

      if (cachedPlans) {
        console.log("Using cached plans data")
        setPlans(cachedPlans)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching plans data from API")
      try {
        const response = await fetch("/api/super-admin/plans")

        if (!response.ok) {
          throw new Error(`Error fetching plans: ${response.status}`)
        }

        const data = await response.json()

        // Save to cache
        setCachedData("plans", "all", data)

        // Update state
        setPlans(data)
      } catch (error: any) {
        console.error("Error fetching plans:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load plans data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlans()
  }, [getCachedData, setCachedData, toast])

  return { plans, isLoading, error }
}
