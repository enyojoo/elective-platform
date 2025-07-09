"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getExchangeProgram(id: string) {
  try {
    const { data, error } = await supabase.from("elective_exchange").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching exchange program:", error)
      throw new Error(`Failed to fetch exchange program: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in getExchangeProgram:", error)
    throw error
  }
}

export async function getUniversitiesFromIds(universityIds: string[]) {
  if (!universityIds || universityIds.length === 0) {
    return []
  }

  try {
    // Fetch universities with their languages
    const { data, error } = await supabase
      .from("universities")
      .select(`
        *,
        university_languages (
          language
        )
      `)
      .in("id", universityIds)
      .order("name")

    if (error) {
      console.error("Error fetching universities:", error)
      throw new Error(`Failed to fetch universities: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getUniversitiesFromIds:", error)
    throw error
  }
}

export async function getExchangeSelections(exchangeId: string) {
  try {
    // Fetch exchange selections with student profile data
    const { data, error } = await supabase
      .from("exchange_selections")
      .select(`
        id,
        selected_universities,
        statement_url,
        status,
        created_at,
        student_id,
        profiles!exchange_selections_student_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq("elective_exchange_id", exchangeId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exchange selections:", error)
      throw new Error(`Failed to fetch exchange selections: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getExchangeSelections:", error)
    throw error
  }
}

export async function getUniversitySelectionData(universityId: string, exchangeId: string) {
  try {
    // Get all selections that include this university
    const { data, error } = await supabase
      .from("exchange_selections")
      .select(`
        id,
        status,
        created_at,
        student_id,
        profiles!exchange_selections_student_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq("elective_exchange_id", exchangeId)
      .contains("selected_universities", [universityId])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching university selection data:", error)
      throw new Error(`Failed to fetch university selection data: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getUniversitySelectionData:", error)
    throw error
  }
}

export async function downloadStatementFile(statementUrl: string) {
  try {
    const { data, error } = await supabase.storage.from("statements").download(statementUrl)

    if (error) {
      console.error("Error downloading statement:", error)
      throw new Error(`Failed to download statement: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in downloadStatementFile:", error)
    throw error
  }
}

export async function updateSelectionStatus(selectionId: string, status: "approved" | "rejected") {
  try {
    const { data, error } = await supabase
      .from("exchange_selections")
      .update({ status })
      .eq("id", selectionId)
      .select()
      .single()

    if (error) {
      console.error("Error updating selection status:", error)
      throw new Error(`Failed to update selection status: ${error.message}`)
    }

    revalidatePath("/manager/electives/exchange")
    return data
  } catch (error) {
    console.error("Error in updateSelectionStatus:", error)
    throw error
  }
}
