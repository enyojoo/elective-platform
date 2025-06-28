"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface CacheItem<T> {
  data: T
  timestamp: number
}

// A simple in-memory cache structure: { cacheKey: { itemId: CacheItem } }
type CacheShape = Record<string, Record<string, CacheItem<any>>>

interface DataCacheContextType {
  getCachedData: <T>(cacheKey: string, itemId: string) => T | null
  setCachedData: <T>(cacheKey: string, itemId: string, data: T) => void
  invalidateCache: (cacheKey: string, itemId?: string) => void
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
  const [cache, setCache] = useState<CacheShape>({})

  const getCachedData = useCallback(
    <T,>(cacheKey: string, itemId: string): T | null => {
      const cachedItem = cache[cacheKey]?.[itemId]
      if (!cachedItem) {
        return null
      }

      // Cache expires after 15 minutes
      const isExpired = new Date().getTime() - cachedItem.timestamp > 15 * 60 * 1000
      if (isExpired) {
        console.log(`Cache expired for ${cacheKey}:${itemId}`)
        // Invalidate this specific item
        setCache((prevCache) => {
          const newCache = { ...prevCache }
          if (newCache[cacheKey]) {
            delete newCache[cacheKey][itemId]
          }
          return newCache
        })
        return null
      }

      console.log(`Using cached data for ${cacheKey}:${itemId}`)
      return cachedItem.data as T
    },
    [cache],
  )

  const setCachedData = useCallback(<T,>(cacheKey: string, itemId: string, data: T): void => {
    console.log(`Setting cache for ${cacheKey}:${itemId}`)
    setCache((prevCache) => ({
      ...prevCache,
      [cacheKey]: {
        ...prevCache[cacheKey],
        [itemId]: {
          data,
          timestamp: new Date().getTime(),
        },
      },
    }))
  }, [])

  const invalidateCache = useCallback((cacheKey: string, itemId?: string): void => {
    setCache((prevCache) => {
      const newCache = { ...prevCache }
      if (itemId) {
        // Invalidate a specific item in the cache
        if (newCache[cacheKey]) {
          delete newCache[cacheKey][itemId]
          console.log(`Cache invalidated for ${cacheKey}:${itemId}`)
        }
      } else {
        // Invalidate the entire cache key
        delete newCache[cacheKey]
        console.log(`Cache invalidated for key: ${cacheKey}`)
      }
      return newCache
    })
  }, [])

  return (
    <DataCacheContext.Provider value={{ getCachedData, setCachedData, invalidateCache }}>
      {children}
    </DataCacheContext.Provider>
  )
}
