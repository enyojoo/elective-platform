"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/database.types"

export async function submitStudentCourseSelectionAction(formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies })

  const userId = formData.get("userId") as string
  const packId = formData.get("packId") as string
  const selectedCourseIdsString = formData.get("selectedCourseIds") as string
  const selectionId = formData.get("selectionId") as string | undefined
  const statementFile = formData.get("statementFile") as File | null
  const existingStatementUrl = formData.get("existingStatementUrl") as string | null

  if (!userId || !packId || !selectedCourseIdsString) {
    return { error: "Missing required fields.", data: null }
  }

  let selectedCourseIds: string[]
  try {
    selectedCourseIds = JSON.parse(selectedCourseIdsString)
  } catch (e) {
    return { error: "Invalid course selection format.", data: null }
  }

  let statementUrlForDb: string | null = existingStatementUrl

  if (statementFile && statementFile.size > 0) {
    const filePath = `student_statements/${userId}/${packId}/${Date.now()}_${statementFile.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("student-statements") // Corrected bucket name
      .upload(filePath, statementFile, {
        upsert: true, // Overwrite if same path, though timestamp makes it unique
      })

    if (uploadError) {
      console.error("Statement upload error:", uploadError)
      return { error: `Statement upload failed: ${uploadError.message}`, data: null }
    }
    statementUrlForDb = filePath // Store the path
  }

  const selectionData = {
    student_id: userId,
    elective_course_id: packId,
    selected_course_ids: selectedCourseIds,
    statement_url: statementUrlForDb,
    status: "pending" as const, // Or 'submitted'
    submitted_at: new Date().toISOString(),
  }

  let dbResult
  if (selectionId) {
    dbResult = await supabase.from("course_selections").update(selectionData).eq("id", selectionId).select().single()
  } else {
    dbResult = await supabase.from("course_selections").insert(selectionData).select().single()
  }

  const { data: dbData, error: dbError } = dbResult

  if (dbError) {
    console.error("DB error saving selection:", dbError)
    return { error: `Failed to save selection: ${dbError.message}`, data: null }
  }

  revalidatePath(`/student/courses/${packId}`)
  revalidatePath(`/student/dashboard`) // In case dashboard shows selection status

  return {
    data: {
      success: true,
      statement_url: statementUrlForDb,
      selection: dbData,
    },
    error: null,
  }
}

// Helper to get public URL for display/download if paths are stored
export async function getPublicUrlForPath(filePath: string | null) {
  if (!filePath) return null
  const supabase = createServerActionClient<Database>({ cookies })
  // Ensure your bucket (e.g., 'student_documents') allows public reads or generate signed URLs
  const { data } = supabase.storage.from("student-statements").getPublicUrl(filePath)
  return data?.publicUrl || null
}
