"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getCourseProgram(id: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log("Fetching course program with ID:", id)

    // Get the elective course program
    const { data: program, error: programError } = await supabase
      .from("elective_courses")
      .select(`
        id,
        name,
        name_ru,
        description,
        description_ru,
        deadline,
        max_selections,
        status,
        courses,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single()

    if (programError) {
      console.error("Error fetching course program:", programError)
      throw new Error(`Failed to fetch course program: ${programError.message}`)
    }

    if (!program) {
      throw new Error("Course program not found")
    }

    console.log("Course program fetched successfully:", program)
    return program
  } catch (error) {
    console.error("Error in getCourseProgram:", error)
    throw error
  }
}

export async function getCourseProgramCourses(courseIds: string[]) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log("Fetching courses with IDs:", courseIds)

    if (!courseIds || courseIds.length === 0) {
      return []
    }

    // Get courses data
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        name_ru,
        code,
        description,
        description_ru,
        credits,
        max_students,
        professor,
        status
      `)
      .in("id", courseIds)
      .eq("status", "active")

    if (coursesError) {
      console.error("Error fetching courses:", coursesError)
      throw new Error(`Failed to fetch courses: ${coursesError.message}`)
    }

    console.log("Courses fetched successfully:", courses)
    return courses || []
  } catch (error) {
    console.error("Error in getCourseProgramCourses:", error)
    throw error
  }
}

export async function getCourseSelections(programId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log("Fetching course selections for program:", programId)

    // Get course selections with student and course details
    const { data: selections, error: selectionsError } = await supabase
      .from("course_selections")
      .select(`
        id,
        student_id,
        selected_courses,
        statement_url,
        status,
        created_at,
        updated_at,
        profiles!course_selections_student_id_fkey (
          id,
          full_name,
          email,
          student_profiles (
            enrollment_year,
            groups (
              name,
              display_name,
              programs (
                name,
                name_ru
              )
            )
          )
        )
      `)
      .eq("elective_course_id", programId)
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching course selections:", selectionsError)
      throw new Error(`Failed to fetch course selections: ${selectionsError.message}`)
    }

    console.log("Course selections fetched successfully:", selections?.length || 0, "selections")
    return selections || []
  } catch (error) {
    console.error("Error in getCourseSelections:", error)
    throw error
  }
}

export async function getCourseEnrollmentCounts(courseIds: string[], programId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    console.log("Fetching enrollment counts for courses:", courseIds)

    if (!courseIds || courseIds.length === 0) {
      return {}
    }

    // Get all selections for this program
    const { data: selections, error } = await supabase
      .from("course_selections")
      .select("selected_courses, status")
      .eq("elective_course_id", programId)
      .in("status", ["pending", "approved"])

    if (error) {
      console.error("Error fetching enrollment counts:", error)
      return {}
    }

    // Count enrollments per course
    const enrollmentCounts: Record<string, number> = {}

    courseIds.forEach((courseId) => {
      enrollmentCounts[courseId] = 0
    })

    selections?.forEach((selection) => {
      if (selection.selected_courses && Array.isArray(selection.selected_courses)) {
        selection.selected_courses.forEach((courseId: string) => {
          if (courseIds.includes(courseId)) {
            enrollmentCounts[courseId] = (enrollmentCounts[courseId] || 0) + 1
          }
        })
      }
    })

    console.log("Enrollment counts calculated:", enrollmentCounts)
    return enrollmentCounts
  } catch (error) {
    console.error("Error in getCourseEnrollmentCounts:", error)
    return {}
  }
}

export async function downloadStatementFile(statementUrl: string) {
  try {
    console.log("Downloading statement file:", statementUrl)

    // In a real implementation, you would handle the file download
    // For now, we'll just return the URL
    return statementUrl
  } catch (error) {
    console.error("Error downloading statement file:", error)
    throw error
  }
}
