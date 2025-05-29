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
    // This might refer to general courses, not elective sub-courses
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
    // Used by useCachedElectives, might be a mix or specific structure
    data: any[] // Or specific type if known, e.g. { courses: any[], exchanges: any[] }
    timestamp: number
    institutionId: string // Or a more specific ID like electiveCourseId if it caches single items
  }
  exchangePrograms?: {
    data: any[]
    timestamp: number
    institutionId: string
  }
  institutionElectiveCourses?: {
    // New: For elective_courses table scoped by institution
    data: any[] // Array of elective_courses records
    timestamp: number
    institutionId: string
  }
  electiveCourseDetail?: {
    // New: For a single elective_courses record detail
    data: any // Single elective_courses record
    timestamp: number
    electiveCourseId: string
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
    // For course_selections table scoped by student
    data: any[] // Array of course_selections records
    timestamp: number
    userId: string
  }
  studentSpecificCourseSelection?: {
    // New: For a single course_selections record
    data: any // Single course_selections record or null
    timestamp: number
    studentId_electiveCourseId: string // Composite key e.g. `${studentId}_${electiveCourseId}`
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

  const getCachedData = <T,>(key: keyof CacheData, id: string): T | null => {
    const cacheEntry = cacheData[key] as any // Use 'as any' for easier property access

    if (!cacheEntry) return null

    const now = Date.now()
    if (now - cacheEntry.timestamp > CACHE_EXPIRY) {
      // Consider invalidating here:
      // invalidateCache(key, id); // This would cause a recursive call if not careful
      return null
    }

    // ID matching logic based on key
    if (key === "electiveCourseDetail" && cacheEntry.electiveCourseId !== id) return null
    if (key === "studentSpecificCourseSelection" && cacheEntry.studentId_electiveCourseId !== id) return null

    if (
      (key === "users" ||
        key === "institutionSettings" ||
        key === "programs" ||
        key === "courses" ||
        key === "degrees" ||
        key === "groups" ||
        key === "courseElectives" || // Keep existing logic for this key
        key === "exchangePrograms" ||
        key === "institutionElectiveCourses") && // Added new key
      cacheEntry.institutionId !== id
    ) {
      return null
    }

    if (
      (key === "adminProfile" ||
        key === "managerProfile" ||
        key === "studentProfile" ||
        key === "superAdminProfile" ||
        key === "studentCourseSelections" || // Added new key
        key === "studentExchangeSelections") &&
      cacheEntry.userId !== id
    ) {
      return null
    }

    if ((key === "programDetails" || key === "programStudents") && cacheEntry.programId !== id) {
      return null
    }

    if (key === "institutions" || key === "plans") {
      // These don't use an ID for scoping data itself
      return cacheEntry.data as T
    }

    // Default case for keys that use 'id' directly for their data scope
    // This assumes that if none of the above specific ID fields match, the 'id' param is the primary scope.
    // This part needs to be robust. If a key has a specific ID field (e.g., institutionId), it should be handled above.
    // If a key like 'institutions' or 'plans' is passed with an ID, it might fall through here if not handled.
    // The current logic for 'institutions' and 'plans' correctly returns data without ID check.

    return cacheEntry.data as T
  }

  const setCachedData = <T,>(key: keyof CacheData, id: string, data: T) => {
    const now = Date.now()
    setCacheData((prev) => {
      const newCache = { ...prev } as any

      // Specific handling for new keys
      if (key === "electiveCourseDetail") {
        newCache[key] = { data, timestamp: now, electiveCourseId: id }
      } else if (key === "studentSpecificCourseSelection") {
        newCache[key] = { data, timestamp: now, studentId_electiveCourseId: id }
      } else if (
        key === "users" ||
        key === "institutionSettings" ||
        key === "programs" ||
        key === "courses" ||
        key === "degrees" ||
        key === "groups" ||
        key === "courseElectives" ||
        key === "exchangePrograms" ||
        key === "institutionElectiveCourses" // Added new key
      ) {
        newCache[key] = { data, timestamp: now, institutionId: id }
      } else if (
        key === "adminProfile" ||
        key === "managerProfile" ||
        key === "studentProfile" ||
        key === "superAdminProfile" ||
        key === "studentCourseSelections" || // Added new key
        key === "studentExchangeSelections"
      ) {
        newCache[key] = { data, timestamp: now, userId: id }
      } else if (key === "programDetails" || key === "programStudents") {
        newCache[key] = { data, timestamp: now, programId: id }
      } else if (key === "institutions" || key === "plans") {
        newCache[key] = { data, timestamp: now } // No specific ID like institutionId or userId
      } else {
        // Fallback for other keys, assuming 'id' is the primary scope identifier if not handled above.
        // This might need adjustment based on how other keys are structured.
        // For safety, only set if the key structure is known or explicitly handled.
        console.warn(`Cache key "${key}" set with generic ID logic. Ensure this is intended.`)
        newCache[key] = { data, timestamp: now, id: id } // Generic 'id' field
      }
      return newCache
    })
  }

  const invalidateCache = (key: keyof CacheData, id?: string) => {
    setCacheData((prev) => {
      const newCache = { ...prev } as any

      if (!id) {
        // Invalidate all entries for this key type
        delete newCache[key]
      } else {
        // Invalidate specific entry
        const cacheEntry = newCache[key]
        if (cacheEntry) {
          if (key === "electiveCourseDetail" && cacheEntry.electiveCourseId === id) delete newCache[key]
          else if (key === "studentSpecificCourseSelection" && cacheEntry.studentId_electiveCourseId === id)
            delete newCache[key]
          else if (
            (key === "users" ||
              key === "institutionSettings" ||
              key === "programs" ||
              key === "courses" ||
              key === "degrees" ||
              key === "groups" ||
              key === "courseElectives" ||
              key === "exchangePrograms" ||
              key === "institutionElectiveCourses") &&
            cacheEntry.institutionId === id
          )
            delete newCache[key]
          else if (
            (key === "adminProfile" ||
              key === "managerProfile" ||
              key === "studentProfile" ||
              key === "superAdminProfile" ||
              key === "studentCourseSelections" ||
              key === "studentExchangeSelections") &&
            cacheEntry.userId === id
          )
            delete newCache[key]
          else if ((key === "programDetails" || key === "programStudents") && cacheEntry.programId === id)
            delete newCache[key]
          // Note: 'institutions' and 'plans' are typically invalidated without an ID or by clearing all.
          else if (cacheEntry.id === id) {
            // Generic fallback
            delete newCache[key]
          }
        }
      }
      return newCache
    })
  }

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
