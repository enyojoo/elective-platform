"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type CacheData = {
  // Admin caches
  users?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  institutionSettings?: {
    data: any
    timestamp: number
    institutionId: string
  }
  adminProfile?: {
    data: any
    timestamp: number
    userId: string
  }
  programs?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  courses?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  degrees?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  groups?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  courseElectives?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  exchangePrograms?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  institutionElectiveCourses?: {
    // For elective_courses table scoped by institution
    data: any[]
    timestamp: number
    institutionId: string
  }

  // Manager caches
  managerProfile?: {
    data: any
    timestamp: number
    userId: string
  }
  programDetails?: {
    data: any
    timestamp: number
    programId: string
  }
  programStudents?: {
    data: any[]
    timestamp: number
    programId: string
  }

  // Student caches
  studentProfile?: {
    data: any
    timestamp: number
    userId: string
  }
  studentCourseSelections?: {
    data: any[]
    timestamp: number
    userId: string
  }
  studentExchangeSelections?: {
    data: any[]
    timestamp: number
    userId: string
  }

  // Super admin caches
  institutions?: {
    data: any[]
    timestamp: number
  }
  plans?: {
    data: any[]
    timestamp: number
  }
  superAdminProfile?: {
    data: any
    timestamp: number
    userId: string
  }
}

type DataCacheContextType = {
  getCachedData: <T>(key: keyof CacheData, id: string) => T | null
  setCachedData: <T>(key: keyof CacheData, id: string, data: T) => void
  invalidateCache: (key: keyof CacheData, id?: string) => void
  clearAllCache: () => void
}

const CACHE_EXPIRY = 60 * 60 * 1000 // 60 minutes
const STORAGE_KEY = "electivepro_data_cache"

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined)

export function DataCacheProvider({ children }: { children: ReactNode }) {
  const [cacheData, setCacheData] = useState<CacheData>({})

  // Load cache from localStorage on initial render
  useEffect(() => {
    try {
      const storedCache = localStorage.getItem(STORAGE_KEY)
      if (storedCache) {
        setCacheData(JSON.parse(storedCache))
      }
    } catch (error) {
      console.error("Error loading cache from localStorage:", error)
      // If there's an error, clear the cache
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(cacheData).length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
      } catch (error) {
        console.error("Error saving cache to localStorage:", error)
      }
    }
  }, [cacheData])

  // Get cached data if it exists and is not expired
  const getCachedData = <T,>(key: keyof CacheData, id: string): T | null => {
    const cache = cacheData[key]

    if (!cache) return null

    // Check if cache is expired
    const now = Date.now()
    if (now - cache.timestamp > CACHE_EXPIRY) {
      return null
    }

    // Check if the ID matches based on the cache key type
    if (
      (key === "users" ||
        key === "institutionSettings" ||
        key === "programs" ||
        key === "courses" ||
        key === "degrees" ||
        key === "groups" ||
        key === "courseElectives" ||
        key === "exchangePrograms" ||
        key === "institutionElectiveCourses") &&
      cache.institutionId !== id
    ) {
      return null
    }

    if (
      (key === "adminProfile" || key === "managerProfile" || key === "studentProfile" || key === "superAdminProfile") &&
      cache.userId !== id
    ) {
      return null
    }

    if ((key === "programDetails" || key === "programStudents") && cache.programId !== id) {
      return null
    }

    if ((key === "studentCourseSelections" || key === "studentExchangeSelections") && cache.userId !== id) {
      return null
    }

    // For institutions and plans, no ID check is needed
    if (key === "institutions" || key === "plans") {
      return cache.data as T
    }

    return cache.data as T
  }

  // Set cached data with current timestamp
  const setCachedData = <T,>(key: keyof CacheData, id: string, data: T) => {
    const now = Date.now()

    setCacheData((prev) => {
      const newCache = { ...prev }

      if (
        key === "users" ||
        key === "institutionSettings" ||
        key === "programs" ||
        key === "courses" ||
        key === "degrees" ||
        key === "groups" ||
        key === "courseElectives" ||
        key === "exchangePrograms" ||
        key === "institutionElectiveCourses"
      ) {
        newCache[key] = {
          data,
          timestamp: now,
          institutionId: id,
        }
      } else if (
        key === "adminProfile" ||
        key === "managerProfile" ||
        key === "studentProfile" ||
        key === "superAdminProfile" ||
        key === "studentCourseSelections" ||
        key === "studentExchangeSelections"
      ) {
        newCache[key] = {
          data,
          timestamp: now,
          userId: id,
        }
      } else if (key === "programDetails" || key === "programStudents") {
        newCache[key] = {
          data,
          timestamp: now,
          programId: id,
        }
      } else if (key === "institutions" || key === "plans") {
        newCache[key] = {
          data,
          timestamp: now,
        }
      }

      return newCache
    })
  }

  // Invalidate specific cache
  const invalidateCache = (key: keyof CacheData, id?: string) => {
    setCacheData((prev) => {
      const newCache = { ...prev }

      if (!id) {
        // Invalidate all caches for this key
        delete newCache[key]
        return newCache
      }

      // Invalidate based on ID and key type
      if (
        (key === "users" ||
          key === "institutionSettings" ||
          key === "programs" ||
          key === "courses" ||
          key === "degrees" ||
          key === "groups" ||
          key === "courseElectives" ||
          key === "exchangePrograms" ||
          key === "institutionElectiveCourses") &&
        newCache[key]?.institutionId === id
      ) {
        delete newCache[key]
      } else if (
        (key === "adminProfile" ||
          key === "managerProfile" ||
          key === "studentProfile" ||
          key === "superAdminProfile" ||
          key === "studentCourseSelections" ||
          key === "studentExchangeSelections") &&
        newCache[key]?.userId === id
      ) {
        delete newCache[key]
      } else if ((key === "programDetails" || key === "programStudents") && newCache[key]?.programId === id) {
        delete newCache[key]
      }

      return newCache
    })
  }

  // Clear all cache
  const clearAllCache = () => {
    setCacheData({})
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <DataCacheContext.Provider
      value={{
        getCachedData,
        setCachedData,
        invalidateCache,
        clearAllCache,
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
