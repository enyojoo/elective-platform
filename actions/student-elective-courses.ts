"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { SelectionStatus } from "@/lib/types"

export async function getStudentElectiveCourses(userId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get the student profile to get institution_id
    const { data: studentProfile, error: profileError } = await supabase
      .from("student_profiles")
      .select("institution_id")
      .eq("user_id", userId)
      .single()

    if (profileError) {
      throw profileError
    }

    // Fetch elective courses for this institution
    const { data: electiveCoursesData, error: electiveCoursesError } = await supabase
      .from("elective_courses")
      .select(`
        id, 
        name, 
        semester,
        year,
        max_selections,
        status,
        start_date,
        end_date,
        courses,
        institution_id
      `)
      .eq("institution_id", studentProfile.institution_id)
      .order("year", { ascending: false })
      .order("semester", { ascending: true })

    if (electiveCoursesError) {
      throw electiveCoursesError
    }

    // Get student selections for these elective courses from course_selections table
    const { data: studentSelections, error: selectionsError } = await supabase
      .from("course_selections")
      .select("elective_course_id, status, course_id")
      .eq("student_id", userId)

    if (selectionsError) {
      throw selectionsError
    }

    // Process and format the data
    const formattedData = electiveCoursesData.map((course) => {
      // Find selections for this course
      const courseSelections =
        studentSelections?.filter((selection) => selection.elective_course_id === course.id) || []

      // Calculate if the course has available spaces
      const hasAvailableSpaces = course.status === "published"

      return {
        id: course.id,
        name: `${course.semester.charAt(0).toUpperCase() + course.semester.slice(1)} ${course.year}`,
        semester: course.semester,
        year: course.year,
        max_selections: course.max_selections,
        status: course.status,
        start_date: course.start_date,
        end_date: course.end_date,
        course_count: Array.isArray(course.courses) ? course.courses.length : 0,
        available_spaces: hasAvailableSpaces,
        selected: courseSelections.length > 0,
        selection_status: courseSelections.length > 0 ? (courseSelections[0].status as SelectionStatus) : null,
        selected_count: courseSelections.length,
      }
    })

    return { data: formattedData, error: null }
  } catch (error) {
    console.error("Error in getStudentElectiveCourses:", error)
    return { data: null, error: "Failed to fetch elective courses" }
  }
}
