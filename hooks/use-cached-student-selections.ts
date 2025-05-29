"use client"

import { useState, useEffect, useCallback } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

export function useCachedStudentCourseSelections(userId: string | undefined) {
  const [selections, setSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      setSelections([])
      return
    }

    const fetchSelections = async () => {
      setIsLoading(true)
      setError(null)
      const cacheKey = `studentCourseSelections-${userId}`
      const cachedSelections = getCachedData<any[]>(cacheKey)

      if (cachedSelections) {
        setSelections(cachedSelections)
        setIsLoading(false)
        return
      }

      try {
        const { data, error: dbError } = await supabase
          .from("course_selections")
          .select(`
            *,
            elective_course:elective_courses(*)
          `)
          .eq("student_id", userId)

        if (dbError) throw dbError

        setCachedData(cacheKey, data || [])
        setSelections(data || [])
      } catch (err: any) {
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load student course selections",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSelections()
  }, [userId, getCachedData, setCachedData, toast, supabase])

  return { selections, isLoading, error }
}

export function useCachedStudentExchangeSelections(userId: string | undefined) {
  const [selections, setSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      setSelections([])
      return
    }

    const fetchSelections = async () => {
      setIsLoading(true)
      setError(null)
      const cacheKey = `studentExchangeSelections-${userId}`
      const cachedSelections = getCachedData<any[]>(cacheKey)

      if (cachedSelections) {
        setSelections(cachedSelections)
        setIsLoading(false)
        return
      }

      try {
        const { data, error: dbError } = await supabase
          .from("exchange_selections")
          .select(`
            *,
            elective_exchange:elective_exchange!exchange_selections_elective_exchange_id_fkey(*)
          `)
          .eq("student_id", userId)

        if (dbError) throw dbError

        setCachedData(cacheKey, data || [])
        setSelections(data || [])
      } catch (err: any) {
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load student exchange selections",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSelections()
  }, [userId, getCachedData, setCachedData, toast, supabase])

  return { selections, isLoading, error }
}

export function useCachedAvailableElectives(institutionId: string | undefined) {
  const [electives, setElectives] = useState<{ courses: any[]; exchanges: any[] }>({ courses: [], exchanges: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      setElectives({ courses: [], exchanges: [] })
      return
    }

    const fetchElectives = async () => {
      setIsLoading(true)
      setError(null)
      const cacheKey = `availableElectives-${institutionId}`
      const cachedElectives = getCachedData<{ courses: any[]; exchanges: any[] }>(cacheKey)

      if (cachedElectives) {
        setElectives(cachedElectives)
        setIsLoading(false)
        return
      }

      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("institution_id", institutionId)
          .eq("status", "published")
        if (coursesError) throw coursesError

        const { data: exchangesData, error: exchangesError } = await supabase
          .from("elective_exchange")
          .select("*")
          .eq("institution_id", institutionId)
          .eq("status", "published")
        if (exchangesError) throw exchangesError

        const electivesData = {
          courses: coursesData || [],
          exchanges: exchangesData || [],
        }
        setCachedData(cacheKey, electivesData)
        setElectives(electivesData)
      } catch (err: any) {
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load available electives",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchElectives()
  }, [institutionId, getCachedData, setCachedData, toast, supabase])

  return { electives, isLoading, error }
}

// Assumed structure for elective_courses.courses items
interface CourseItem {
  id: string
  name: string
  description: string
  teacher: string
  max_students: number
  current_students: number
}

// From Supabase schema (elective_courses table)
export interface ElectiveCourseData {
  id: string // packId
  name: string
  name_ru: string | null
  status: string // e.g., 'draft', 'published'
  deadline: string // ISO date string
  max_selections: number
  syllabus_template_url: string | null
  courses: CourseItem[] // JSONB array of course objects
  institution_id: string
  created_at: string
  updated_at: string
}

// From Supabase schema (course_selections table)
export interface CourseSelectionData {
  id: string
  student_id: string
  elective_courses_id: string // packId
  selected_course_ids: string[] | null // JSONB array of selected course IDs
  status: string // e.g., 'pending', 'approved', 'rejected'
  statement_url: string | null
  created_at: string
  updated_at: string
}

interface SingleElectiveCourseSelectionResult {
  electiveCourse: ElectiveCourseData | null
  selection: CourseSelectionData | null
}

export function useCachedSingleElectiveCourseSelection(packId: string | undefined, studentId: string | undefined) {
  const [data, setData] = useState<SingleElectiveCourseSelectionResult>({ electiveCourse: null, selection: null })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  const fetchDataInternal = useCallback(async () => {
    if (!studentId || !packId) {
      setData({ electiveCourse: null, selection: null })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const cacheKeyElectiveCourse = `electiveCourse-${packId}`
    const cacheKeySelection = `studentCourseSelection-${studentId}-${packId}`

    const cachedElectiveCourse = getCachedData<ElectiveCourseData>(cacheKeyElectiveCourse)
    const cachedSelection = getCachedData<CourseSelectionData>(cacheKeySelection)

    // If refetchTrigger is > 0, it means a manual refresh, so ignore cache for this fetch
    if (refetchTrigger === 0 && cachedElectiveCourse && cachedSelection !== undefined) {
      // selection can be null
      setData({ electiveCourse: cachedElectiveCourse, selection: cachedSelection })
      setIsLoading(false)
      return
    }

    try {
      // Fetch elective course
      const { data: electiveCourseData, error: electiveCourseError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .single()

      if (electiveCourseError) throw electiveCourseError

      // Fetch student's selection for this elective course
      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("student_id", studentId)
        .eq("elective_courses_id", packId)
        .maybeSingle()

      if (selectionError && selectionError.code !== "PGRST116") {
        // PGRST116: 0 rows
        throw selectionError
      }

      setCachedData(cacheKeyElectiveCourse, electiveCourseData)
      setCachedData(cacheKeySelection, selectionData || null)
      setData({ electiveCourse: electiveCourseData, selection: selectionData || null })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: "Failed to load elective details.",
        variant: "destructive",
      })
      setData({ electiveCourse: null, selection: null }) // Clear data on error
    } finally {
      setIsLoading(false)
    }
  }, [packId, studentId, getCachedData, setCachedData, supabase, toast, refetchTrigger])

  useEffect(() => {
    fetchDataInternal()
  }, [fetchDataInternal, refetchTrigger]) // Effect runs when packId, studentId, or refetchTrigger changes

  const refreshData = useCallback(() => {
    // Invalidate cache by setting to undefined
    const cacheKeyElectiveCourse = `electiveCourse-${packId}`
    const cacheKeySelection = `studentCourseSelection-${studentId}-${packId}`
    setCachedData(cacheKeyElectiveCourse, undefined)
    setCachedData(cacheKeySelection, undefined)
    setRefetchTrigger((prev) => prev + 1) // Trigger re-fetch
  }, [packId, studentId, setCachedData])

  return { data, isLoading, error, refreshData }
}
