"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// Initialize Supabase client with service role key for admin-level access
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * Fetches a single elective course program by its ID.
 * @param id - The UUID of the elective_courses record.
 */
export async function getCourseProgram(id: string) {
  console.log(`[Action] Fetching elective course program with ID: ${id}`)
  try {
    const { data, error } = await supabase.from("elective_courses").select("*").eq("id", id).single()

    if (error) {
      console.error(`[Action] Error fetching course program (ID: ${id}):`, error)
      // Return null instead of throwing to allow the client to handle "not found" cases
      return null
    }

    console.log(`[Action] Successfully fetched course program:`, data)
    return data
  } catch (error) {
    console.error(`[Action] Unexpected error in getCourseProgram:`, error)
    return null
  }
}

/**
 * Fetches details for a list of courses from their IDs.
 * @param courseIds - An array of course UUIDs.
 */
export async function getCoursesFromIds(courseIds: string[]) {
  if (!courseIds || courseIds.length === 0) {
    console.log("[Action] getCoursesFromIds called with no IDs.")
    return []
  }
  console.log(`[Action] Fetching details for ${courseIds.length} courses.`)
  try {
    const { data: courses, error } = await supabase
      .from("courses")
      .select(
        `
        id, name, name_ru, code, description, description_ru,
        credits, max_students, status, instructor, degree
      `,
      )
      .in("id", courseIds)
      .order("name")

    if (error) {
      console.error("[Action] Error fetching courses by IDs:", error)
      return []
    }

    console.log(`[Action] Successfully fetched ${courses?.length || 0} courses.`)
    return courses || []
  } catch (error) {
    console.error(`[Action] Unexpected error in getCoursesFromIds:`, error)
    return []
  }
}

/**
 * Fetches all student selections for a specific elective course program.
 * @param electiveCourseId - The UUID of the elective_courses record.
 */
export async function getCourseSelections(electiveCourseId: string) {
  console.log(`[Action] Fetching course selections for elective_courses_id: ${electiveCourseId}`)
  try {
    const { data: selections, error } = await supabase
      .from("course_selections")
      .select(
        `
        *,
        profiles!inner(
          id, full_name, email,
          student_profiles!inner(
            group_id, enrollment_year,
            groups(
              name, display_name,
              programs( name, name_ru, degrees( name, name_ru ) )
            )
          )
        )
      `,
      )
      .eq("elective_courses_id", electiveCourseId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(`[Action] Error fetching course selections (elective_courses_id: ${electiveCourseId}):`, error)
      return []
    }

    console.log(`[Action] Successfully fetched ${selections?.length || 0} course selections.`)
    return selections || []
  } catch (error) {
    console.error(`[Action] Unexpected error in getCourseSelections:`, error)
    return []
  }
}

/**
 * Fetches student selections that include a specific course within a program.
 * @param courseId - The UUID of the course.
 * @param electiveCourseId - The UUID of the elective_courses program.
 */
export async function getCourseSelectionData(courseId: string, electiveCourseId: string) {
  console.log(`[Action] Fetching selection data for course ${courseId} in program ${electiveCourseId}`)
  try {
    const { data: selections, error } = await supabase
      .from("course_selections")
      .select(
        `
        *,
        profiles!inner(
          id, full_name, email,
          student_profiles!inner(
            group_id, enrollment_year,
            groups( name, display_name, programs( name, name_ru ) )
          )
        )
      `,
      )
      .eq("elective_courses_id", electiveCourseId)
      // Use contains operator to filter selections where selected_ids array contains the courseId
      .contains("selected_ids", [courseId])

    if (error) {
      console.error(`[Action] Error fetching course selection data:`, error)
      return []
    }

    console.log(`[Action] Found ${selections?.length || 0} selections for course ${courseId}.`)
    return selections || []
  } catch (error) {
    console.error(`[Action] Unexpected error in getCourseSelectionData:`, error)
    return []
  }
}

/**
 * Updates the status of a single course selection.
 * @param selectionId - The UUID of the course_selections record.
 * @param status - The new status ('approved' or 'rejected').
 */
export async function updateCourseSelectionStatus(selectionId: string, status: "approved" | "rejected") {
  console.log(`[Action] Updating selection ${selectionId} to status: ${status}`)
  try {
    const { data, error } = await supabase
      .from("course_selections")
      .update({ status })
      .eq("id", selectionId)
      .select()
      .single()

    if (error) {
      console.error(`[Action] Error updating course selection status:`, error)
      throw new Error("Failed to update course selection status")
    }

    console.log(`[Action] Successfully updated selection status.`)
    revalidatePath(`/manager/electives/course/`, "layout")
    return data
  } catch (error) {
    console.error(`[Action] Unexpected error in updateCourseSelectionStatus:`, error)
    throw error
  }
}

/**
 * Updates a student's entire course selection.
 * @param selectionId - The UUID of the course_selections record.
 * @param selectedCourseIds - The new array of selected course UUIDs.
 * @param status - The new status for the selection.
 */
export async function updateStudentCourseSelection(
  selectionId: string,
  selectedCourseIds: string[],
  status: "approved" | "rejected" | "pending",
) {
  console.log(
    `[Action] Updating selection ${selectionId} with ${selectedCourseIds.length} courses and status ${status}`,
  )
  try {
    const { data, error } = await supabase
      .from("course_selections")
      .update({
        selected_ids: selectedCourseIds,
        status,
      })
      .eq("id", selectionId)
      .select()
      .single()

    if (error) {
      console.error(`[Action] Error updating student course selection:`, error)
      throw new Error("Failed to update student course selection")
    }

    console.log(`[Action] Successfully updated student course selection.`)
    revalidatePath(`/manager/electives/course/`, "layout")
    return data
  } catch (error) {
    console.error(`[Action] Unexpected error in updateStudentCourseSelection:`, error)
    throw error
  }
}
