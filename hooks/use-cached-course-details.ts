"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CourseDetailsData {
  electiveCourseData: any
  individualCourses: any[]
  existingSelectionRecord: any
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

      // Fetch elective course data
      const { data: ecData, error: ecError } = await supabaseClient
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .single()

      if (ecError) throw ecError
      if (!ecData) throw new Error("Elective course pack not found.")

      let courseUuids: string[] = []
      if (ecData.courses && typeof ecData.courses === "string") {
        try {
          const parsed = JSON.parse(ecData.courses)
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
            courseUuids = parsed
          }
        } catch (e) {
          console.error("Error parsing 'courses' JSON from elective_courses:", e)
        }
      } else if (Array.isArray(ecData.courses) && ecData.courses.every((item: any) => typeof item === "string")) {
        courseUuids = ecData.courses
      }

      let coursesWithCounts: any[] = []
      if (courseUuids.length > 0) {
        const { data: fetchedCourses, error: coursesError } = await supabaseClient
          .from("courses")
          .select("id, name_en, name_ru, instructor_en, instructor_ru, description_en, description_ru, max_students")
          .in("id", courseUuids)

        if (coursesError) throw coursesError

        // Fetch current student counts for each course (pending + approved)
        coursesWithCounts = await Promise.all(
          (fetchedCourses || []).map(async (course) => {
            const { count: currentStudents, error: countError } = await supabaseClient
              .from("course_selections")
              .select("*", { count: "exact", head: true })
              .contains("selected_course_ids", [course.id])
              .in("status", ["pending", "approved"])

            if (countError) {
              console.error("Error fetching course selection count:", countError)
              return { ...course, current_students: 0 }
            }

            return { ...course, current_students: currentStudents || 0 }
          }),
        )

        const fetchedCoursesMap = new Map(coursesWithCounts.map((fc) => [fc.id, fc]))
        coursesWithCounts = courseUuids.map((uuid) => fetchedCoursesMap.get(uuid)).filter(Boolean)
      }

      // Fetch existing selection
      const { data: selectionData, error: selectionError } = await supabaseClient
        .from("course_selections")
        .select("*")
        .eq("student_id", profile.id)
        .eq("elective_courses_id", packId)
        .maybeSingle()

      if (selectionError) throw selectionError

      setData({
        electiveCourseData: ecData,
        individualCourses: coursesWithCounts,
        existingSelectionRecord: selectionData,
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
