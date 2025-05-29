"use server"

import { cookies } from "next/headers"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"

export async function selectElectiveCourse(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const electiveCoursesId = formData.get("electiveCoursesId") as string
  const selectedCourseIds = formData.get("selectedCourseIds") as string

  if (!electiveCoursesId || !selectedCourseIds) {
    return { error: "Elective courses ID and selected course IDs are required" }
  }

  // Parse the selected course IDs
  const courseIds = JSON.parse(selectedCourseIds)

  // Check if user already has a selection for this elective course
  const { data: existingSelection } = await supabase
    .from("course_selections")
    .select("id")
    .eq("student_id", user.id)
    .eq("elective_courses_id", electiveCoursesId)
    .maybeSingle()

  if (existingSelection) {
    return { error: "You have already made a selection for this elective course" }
  }

  // Create new selection
  const { error } = await supabase.from("course_selections").insert({
    student_id: user.id,
    elective_courses_id: electiveCoursesId,
    status: "pending",
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/student/courses/${electiveCoursesId}`)
  return { success: true }
}

export async function uploadStatement(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const electiveCoursesId = formData.get("electiveCoursesId") as string
  const statement = formData.get("statement") as File

  if (!electiveCoursesId || !statement) {
    return { error: "All fields are required" }
  }

  // Upload file to storage
  const fileExt = statement.name.split(".").pop()
  const fileName = `${user.id}_${electiveCoursesId}_${Date.now()}.${fileExt}`
  const filePath = `statements/${fileName}`

  const { error: uploadError } = await supabase.storage.from("statements").upload(filePath, statement)

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get public URL
  const { data: urlData } = await supabase.storage.from("statements").getPublicUrl(filePath)

  // Update selection with statement URL
  const { error: updateError } = await supabase
    .from("course_selections")
    .update({
      statement_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("student_id", user.id)
    .eq("elective_courses_id", electiveCoursesId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/student/courses/${electiveCoursesId}`)
  return { success: true, url: urlData.publicUrl }
}
