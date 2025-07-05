"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function cancelExchangeSelection(formData: FormData) {
  const studentId = formData.get("studentId") as string
  const electiveExchangeId = formData.get("electiveExchangeId") as string

  if (!studentId || !electiveExchangeId) {
    return { success: false, error: "Missing student ID or elective exchange ID." }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase
      .from("exchange_selections")
      .delete()
      .eq("student_id", studentId)
      .eq("elective_exchange_id", electiveExchangeId)

    if (error) {
      console.error("Error deleting exchange selection:", error)
      throw error
    }

    revalidatePath(`/student/exchange/${electiveExchangeId}`)
    revalidatePath("/student/exchange")

    return { success: true, message: "Exchange selection has been cancelled." }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to cancel exchange selection." }
  }
}
