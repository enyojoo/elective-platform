"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getCourseProgram(id: string) {
  try {
    const { data, error } = await supabase.from("elective_course").select("*").eq("id", id).single()

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
    const { data: courses, error } = await supabase.from("courses").select("*").in("id", courseIds).order("name")

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

export async function getCourseSelections(courseProgramId: string) {
  try {
    // First get the selections
    const { data: selections, error: selectionsError } = await supabase
      .from("course_selections")
      .select("*")
      .eq("elective_course_id", courseProgramId)
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
            .select("id, full_name, email, group_id, degree_id, academic_year")
            .eq("id", selection.student_id)
            .single()

          if (profileError) {
            console.error("Error fetching profile for student:", selection.student_id, profileError)
            return {
              ...selection,
              profiles: null,
            }
          }

          // Get group and degree information
          let groupName = ""
          let degreeName = ""

          if (profile.group_id) {
            const { data: group } = await supabase.from("groups").select("name").eq("id", profile.group_id).single()
            groupName = group?.name || ""
          }

          if (profile.degree_id) {
            const { data: degree } = await supabase.from("degrees").select("name").eq("id", profile.degree_id).single()
            degreeName = degree?.name || ""
          }

          return {
            ...selection,
            profiles: {
              ...profile,
              group_name: groupName,
              degree_name: degreeName,
            },
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

export async function getCourseSelectionData(courseId: string, courseProgramId: string) {
  try {
    // Get all selections for this course program
    const { data: selections, error: selectionsError } = await supabase
      .from("course_selections")
      .select("*")
      .eq("elective_course_id", courseProgramId)

    if (selectionsError) {
      console.error("Error fetching selections:", selectionsError)
      return []
    }

    // Filter selections that include this course
    const filteredSelections = (selections || []).filter(
      (selection) =>
        selection.selected_course_ids &&
        Array.isArray(selection.selected_course_ids) &&
        selection.selected_course_ids.includes(courseId),
    )

    // Get profile data for filtered selections
    const selectionsWithProfiles = await Promise.all(
      filteredSelections.map(async (selection) => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email, group_id, degree_id, academic_year")
            .eq("id", selection.student_id)
            .single()

          if (profileError) {
            console.error("Error fetching profile:", profileError)
            return {
              ...selection,
              profiles: null,
            }
          }

          // Get group and degree information
          let groupName = ""
          let degreeName = ""

          if (profile.group_id) {
            const { data: group } = await supabase.from("groups").select("name").eq("id", profile.group_id).single()
            groupName = group?.name || ""
          }

          if (profile.degree_id) {
            const { data: degree } = await supabase.from("degrees").select("name").eq("id", profile.degree_id).single()
            degreeName = degree?.name || ""
          }

          return {
            ...selection,
            profiles: {
              ...profile,
              group_name: groupName,
              degree_name: degreeName,
            },
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

export async function downloadCourseStatementFile(statementUrl: string) {
  try {
    // Extract the file path from the full URL if needed
    let filePath = statementUrl
    if (statementUrl.includes("/storage/v1/object/public/statements/")) {
      filePath = statementUrl.split("/storage/v1/object/public/statements/")[1]
    } else if (statementUrl.includes("/statements/")) {
      filePath = statementUrl.split("/statements/")[1]
    }

    const { data, error } = await supabase.storage.from("statements").download(filePath)

    if (error) {
      console.error("Error downloading statement:", error)
      throw new Error("Failed to download statement file")
    }

    return data
  } catch (error) {
    console.error("Error in downloadCourseStatementFile:", error)
    throw new Error("Failed to download statement file")
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
      console.error("Error updating selection status:", error)
      throw new Error("Failed to update selection status")
    }

    revalidatePath("/manager/electives/course")
    return data
  } catch (error) {
    console.error("Error in updateCourseSelectionStatus:", error)
    throw new Error("Failed to update selection status")
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
        selected_course_ids: selectedCourseIds,
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
