"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

export interface ActionResponse<T = null> {
  success: boolean
  message: string
  data?: T
  errors?: { field: string; message: string }[]
}

export async function uploadStatementForm(
  electivePackId: string,
  userId: string,
  formData: FormData,
): Promise<ActionResponse<{ filePath: string; fileName: string }>> {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const file = formData.get("statementForm") as File

  if (!file || file.size === 0) {
    return { success: false, message: "No file provided or file is empty." }
  }

  const fileName = `${userId}_${electivePackId}_${Date.now()}_${file.name}`
  const filePath = `statement_forms/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from("course_selection_documents") // Ensure this bucket exists and has appropriate policies
    .upload(filePath, file)

  if (uploadError) {
    console.error("Error uploading statement form:", uploadError)
    return {
      success: false,
      message: `Failed to upload statement form: ${uploadError.message}`,
    }
  }

  const { data: selection, error: fetchError } = await supabase
    .from("course_selections")
    .select("id")
    .eq("user_id", userId)
    .eq("elective_pack_id", electivePackId)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching existing selection:", fetchError)
    return { success: false, message: "Failed to fetch existing selection." }
  }

  const selectionData = {
    user_id: userId,
    elective_pack_id: electivePackId,
    statement_form_url: filePath,
    statement_form_filename: file.name,
    statement_form_uploaded_at: new Date().toISOString(),
    // Keep other fields, potentially set status if needed
    updated_at: new Date().toISOString(),
  }

  if (selection) {
    // Update existing selection
    const { error: updateError } = await supabase.from("course_selections").update(selectionData).eq("id", selection.id)

    if (updateError) {
      console.error("Error updating course selection with statement:", updateError)
      return {
        success: false,
        message: `Failed to update course selection: ${updateError.message}`,
      }
    }
  } else {
    // Create new selection entry if it doesn't exist
    const { error: insertError } = await supabase.from("course_selections").insert({
      ...selectionData,
      selected_course_ids: [], // Initialize if new
      status: "draft", // Or an appropriate initial status
      created_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error("Error inserting course selection with statement:", insertError)
      return {
        success: false,
        message: `Failed to save course selection: ${insertError.message}`,
      }
    }
  }

  revalidatePath(`/student/courses/${electivePackId}`)
  return {
    success: true,
    message: "Statement form uploaded successfully.",
    data: { filePath, fileName: file.name },
  }
}

export async function submitCourseSelection(
  electivePackId: string,
  userId: string,
  selectedCourseIds: string[],
  // If using zod for validation: formData: z.infer<typeof CourseSelectionSchema>
): Promise<ActionResponse> {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // 1. Fetch elective_pack to get course_limit
  const { data: electivePack, error: packError } = await supabase
    .from("elective_packs")
    .select("course_limit, deadline")
    .eq("id", electivePackId)
    .single()

  if (packError || !electivePack) {
    return {
      success: false,
      message: "Failed to fetch elective pack details.",
    }
  }

  // Check deadline
  if (electivePack.deadline && new Date(electivePack.deadline) < new Date()) {
    return { success: false, message: "The deadline for this elective pack has passed." }
  }

  // 2. Check if selectedCourseIds.length matches course_limit
  if (selectedCourseIds.length !== electivePack.course_limit) {
    return {
      success: false,
      message: `You must select exactly ${electivePack.course_limit} courses. You have selected ${selectedCourseIds.length}.`,
    }
  }

  // 3. Check if statement form is uploaded
  const { data: currentSelection, error: selectionError } = await supabase
    .from("course_selections")
    .select("id, statement_form_url, status")
    .eq("user_id", userId)
    .eq("elective_pack_id", electivePackId)
    .maybeSingle()

  if (selectionError) {
    return {
      success: false,
      message: "Failed to verify statement form status.",
    }
  }

  if (!currentSelection?.statement_form_url) {
    return {
      success: false,
      message: "Please upload the signed statement form before submitting.",
    }
  }

  if (currentSelection?.status === "submitted" || currentSelection?.status === "approved") {
    return { success: false, message: "Your selection has already been submitted and cannot be changed at this time." }
  }

  // 4. Upsert the course_selection
  const selectionPayload = {
    user_id: userId,
    elective_pack_id: electivePackId,
    selected_course_ids: selectedCourseIds,
    status: "submitted" as const, // Type assertion for status
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (currentSelection?.id) {
    const { error: updateError } = await supabase
      .from("course_selections")
      .update(selectionPayload)
      .eq("id", currentSelection.id)
    if (updateError) {
      console.error("Error updating course selection:", updateError)
      return {
        success: false,
        message: `Failed to update selection: ${updateError.message}`,
      }
    }
  } else {
    // This case should ideally be handled by prior statement upload, but as a fallback:
    const { error: insertError } = await supabase.from("course_selections").insert({
      ...selectionPayload,
      statement_form_url: currentSelection?.statement_form_url || null, // Should exist
      statement_form_filename: null, // This should be set during upload
      created_at: new Date().toISOString(),
    })
    if (insertError) {
      console.error("Error inserting course selection:", insertError)
      return {
        success: false,
        message: `Failed to submit selection: ${insertError.message}`,
      }
    }
  }

  revalidatePath(`/student/courses/${electivePackId}`)
  revalidatePath(`/student/dashboard`) // Also revalidate dashboard if it shows selection status
  return { success: true, message: "Course selection submitted successfully." }
}
