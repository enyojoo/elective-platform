"use client"

import { useState, useEffect, useCallback } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

// Hook for the student courses list page (/student/courses)
export function useCachedStudentElectiveCoursesPageData(
  studentId: string | undefined,
  institutionId: string | undefined,
) {
  const [electiveCourses, setElectiveCourses] = useState<any[]>([]) // from elective_courses table
  const [courseSelections, setCourseSelections] = useState<any[]>([]) // from course_selections table
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const fetchData = useCallback(async () => {
    if (!studentId || !institutionId) {
      setElectiveCourses([])
      setCourseSelections([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const electiveCoursesCacheKey = "institutionElectiveCourses"
    const studentSelectionsCacheKey = "studentCourseSelections"

    // Fetch elective_courses for the institution
    let fetchedElectiveCourses = getCachedData<any[]>(electiveCoursesCacheKey, institutionId)
    if (!fetchedElectiveCourses) {
      console.log("Fetching elective_courses from API for institution:", institutionId)
      try {
        const { data, error: fetchError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("institution_id", institutionId)
          .order("deadline", { ascending: false }) // Example ordering

        if (fetchError) throw fetchError
        fetchedElectiveCourses = data || []
        setCachedData(electiveCoursesCacheKey, institutionId, fetchedElectiveCourses)
      } catch (err: any) {
        console.error("Error fetching elective_courses for institution:", institutionId, err)
        setError((prev) => (prev ? `${prev}\nFailed to load elective courses.` : "Failed to load elective courses."))
        toast({ title: "Error", description: "Failed to load elective courses.", variant: "destructive" })
      }
    } else {
      console.log("Using cached elective_courses for institution:", institutionId)
    }
    setElectiveCourses(fetchedElectiveCourses || [])

    // Fetch course_selections for the student
    let fetchedCourseSelections = getCachedData<any[]>(studentSelectionsCacheKey, studentId)
    if (!fetchedCourseSelections) {
      console.log("Fetching course_selections from API for student:", studentId)
      try {
        const { data, error: fetchError } = await supabase
          .from("course_selections")
          .select("*")
          .eq("student_id", studentId)

        if (fetchError) throw fetchError
        fetchedCourseSelections = data || []
        setCachedData(studentSelectionsCacheKey, studentId, fetchedCourseSelections)
      } catch (err: any) {
        console.error("Error fetching course_selections for student:", studentId, err)
        setError((prev) => (prev ? `${prev}\nFailed to load your selections.` : "Failed to load your selections."))
        toast({ title: "Error", description: "Failed to load your selections.", variant: "destructive" })
      }
    } else {
      console.log("Using cached course_selections for student:", studentId)
    }
    setCourseSelections(fetchedCourseSelections || [])

    setIsLoading(false)
  }, [studentId, institutionId, getCachedData, setCachedData, supabase, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshData = useCallback(() => {
    if (studentId && institutionId) {
      invalidateCache("institutionElectiveCourses", institutionId)
      invalidateCache("studentCourseSelections", studentId)
      fetchData()
    }
  }, [studentId, institutionId, invalidateCache, fetchData])

  return { electiveCourses, courseSelections, isLoading, error, refreshData }
}

// Hook for the elective course detail page (/student/courses/[electiveCourseId])
export function useCachedElectiveCourseDetails(electiveCourseId: string | undefined, studentId: string | undefined) {
  const [electiveCourse, setElectiveCourse] = useState<any>(null) // Single record from elective_courses
  const [studentSelection, setStudentSelection] = useState<any>(null) // Single record from course_selections or null
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const fetchData = useCallback(async () => {
    if (!electiveCourseId || !studentId) {
      setElectiveCourse(null)
      setStudentSelection(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)

    const electiveCourseCacheKey = "electiveCourseDetail"
    const studentSelectionCacheKey = "studentSpecificCourseSelection"
    const studentSelectionCompositeId = `${studentId}_${electiveCourseId}`

    // Fetch elective_courses record
    let fetchedElectiveCourse = getCachedData<any>(electiveCourseCacheKey, electiveCourseId)
    if (!fetchedElectiveCourse) {
      console.log("Fetching elective_course detail from API:", electiveCourseId)
      try {
        const { data, error: fetchError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("id", electiveCourseId)
          .single()
        if (fetchError) throw fetchError
        fetchedElectiveCourse = data
        setCachedData(electiveCourseCacheKey, electiveCourseId, fetchedElectiveCourse)
      } catch (err: any) {
        console.error("Error fetching elective_course detail:", electiveCourseId, err)
        setError((prev) => (prev ? `${prev}\nFailed to load course details.` : "Failed to load course details."))
        toast({ title: "Error", description: "Failed to load course details.", variant: "destructive" })
      }
    } else {
      console.log("Using cached elective_course detail:", electiveCourseId)
    }
    setElectiveCourse(fetchedElectiveCourse)

    // Fetch student's course_selections record for this specific elective_course
    let fetchedStudentSelection = getCachedData<any>(studentSelectionCacheKey, studentSelectionCompositeId)
    if (fetchedStudentSelection === undefined) {
      // Check for undefined to distinguish from null (no selection)
      console.log("Fetching student_specific_course_selection from API for:", studentSelectionCompositeId)
      try {
        const { data, error: fetchError } = await supabase
          .from("course_selections")
          .select("*")
          .eq("student_id", studentId)
          .eq("elective_courses_id", electiveCourseId)
          .maybeSingle() // Returns one row or null, doesn't error if not found

        if (fetchError && fetchError.code !== "PGRST116") {
          // PGRST116: "Searched for one row, but found 0" - not an error for maybeSingle
          throw fetchError
        }
        fetchedStudentSelection = data // data will be null if no selection, which is correct
        setCachedData(studentSelectionCacheKey, studentSelectionCompositeId, fetchedStudentSelection)
      } catch (err: any) {
        console.error("Error fetching student_specific_course_selection for:", studentSelectionCompositeId, err)
        setError((prev) =>
          prev ? `${prev}\nFailed to load your selection status.` : "Failed to load your selection status.",
        )
        toast({ title: "Error", description: "Failed to load your selection status.", variant: "destructive" })
      }
    } else {
      console.log("Using cached student_specific_course_selection for:", studentSelectionCompositeId)
    }
    setStudentSelection(fetchedStudentSelection)

    setIsLoading(false)
  }, [electiveCourseId, studentId, getCachedData, setCachedData, supabase, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refreshData = useCallback(() => {
    if (electiveCourseId && studentId) {
      invalidateCache("electiveCourseDetail", electiveCourseId)
      invalidateCache("studentSpecificCourseSelection", `${studentId}_${electiveCourseId}`)
      fetchData()
    }
  }, [electiveCourseId, studentId, invalidateCache, fetchData])

  const updateStudentSelection = useCallback(
    async (newSelectionData: Partial<any>) => {
      if (!studentId || !electiveCourseId || !electiveCourse) {
        toast({ title: "Error", description: "Missing required data to update selection.", variant: "destructive" })
        return null
      }

      setIsLoading(true)
      try {
        let result
        const existingSelectionId = studentSelection?.id

        const payload = {
          student_id: studentId,
          elective_courses_id: electiveCourseId,
          institution_id: electiveCourse.institution_id,
          ...newSelectionData,
        }

        if (existingSelectionId) {
          // Update existing selection
          const { data, error } = await supabase
            .from("course_selections")
            .update(payload)
            .eq("id", existingSelectionId)
            .select()
            .single()
          if (error) throw error
          result = data
        } else {
          // Create new selection
          const { data, error } = await supabase.from("course_selections").insert(payload).select().single()
          if (error) throw error
          result = data
        }

        setStudentSelection(result)
        // Invalidate student's general selections list cache as well
        invalidateCache("studentCourseSelections", studentId)
        invalidateCache("studentSpecificCourseSelection", `${studentId}_${electiveCourseId}`)
        setCachedData("studentSpecificCourseSelection", `${studentId}_${electiveCourseId}`, result)

        toast({ title: "Success", description: "Selection updated successfully." })
        return result
      } catch (err: any) {
        console.error("Error updating student selection:", err)
        toast({ title: "Error", description: err.message || "Failed to update selection.", variant: "destructive" })
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [studentId, electiveCourseId, studentSelection, electiveCourse, supabase, toast, invalidateCache, setCachedData],
  )

  return { electiveCourse, studentSelection, isLoading, error, refreshData, updateStudentSelection }
}

// Keep other existing hooks like useCachedStudentProfile, useCachedAvailableElectives etc.
// Ensure they don't conflict with the new table structure if they also touch related data.
// For example, useCachedAvailableElectives might need adjustment if its definition of "available electives"
// was based on the old elective_packs structure.

export function useCachedStudentProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)
      const cachedProfile = getCachedData<any>("studentProfile", userId)
      if (cachedProfile) {
        setProfile(cachedProfile)
        setIsLoading(false)
        return
      }
      try {
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*") // Adjust columns as needed
          .eq("id", userId)
          .single()
        if (fetchError) throw fetchError
        setProfile(data)
        setCachedData("studentProfile", userId, data)
      } catch (err: any) {
        setError(err.message)
        toast({ title: "Error", description: "Failed to load profile.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [userId, getCachedData, setCachedData, supabase, toast])
  return { profile, isLoading, error }
}
