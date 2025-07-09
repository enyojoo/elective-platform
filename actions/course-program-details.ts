"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getCourseProgram(id: string) {
  try {
    const { data, error } = await supabase.from("elective_courses").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching course program:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getCourseProgram:", error)
    return null
  }
}

export async function getCoursesFromIds(courseIds: string[]) {
  if (!courseIds || courseIds.length === 0) {
    return []
  }

  try {
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

    return courses || []
  } catch (error) {
    console.error("Error in getCoursesFromIds:", error)
    return []
  }
}

export async function getCourseSelections(electiveCourseId: string) {
  try {
    // First get the selections
    const { data: selections, error: selectionsError } = await supabase
      .from("course_selections")
      .select("*")
      .eq("elective_courses_id", electiveCourseId)
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching course selections:", selectionsError)
      return []
    }

    // Then get profile data for each selection
    const selectionsWithProfiles = await Promise.all(
      (selections || []).map(async (selection) => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(`
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
            `)
            .eq("id", selection.student_id)
            .single()

          if (profileError) {
            console.error("Error fetching profile for student:", selection.student_id, profileError)
            return {
              ...selection,
              profiles: null,
            }
          }

          return {
            ...selection,
            profiles: profile,
          }
        } catch (error) {
          console.error("Error processing selection profile:", error)
          return {
            ...selection,
            profiles: null,
          }
        }
      }),
    )

    return selectionsWithProfiles
  } catch (error) {
    console.error("Error in getCourseSelections:", error)
    return []
  }
}

export async function getCourseSelectionData(courseId: string, electiveCourseId: string) {
  try {
    // Get all selections for this elective course program
    const { data: selections, error: selectionsError } = await supabase
      .from("course_selections")
      .select("*")
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

    // Get profile data for filtered selections
    const selectionsWithProfiles = await Promise.all(
      filteredSelections.map(async (selection) => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select(`
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
            `)
            .eq("id", selection.student_id)
            .single()

          if (profileError) {
            console.error("Error fetching profile:", profileError)
            return {
              ...selection,
              profiles: null,
            }
          }

          return {
            ...selection,
            profiles: profile,
          }
        } catch (error) {
          console.error("Error processing profile:", error)
          return {
            ...selection,
            profiles: null,
          }
        }
      }),
    )

    return selectionsWithProfiles
  } catch (error) {
    console.error("Error in getCourseSelectionData:", error)
    return []
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
    throw new Error("Failed to update course selection status")
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
    throw new Error("Failed to update student course selection")
  }
}
