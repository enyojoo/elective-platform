"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface DataCacheContextType {
  getCachedData: <T>(cacheKey: string, id: string) => T | null
  setCachedData: <T>(cacheKey: string, id: string, data: T) => void
  clearCache: (cacheKey?: string) => void
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined)

export function useDataCache() {
  const context = useContext(DataCacheContext)
  if (context === undefined) {
    throw new Error("useDataCache must be used within a DataCacheProvider")
  }
  return context
}

interface DataCacheProviderProps {
  children: ReactNode
}

export function DataCacheProvider({ children }: DataCacheProviderProps) {
  // Use a single state object to store all cache data
  const [cacheData, setCacheData] = useState<Record<string, Record<string, any>>>({})

  // Get data from cache
  const getCachedData = useCallback(
    <T,>(cacheKey: string, id: string): T | null => {
      console.log(`Getting cached data for ${cacheKey}:${id}`)
      if (!cacheData[cacheKey] || !cacheData[cacheKey][id]) {
        return null
      }

      // Check if the cached data has expired (30 minutes)
      const cachedItem = cacheData[cacheKey][id]
      const now = new Date().getTime()
      if (cachedItem.timestamp && now - cachedItem.timestamp > 30 * 60 * 1000) {
        console.log(`Cache expired for ${cacheKey}:${id}`)
        return null
      }

      return cachedItem.data as T
    },
    [cacheData],
  )

  // Set data in cache
  const setCachedData = useCallback(<T,>(cacheKey: string, id: string, data: T): void => {
    console.log(`Setting cached data for ${cacheKey}:${id}`)
    setCacheData((prevCache) => {
      const cacheEntry = prevCache[cacheKey] || {}
      return {
        ...prevCache,
        [cacheKey]: {
          ...cacheEntry,
          [id]: {
            data,
            timestamp: new Date().getTime(),
          },
        },
      }
    })
  }, [])

  // Clear cache
  const clearCache = useCallback((cacheKey?: string): void => {
    if (cacheKey) {
      console.log(`Clearing cache for ${cacheKey}`)
      setCacheData((prevCache) => {
        const newCache = { ...prevCache }
        delete newCache[cacheKey]
        return newCache
      })
    } else {
      console.log("Clearing all cache")
      setCacheData({})
    }
  }, [])

  return (
    <DataCacheContext.Provider value={{ getCachedData, setCachedData, clearCache }}>
      {children}
    </DataCacheContext.Provider>
  )
}
