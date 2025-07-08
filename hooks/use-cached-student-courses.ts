"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface StudentCoursesData {
  electives: any[]
  selections: any[]
}

export function useCachedStudentCourses() {
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()
  const [data, setData] = useState<StudentCoursesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (profileLoading) return

    if (profileError) {
      setError(`Failed to load profile: ${profileError}`)
      setIsLoading(false)
      return
    }

    if (!profile?.id) {
      setError("Student profile not loaded")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch all elective courses
      const { data: electivesData, error: electivesError } = await supabaseClient
        .from("elective_courses")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (electivesError) throw electivesError

      // Fetch student's course selections
      const { data: selectionsData, error: selectionsError } = await supabaseClient
        .from("course_selections")
        .select("*")
        .eq("student_id", profile.id)

      if (selectionsError) throw selectionsError

      setData({
        electives: electivesData || [],
        selections: selectionsData || [],
      })
    } catch (err: any) {
      setError(err.message || "Failed to load courses data.")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [profile, profileLoading, profileError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
