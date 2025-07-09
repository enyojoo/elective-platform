"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getCourseProgram(id: string) {
  try {
    const { data, error } = await supabase.from("elective_courses").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching course program:", error)
      throw new Error("Failed to fetch course program")
    }

    return data
  } catch (error) {
    console.error("Error in getCourseProgram:", error)
    throw error
  }
}

export async function getCoursesFromIds(courseIds: string[]) {
  if (!courseIds || courseIds.length === 0) {
    return []
  }

  try {
    const { data: courses, error } = await supabase.from("courses").select("*").in("id", courseIds).order("name")

    if (error) {
      console.error("Error fetching courses:", error)
      throw new Error("Failed to fetch courses")
    }

    return courses || []
  } catch (error) {
    console.error("Error in getCoursesFromIds:", error)
    throw error
  }
}

export async function getCourseSelections(electiveCourseId: string) {
  try {
    // First get the selections with profile data
    const { data: selections, error: selectionsError } = await supabase
      .from("course_selections")
      .select(`
        *,
        profiles!inner(
          id,
          full_name,
          email,
          student_profiles!inner(
            group_id,
            enrollment_year,
            groups(
              name,
              display_name,
              programs(
                name,
                name_ru,
                degrees(
                  name,
                  name_ru
                )
              )
            )
          )
        )
      `)
      .eq("elective_courses_id", electiveCourseId)
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching course selections:", selectionsError)
      throw new Error("Failed to fetch course selections")
    }

    return selections || []
  } catch (error) {
    console.error("Error in getCourseSelections:", error)
    throw error
  }
}

export async function getCourseSelectionData(courseId: string, electiveCourseId: string) {
  try {
    // Get all selections for this elective course program that include the specific course
    const { data: selections, error: selectionsError } = await supabase
      .from("course_selections")
      .select(`
        *,
        profiles!inner(
          id,
          full_name,
          email,
          student_profiles!inner(
            group_id,
            enrollment_year,
            groups(
              name,
              display_name,
              programs(
                name,
                name_ru
              )
            )
          )
        )
      `)
      .eq("elective_courses_id", electiveCourseId)
      .contains("selected_ids", [courseId])

    if (selectionsError) {
      console.error("Error fetching course selection data:", selectionsError)
      throw new Error("Failed to fetch course selection data")
    }

    return selections || []
  } catch (error) {
    console.error("Error in getCourseSelectionData:", error)
    throw error
  }
}

export async function updateCourseSelectionStatus(selectionId: string, status: "approved" | "rejected") {
  try {
    const { data, error } = await supabase
      .from("course_selections")
      .update({ status })
      .eq("id", selectionId)
      .select()
      .single()

    if (error) {
      console.error("Error updating course selection status:", error)
      throw new Error("Failed to update course selection status")
    }

    revalidatePath("/manager/electives/course")
    return data
  } catch (error) {
    console.error("Error in updateCourseSelectionStatus:", error)
    throw error
  }
}

export async function updateStudentCourseSelection(
  selectionId: string,
  selectedCourseIds: string[],
  status: "approved" | "rejected" | "pending",
) {
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
      console.error("Error updating student course selection:", error)
      throw new Error("Failed to update student course selection")
    }

    revalidatePath("/manager/electives/course")
    return data
  } catch (error) {
    console.error("Error in updateStudentCourseSelection:", error)
    throw error
  }
}
