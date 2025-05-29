"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export async function uploadStatement(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  const electiveCoursesId = formData.get("electiveCoursesId") as string
  const statementFile = formData.get("statement") as File

  if (!electiveCoursesId || !statementFile) {
    return { error: "Missing electiveCoursesId or statement file" }
  }

  const filePath = `student_statements/${user.id}/${electiveCoursesId}/${statementFile.name}`

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from("statements") // Ensure this bucket exists and has correct policies
    .upload(filePath, statementFile, {
      cacheControl: "3600",
      upsert: true, // Overwrite if exists
    })

  if (uploadError) {
    console.error("Storage upload error:", uploadError)
    return { error: `Storage error: ${uploadError.message}` }
  }

  const { data: publicUrlData } = supabase.storage.from("statements").getPublicUrl(filePath)
  const statementUrl = publicUrlData.publicUrl

  // Upsert into course_selections table
  const { data: selectionData, error: upsertError } = await supabase
    .from("course_selections")
    .upsert(
      {
        student_id: user.id,
        elective_courses_id: electiveCoursesId,
        statement_url: statementUrl,
        // status will be updated when courses are selected, or defaults if new
        // If inserting, selected_course_ids remains null until selection
      },
      {
        onConflict: "student_id, elective_courses_id",
        // ignoreDuplicates: false, // default is false, upsert will update
      },
    )
    .select()
    .single()

  if (upsertError) {
    console.error("Upsert course_selections error:", upsertError)
    return { error: `Database error: ${upsertError.message}` }
  }

  revalidatePath(`/student/courses/${electiveCoursesId}`)
  return { success: true, statementUrl: statementUrl, selection: selectionData }
}

export async function selectElectiveCourse(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "User not authenticated" }
  }

  const electiveCoursesId = formData.get("electiveCoursesId") as string
  const selectedCourseIdsString = formData.get("selectedCourseIds") as string

  if (!electiveCoursesId || !selectedCourseIdsString) {
    return { error: "Missing electiveCoursesId or selectedCourseIds" }
  }

  let selectedCourseIds: string[]
  try {
    selectedCourseIds = JSON.parse(selectedCourseIdsString)
    if (!Array.isArray(selectedCourseIds)) throw new Error("selectedCourseIds is not an array")
  } catch (e) {
    return { error: "Invalid format for selectedCourseIds" }
  }

  // Fetch existing selection to preserve statement_url if it exists
  const { data: existingSelection, error: fetchError } = await supabase
    .from("course_selections")
    .select("statement_url")
    .eq("student_id", user.id)
    .eq("elective_courses_id", electiveCoursesId)
    .maybeSingle()

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116: 0 rows, which is fine
    console.error("Error fetching existing selection:", fetchError)
    return { error: `Database error: ${fetchError.message}` }
  }

  if (!existingSelection?.statement_url) {
    return { error: "Statement must be uploaded before selecting courses." }
  }

  const { data, error } = await supabase
    .from("course_selections")
    .upsert(
      {
        student_id: user.id,
        elective_courses_id: electiveCoursesId,
        selected_course_ids: selectedCourseIds,
        status: "pending", // Set status to pending on submission/update
        statement_url: existingSelection.statement_url, // Preserve existing statement_url
      },
      {
        onConflict: "student_id, elective_courses_id",
        // ignoreDuplicates: false,
      },
    )
    .select()
    .single()

  if (error) {
    console.error("Upsert course_selections error for select:", error)
    return { error: `Database error: ${error.message}` }
  }

  revalidatePath(`/student/courses/${electiveCoursesId}`)
  return { success: true, selection: data }
}
