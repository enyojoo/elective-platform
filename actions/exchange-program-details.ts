"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getExchangeProgram(id: string) {
  const supabase = createServerComponentClient({ cookies })

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

  const supabase = createServerComponentClient({ cookies })

  try {
    // First try without countries join to see if universities table exists
    const { data, error } = await supabase.from("universities").select("*").in("id", universityIds).order("name")

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
  const supabase = createServerComponentClient({ cookies })

  try {
    // First try a simple query to see if the table exists
    const { data, error } = await supabase
      .from("exchange_selections")
      .select("*")
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

export async function getExchangeSelectionsWithProfiles(exchangeId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Try with profile joins
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
      console.error("Error fetching exchange selections with profiles:", error)
      // Fall back to simple query
      return await getExchangeSelections(exchangeId)
    }

    return data || []
  } catch (error) {
    console.error("Error in getExchangeSelectionsWithProfiles:", error)
    // Fall back to simple query
    return await getExchangeSelections(exchangeId)
  }
}

export async function getUniversitySelectionData(universityId: string, exchangeId: string) {
  const supabase = createServerComponentClient({ cookies })

  try {
    // Get all selections that include this university
    const { data, error } = await supabase
      .from("exchange_selections")
      .select("*")
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
  const supabase = createServerComponentClient({ cookies })

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
