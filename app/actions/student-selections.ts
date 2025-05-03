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

  const packId = formData.get("packId") as string
  const courseId = formData.get("courseId") as string

  if (!packId || !courseId) {
    return { error: "Pack ID and Course ID are required" }
  }

  // Get user's institution
  const { data: profile } = await supabase.from("profiles").select("institution_id").eq("id", user.id).single()

  if (!profile) {
    return { error: "User profile not found" }
  }

  // Check if user already has a selection for this pack
  const { data: existingSelection } = await supabase
    .from("student_selections")
    .select("id")
    .eq("student_id", user.id)
    .eq("pack_id", packId)
    .maybeSingle()

  if (existingSelection) {
    // Update existing selection
    const { error } = await supabase
      .from("student_selections")
      .update({
        course_id: courseId,
        exchange_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSelection.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new selection
    const { error } = await supabase.from("student_selections").insert({
      institution_id: profile.institution_id,
      student_id: user.id,
      pack_id: packId,
      course_id: courseId,
      exchange_id: null,
      status: "pending",
    })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath(`/student/courses/${packId}`)
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

  const packId = formData.get("packId") as string
  const selectionId = formData.get("selectionId") as string
  const statement = formData.get("statement") as File

  if (!packId || !selectionId || !statement) {
    return { error: "All fields are required" }
  }

  // Upload file to storage
  const fileExt = statement.name.split(".").pop()
  const fileName = `${user.id}_${packId}_${Date.now()}.${fileExt}`
  const filePath = `statements/${fileName}`

  const { error: uploadError } = await supabase.storage.from("statements").upload(filePath, statement)

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get public URL
  const { data: urlData } = await supabase.storage.from("statements").getPublicUrl(filePath)

  // Update selection with statement URL
  const { error: updateError } = await supabase
    .from("student_selections")
    .update({
      statement_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectionId)
    .eq("student_id", user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath(`/student/courses/${packId}`)
  return { success: true, url: urlData.publicUrl }
}
