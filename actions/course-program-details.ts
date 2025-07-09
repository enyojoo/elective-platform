"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getCourseProgram(id: string) {
  try {
    console.log("Fetching course program with ID:", id)
    const { data, error } = await supabase.from("elective_courses").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching course program:", error)
      return null
    }

    console.log("Course program data:", data)
    return data
  } catch (error) {
    console.error("Error in getCourseProgram:", error)
    return null
  }
}

export async function getCoursesFromIds(courseIds: string[]) {
  if (!courseIds || courseIds.length === 0) {
    console.log("No course IDs provided")
    return []
  }

  try {
    console.log("Fetching courses with IDs:", courseIds)
    const { data: courses, error } = await supabase
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
        status,
        instructor,
        degree
      `)
      .in("id", courseIds)
      .order("name")

    if (error) {
      console.error("Error fetching courses:", error)
      return []
    }

    console.log("Fetched courses:", courses)
    return courses || []
  } catch (error) {
    console.error("Error in getCoursesFromIds:", error)
    return []
  }
}

export async function getCourseSelections(electiveCourseId: string) {
  try {
    console.log("Fetching course selections for elective_courses_id:", electiveCourseId)

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
      return []
    }

    console.log("Course selections fetched:", selections?.length || 0)
    if (selections && selections.length > 0) {
      console.log("Sample selection:", selections[0])
    }

    return selections || []
  } catch (error) {
    console.error("Error in getCourseSelections:", error)
    return []
  }
}

export async function getCourseSelectionData(courseId: string, electiveCourseId: string) {
  try {
    console.log("Fetching course selection data for course:", courseId, "in program:", electiveCourseId)

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

    if (selectionsError) {
      console.error("Error fetching selections:", selectionsError)
      return []
    }

    // Filter selections that include this course
    const filteredSelections = (selections || []).filter(
      (selection) =>
        selection.selected_ids && Array.isArray(selection.selected_ids) && selection.selected_ids.includes(courseId),
    )

    console.log("Filtered selections for course:", filteredSelections.length)
    return filteredSelections
  } catch (error) {
    console.error("Error in getCourseSelectionData:", error)
    return []
  }
}

export async function updateCourseSelectionStatus(selectionId: string, status: "approved" | "rejected") {
  try {
    console.log("Updating course selection status:", selectionId, "to", status)

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

    console.log("Course selection status updated:", data)
    revalidatePath("/manager/electives/course")
    return data
  } catch (error) {
    console.error("Error in updateCourseSelectionStatus:", error)
    throw new Error("Failed to update course selection status")
  }
}

export async function updateStudentCourseSelection(
  selectionId: string,
  selectedCourseIds: string[],
  status: "approved" | "rejected" | "pending",
) {
  try {
    console.log("Updating student course selection:", selectionId, "courses:", selectedCourseIds, "status:", status)

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

    console.log("Student course selection updated:", data)
    revalidatePath("/manager/electives/course")
    return data
  } catch (error) {
    console.error("Error in updateStudentCourseSelection:", error)
    throw new Error("Failed to update student course selection")
  }
}
