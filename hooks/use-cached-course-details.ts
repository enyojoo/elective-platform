"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CourseDetailsData {
  elective: any | null
  courses: any[]
  selection: any | null
}

export function useCachedCourseDetails(packId: string) {
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()
  const [data, setData] = useState<CourseDetailsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (profileLoading) return

    if (profileError) {
      setError(`Failed to load profile: ${profileError}`)
      setIsLoading(false)
      return
    }

    if (!profile?.id || !packId) {
      setError("Missing required data")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch elective course details
      const { data: electiveData, error: electiveError } = await supabaseClient
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .single()

      if (electiveError) throw electiveError

      // Fetch courses for this elective
      const { data: coursesData, error: coursesError } = await supabaseClient
        .from("courses")
        .select("*")
        .contains("elective_course_ids", [packId])

      if (coursesError) throw coursesError

      // Fetch student's selection for this elective
      const { data: selectionData, error: selectionError } = await supabaseClient
        .from("course_selections")
        .select("*")
        .eq("student_id", profile.id)
        .eq("elective_courses_id", packId)
        .maybeSingle()

      if (selectionError) throw selectionError

      setData({
        elective: electiveData,
        courses: coursesData || [],
        selection: selectionData,
      })
    } catch (err: any) {
      setError(err.message || "Failed to load course details.")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [profile, profileLoading, profileError, packId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
