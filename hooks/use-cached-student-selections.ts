"use client"

import { useState, useEffect, useCallback } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js" // Standard client for general use
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs" // For client-side auth context

// Existing hooks (useCachedStudentCourseSelections, useCachedStudentExchangeSelections, useCachedAvailableElectives)
// remain here but are not directly modified unless they conflict or are made redundant by the new hook.
// For this task, we are adding a new hook for the student courses list page.

export function useCachedStudentCourseSelections(userId: string | undefined) {
  const [selections, setSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      setSelections([]) // Ensure selections are cleared if no userId
      return
    }

    const fetchSelections = async () => {
      setIsLoading(true)
      setError(null)

      const cacheKey = "studentCourseSelections" // This is a keyof CacheData
      const cachedData = getCachedData<any[]>(cacheKey, userId)

      if (cachedData) {
        console.log("Using cached student course selections for user:", userId)
        setSelections(cachedData)
        setIsLoading(false)
        return
      }

      console.log("Fetching student course selections from API for user:", userId)
      try {
        // Use the standard Supabase client for data fetching
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data, error: fetchError } = await supabase
          .from("course_selections")
          .select(`
            *,
            elective_courses: elective_courses_id(*)
          `)
          .eq("student_id", userId)

        if (fetchError) throw fetchError

        console.log("Fetched course selections data for user:", userId, data)
        setCachedData(cacheKey, userId, data || [])
        setSelections(data || [])
      } catch (err: any) {
        console.error("Error fetching student course selections for user:", userId, err)
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load your course selections.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSelections()
  }, [userId, getCachedData, setCachedData, toast])

  return { selections, isLoading, error }
}

export function useCachedStudentExchangeSelections(userId: string | undefined) {
  const [selections, setSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      setSelections([])
      return
    }

    const fetchSelections = async () => {
      setIsLoading(true)
      setError(null)
      const cacheKey = "studentExchangeSelections"
      const cachedData = getCachedData<any[]>(cacheKey, userId)

      if (cachedData) {
        console.log("Using cached student exchange selections for user:", userId)
        setSelections(cachedData)
        setIsLoading(false)
        return
      }

      console.log("Fetching student exchange selections from API for user:", userId)
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data, error: fetchError } = await supabase
          .from("exchange_selections")
          .select(`
            *,
            elective_exchange: elective_exchange_id(*)
          `)
          .eq("student_id", userId)

        if (fetchError) throw fetchError

        console.log("Fetched exchange selections data for user:", userId, data)
        setCachedData(cacheKey, userId, data || [])
        setSelections(data || [])
      } catch (err: any) {
        console.error("Error fetching student exchange selections for user:", userId, err)
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load your exchange selections.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSelections()
  }, [userId, getCachedData, setCachedData, toast])

  return { selections, isLoading, error }
}

// This hook might be for admin/manager or a different context.
// For student page, we need elective_courses for *their* institution.
export function useCachedAvailableElectives(institutionId: string | undefined) {
  const [electives, setElectives] = useState<{ courses: any[]; exchanges: any[] }>({ courses: [], exchanges: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      setElectives({ courses: [], exchanges: [] })
      return
    }

    const fetchElectives = async () => {
      setIsLoading(true)
      setError(null)
      // Assuming 'courseElectives' is the correct key for this combined data type
      const cacheKey = "courseElectives"
      const cachedData = getCachedData<{ courses: any[]; exchanges: any[] }>(cacheKey, institutionId)

      if (cachedData) {
        console.log("Using cached available electives for institution:", institutionId)
        setElectives(cachedData)
        setIsLoading(false)
        return
      }

      console.log("Fetching available electives from API for institution:", institutionId)
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { data: coursesData, error: coursesError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("institution_id", institutionId)
          .eq("status", "published") // Typically, students only see published ones

        if (coursesError) throw coursesError

        const { data: exchangesData, error: exchangesError } = await supabase
          .from("elective_exchange") // Assuming this table exists and is relevant
          .select("*")
          .eq("institution_id", institutionId)
          .eq("status", "published")

        if (exchangesError) throw exchangesError

        const electivesData = {
          courses: coursesData || [],
          exchanges: exchangesData || [],
        }
        console.log("Fetched available electives data for institution:", institutionId, electivesData)
        setCachedData(cacheKey, institutionId, electivesData)
        setElectives(electivesData)
      } catch (err: any) {
        console.error("Error fetching available electives for institution:", institutionId, err)
        setError(err.message)
        toast({
          title: "Error",
          description: "Failed to load available electives.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElectives()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { electives, isLoading, error }
}

// New hook for the student courses list page (/student/courses)
export function useCachedStudentElectiveCoursesPageData(
  studentId: string | undefined,
  institutionId: string | undefined,
) {
  const [electiveCourses, setElectiveCourses] = useState<any[]>([])
  const [courseSelections, setCourseSelections] = useState<any[]>([]) // Student's selections
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient() // Can be used if auth-dependent, or use standard client

  const fetchData = useCallback(async () => {
    if (!studentId || !institutionId) {
      setIsLoading(false)
      setElectiveCourses([])
      setCourseSelections([])
      return
    }

    setIsLoading(true)
    setError(null)

    const electiveCoursesCacheKey = "institutionElectiveCourses"
    const studentSelectionsCacheKey = "studentCourseSelections"

    const cachedElectiveCourses = getCachedData<any[]>(electiveCoursesCacheKey, institutionId)
    const cachedStudentSelections = getCachedData<any[]>(studentSelectionsCacheKey, studentId)

    let allDataFetched = true

    if (cachedElectiveCourses) {
      console.log("Using cached elective_courses for institution:", institutionId)
      setElectiveCourses(cachedElectiveCourses)
    } else {
      allDataFetched = false
      console.log("Fetching elective_courses from API for institution:", institutionId)
      try {
        const { data, error: fetchError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("institution_id", institutionId)
          // Add order or filter by status if needed, e.g., only 'published' or 'closed'
          // .in('status', ['published', 'closed'])
          .order("deadline", { ascending: false })

        if (fetchError) throw fetchError
        console.log("Fetched elective_courses data for institution:", institutionId, data)
        setCachedData(electiveCoursesCacheKey, institutionId, data || [])
        setElectiveCourses(data || [])
      } catch (err: any) {
        console.error("Error fetching elective_courses for institution:", institutionId, err)
        setError((prev) => (prev ? `${prev}\nFailed to load elective courses.` : "Failed to load elective courses."))
        toast({ title: "Error", description: "Failed to load elective courses.", variant: "destructive" })
        allDataFetched = false // Mark as not all data fetched
      }
    }

    if (cachedStudentSelections) {
      console.log("Using cached course_selections for student:", studentId)
      setCourseSelections(cachedStudentSelections)
    } else {
      allDataFetched = false // If either is fetched from API, not all data was from cache initially
      console.log("Fetching course_selections from API for student:", studentId)
      try {
        const { data, error: fetchError } = await supabase
          .from("course_selections")
          .select("*")
          .eq("student_id", studentId)

        if (fetchError) throw fetchError
        console.log("Fetched course_selections data for student:", studentId, data)
        setCachedData(studentSelectionsCacheKey, studentId, data || [])
        setCourseSelections(data || [])
      } catch (err: any) {
        console.error("Error fetching course_selections for student:", studentId, err)
        setError((prev) => (prev ? `${prev}\nFailed to load your selections.` : "Failed to load your selections."))
        toast({ title: "Error", description: "Failed to load your selections.", variant: "destructive" })
        allDataFetched = false // Mark as not all data fetched
      }
    }

    setIsLoading(false)
  }, [studentId, institutionId, getCachedData, setCachedData, supabase, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData]) // Dependencies: studentId, institutionId (via fetchData's closure)

  const refreshData = useCallback(() => {
    if (studentId && institutionId) {
      invalidateCache("institutionElectiveCourses", institutionId)
      invalidateCache("studentCourseSelections", studentId)
      fetchData()
    }
  }, [studentId, institutionId, invalidateCache, fetchData])

  return { electiveCourses, courseSelections, isLoading, error, refreshData }
}

// Add this new hook after the existing hooks

// New hook for fetching elective course details with courses array
export function useCachedElectiveCourseDetails(electiveCourseId: string | undefined, studentId: string | undefined) {
  const [electiveCourse, setElectiveCourse] = useState<any>(null)
  const [studentSelection, setStudentSelection] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const fetchData = useCallback(async () => {
    if (!electiveCourseId || !studentId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Fetch elective course details
      const cacheKey = `elective_course_${electiveCourseId}`
      const cachedCourse = getCachedData<any>("courseElectives", cacheKey)

      if (cachedCourse) {
        console.log("Using cached elective course details:", electiveCourseId)
        setElectiveCourse(cachedCourse)
      } else {
        console.log("Fetching elective course details from API:", electiveCourseId)
        const { data: courseData, error: courseError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("id", electiveCourseId)
          .single()

        if (courseError) throw courseError

        setCachedData("courseElectives", cacheKey, courseData)
        setElectiveCourse(courseData)
      }

      // Fetch student's selection for this elective course
      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("student_id", studentId)
        .eq("elective_courses_id", electiveCourseId)
        .maybeSingle()

      if (selectionError && selectionError.code !== "PGRST116") throw selectionError

      setStudentSelection(selectionData)
    } catch (err: any) {
      console.error("Error fetching elective course details:", err)
      setError(err.message)
      toast({
        title: "Error",
        description: "Failed to load elective course details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [electiveCourseId, studentId, getCachedData, setCachedData, supabase, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshData = useCallback(() => {
    if (electiveCourseId && studentId) {
      const cacheKey = `elective_course_${electiveCourseId}`
      // Note: We're using a custom cache key, so we can't directly invalidate it
      // Instead, we'll just refetch
      fetchData()
    }
  }, [electiveCourseId, studentId, fetchData])

  return { electiveCourse, studentSelection, isLoading, error, refreshData }
}
