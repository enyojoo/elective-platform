"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getExchangeProgram(id: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.from("elective_exchange").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching exchange program:", error)
    throw new Error("Failed to fetch exchange program")
  }

  return data
}

export async function getUniversitiesFromIds(universityIds: string[]) {
  if (!universityIds || universityIds.length === 0) {
    return []
  }

  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("universities")
    .select("*, countries(name, name_ru)")
    .in("id", universityIds)
    .eq("status", "active")
    .order("name")

  if (error) {
    console.error("Error fetching universities:", error)
    throw new Error("Failed to fetch universities")
  }

  return data || []
}

export async function getExchangeSelections(exchangeId: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("exchange_selections")
    .select(`
      id,
      selected_universities,
      statement_url,
      status,
      created_at,
      profiles!exchange_selections_student_id_fkey (
        id,
        full_name,
        email,
        student_profiles (
          enrollment_year,
          groups (
            name,
            display_name,
            programs (
              name,
              name_ru
            )
          )
        )
      )
    `)
    .eq("elective_exchange_id", exchangeId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching exchange selections:", error)
    throw new Error("Failed to fetch exchange selections")
  }

  return data || []
}

export async function getUniversitySelectionData(universityId: string, exchangeId: string) {
  const supabase = createServerComponentClient({ cookies })

  // Get all selections that include this university
  const { data, error } = await supabase
    .from("exchange_selections")
    .select(`
      id,
      status,
      created_at,
      profiles!exchange_selections_student_id_fkey (
        id,
        full_name,
        email,
        student_profiles (
          enrollment_year,
          groups (
            name,
            display_name,
            programs (
              name,
              name_ru
            )
          )
        )
      )
    `)
    .eq("elective_exchange_id", exchangeId)
    .contains("selected_universities", [universityId])
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching university selection data:", error)
    throw new Error("Failed to fetch university selection data")
  }

  return data || []
}

export async function downloadStatementFile(statementUrl: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase.storage.from("statements").download(statementUrl)

  if (error) {
    console.error("Error downloading statement:", error)
    throw new Error("Failed to download statement")
  }

  return data
}
