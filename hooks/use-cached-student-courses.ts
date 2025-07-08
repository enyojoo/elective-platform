"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface StudentCoursesData {
  electiveCourses: any[]
  courseSelections: any[]
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

    if (!profile?.id || !profile?.institution_id || !profile.group?.id) {
      setError(
        "Student profile information (including group assignment) is incomplete. Cannot fetch group-specific electives.",
      )
      setIsLoading(false)
      setData({ electiveCourses: [], courseSelections: [] })
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch elective courses for the institution and group
      const { data: coursesData, error: coursesError } = await supabaseClient
        .from("elective_courses")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .eq("group_id", profile.group.id)
        .order("deadline", { ascending: false })

      if (coursesError) throw coursesError

      // Fetch student's course selections
      const { data: selectionsData, error: selectionsError } = await supabaseClient
        .from("course_selections")
        .select("*")
        .eq("student_id", profile.id)

      if (selectionsError) throw selectionsError

      setData({
        electiveCourses: coursesData || [],
        courseSelections: selectionsData || [],
      })
    } catch (err: any) {
      setError(err.message || "Failed to load elective courses data.")
      setData({ electiveCourses: [], courseSelections: [] })
    } finally {
      setIsLoading(false)
    }
  }, [profile, profileLoading, profileError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
