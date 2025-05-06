"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type CacheEntry<T> = {
  data: T
  timestamp: number
}

type CacheStore = {
  [key: string]: {
    [id: string]: CacheEntry<any>
  }
}

type DataCacheContextType = {
  getCachedData: <T>(type: string, id: string) => T | null
  setCachedData: <T>(type: string, id: string, data: T) => void
  invalidateCache: (type: string, id?: string) => void
  clearCache: () => void
  isCached: (type: string, id: string) => boolean
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined)

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<CacheStore>({})

  // Initialize cache from localStorage on mount
  useEffect(() => {
    try {
      const storedCache = localStorage.getItem("dataCache")
      if (storedCache) {
        setCache(JSON.parse(storedCache))
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error)
      // If there's an error, clear the localStorage cache
      localStorage.removeItem("dataCache")
    }
  }, [])

  // Save cache to localStorage when it changes
  useEffect(() => {
    if (Object.keys(cache).length > 0) {
      try {
        localStorage.setItem("dataCache", JSON.stringify(cache))
      } catch (error) {
        console.error("Error saving cache to localStorage:", error)
      }
    }
  }, [cache])

  const isCached = (type: string, id: string): boolean => {
    if (!cache[type] || !cache[type][id]) {
      return false
    }

    const entry = cache[type][id]
    const now = Date.now()

    // Check if the cache entry has expired
    if (now - entry.timestamp > CACHE_EXPIRATION) {
      // Remove expired entry
      const newCache = { ...cache }
      delete newCache[type][id]
      setCache(newCache)
      return false
    }

    return true
  }

  const getCachedData = <T,>(type: string, id: string): T | null => {
    if (!isCached(type, id)) {
      return null
    }

    return cache[type][id].data as T
  }

  const setCachedData = <T,>(type: string, id: string, data: T) => {
    const now = Date.now()
    setCache((prevCache) => ({
      ...prevCache,
      [type]: {
        ...(prevCache[type] || {}),
        [id]: {
          data,
          timestamp: now,
        },
      },
    }))
  }

  const invalidateCache = (type: string, id?: string) => {
    if (!id) {
      // Invalidate all entries of this type
      setCache((prevCache) => {
        const newCache = { ...prevCache }
        delete newCache[type]
        return newCache
      })
      return
    }

    if (cache[type] && cache[type][id]) {
      setCache((prevCache) => {
        const newCache = { ...prevCache }
        delete newCache[type][id]
        return newCache
      })
    }
  }

  const clearCache = () => {
    setCache({})
    localStorage.removeItem("dataCache")
  }

  return (
    <DataCacheContext.Provider
      value={{
        getCachedData,
        setCachedData,
        invalidateCache,
        clearCache,
        isCached,
      }}
    >
      {children}
    </DataCacheContext.Provider>
  )
}

export function useDataCache() {
  const context = useContext(DataCacheContext)
  if (context === undefined) {
    throw new Error("useDataCache must be used within a DataCacheProvider")
  }
  return context
}
