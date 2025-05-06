"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"

// This is a base pattern for creating cached data hooks
export function createCachedDataHook<T>(cacheKey: string, fetchFunction: (id: string) => Promise<T>) {
  return function useCachedData(id: string | undefined) {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { getCachedData, setCachedData, isCached } = useDataCache()
    const { toast } = useToast()
    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
      if (!id) {
        setIsLoading(false)
        setIsInitialized(true)
        return
      }

      const loadData = async () => {
        // Check if data is already cached
        if (isCached(cacheKey, id)) {
          const cachedData = getCachedData<T>(cacheKey, id)
          console.log(`Using cached ${cacheKey} data for ${id}`)
          setData(cachedData)
          setIsLoading(false)
          setIsInitialized(true)
          return
        }

        // If not cached, fetch from API
        setIsLoading(true)
        setError(null)
        console.log(`Fetching ${cacheKey} data for ${id} from API`)

        try {
          const fetchedData = await fetchFunction(id)

          // Save to cache
          setCachedData(cacheKey, id, fetchedData)

          // Update state
          setData(fetchedData)
        } catch (error: any) {
          console.error(`Error fetching ${cacheKey} data:`, error)
          setError(error.message)
          toast({
            title: "Error",
            description: `Failed to load ${cacheKey} data`,
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }

      loadData()
    }, [id, isCached, getCachedData, setCachedData, toast])

    return { data, isLoading, error, isInitialized }
  }
}

// Export a generic useCachedDataBase function that can be used directly
export const useCachedDataBase = createCachedDataHook<any>("generic", async (id) => {
  // This is a placeholder implementation
  // Actual implementations should provide their own fetch function
  throw new Error("useCachedDataBase must be implemented with a specific fetch function")
})
