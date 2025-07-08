"use client"

import { useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedDataPattern } from "./use-cached-data-pattern"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface StudentCoursesData {
  electiveCourses: any[]
  courseSelections: any[]
}

export function useCachedStudentCourses() {
  const { profile } = useCachedStudentProfile()

  const fetchStudentCourses = useCallback(async (): Promise<StudentCoursesData> => {
    if (!profile?.id || !profile?.institution_id || !profile.group?.id) {
      throw new Error("Student profile information is incomplete")
    }

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

    return {
      electiveCourses: coursesData || [],
      courseSelections: selectionsData || [],
    }
  }, [profile?.id, profile?.institution_id, profile?.group?.id])

  return useCachedDataPattern<StudentCoursesData>(
    "student-courses",
    fetchStudentCourses,
    !!profile?.id && !!profile?.institution_id && !!profile?.group?.id,
    5 * 60 * 1000, // 5 minutes cache
  )
}
