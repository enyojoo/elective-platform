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

  const electiveCourseId = formData.get("electiveCourseId") as string
  const selectedCourses = formData.getAll("selectedCourses") as string[]

  if (!electiveCourseId || selectedCourses.length === 0) {
    return { error: "Elective course ID and selected courses are required" }
  }

  try {
    // Get the elective course details to validate selection
    const { data: electiveCourse, error: courseError } = await supabase
      .from("elective_courses")
      .select("*")
      .eq("id", electiveCourseId)
      .single()

    if (courseError) throw courseError

    // Validate that selected courses are within the allowed courses
    const allowedCourses = electiveCourse.courses || []
    const invalidCourses = selectedCourses.filter((course) => !allowedCourses.includes(course))

    if (invalidCourses.length > 0) {
      return { error: "Invalid course selection" }
    }

    // Check if selection count is within limits
    if (selectedCourses.length > electiveCourse.max_selections) {
      return { error: `You can only select up to ${electiveCourse.max_selections} courses` }
    }

    // Check if user already has a selection for this elective course
    const { data: existingSelection } = await supabase
      .from("course_selections")
      .select("id")
      .eq("student_id", user.id)
      .eq("elective_courses_id", electiveCourseId)
      .maybeSingle()

    if (existingSelection) {
      // Update existing selection
      const { error: updateError } = await supabase
        .from("course_selections")
        .update({
          courses: selectedCourses,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSelection.id)

      if (updateError) throw updateError
    } else {
      // Create new selection
      const { error: insertError } = await supabase.from("course_selections").insert({
        student_id: user.id,
        elective_courses_id: electiveCourseId,
        courses: selectedCourses,
        status: "pending",
      })

      if (insertError) throw insertError
    }

    revalidatePath(`/student/courses/${electiveCourseId}`)
    revalidatePath("/student/courses")
    return { success: true }
  } catch (error: any) {
    console.error("Error selecting elective course:", error)
    return { error: error.message || "Failed to save selection" }
  }
}

export async function uploadStatement(formData: FormData) {
  const supabase = createServerActionClient({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized" }
  }

  const electiveCourseId = formData.get("electiveCourseId") as string
  const statement = formData.get("statement") as File

  if (!electiveCourseId || !statement) {
    return { error: "Elective course ID and statement file are required" }
  }

  try {
    // Check if user has a selection for this elective course
    const { data: selection, error: selectionError } = await supabase
      .from("course_selections")
      .select("id")
      .eq("student_id", user.id)
      .eq("elective_courses_id", electiveCourseId)
      .single()

    if (selectionError) {
      return { error: "You must select courses before uploading a statement" }
    }

    // Upload file to storage
    const fileExt = statement.name.split(".").pop()
    const fileName = `${user.id}_${electiveCourseId}_${Date.now()}.${fileExt}`
    const filePath = `statements/${fileName}`

    const { error: uploadError } = await supabase.storage.from("statements").upload(filePath, statement)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = await supabase.storage.from("statements").getPublicUrl(filePath)

    // Update selection with statement URL
    const { error: updateError } = await supabase
      .from("course_selections")
      .update({
        statement_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selection.id)

    if (updateError) throw updateError

    revalidatePath(`/student/courses/${electiveCourseId}`)
    return { success: true, url: urlData.publicUrl }
  } catch (error: any) {
    console.error("Error uploading statement:", error)
    return { error: error.message || "Failed to upload statement" }
  }
}
