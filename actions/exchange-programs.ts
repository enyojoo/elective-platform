"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { getSession } from "@/lib/session"
import type { Semester } from "@/lib/types"

export type ExchangeProgram = {
  id: string
  name: string
  semester: Semester
  year: number
  max_selections: number
  status: "draft" | "published" | "closed"
  start_date: string
  end_date: string
  universities_count: number
  available_spaces: boolean
  selected: boolean
  selection_status?: "approved" | "pending" | "rejected"
  selected_count: number
  institution_id: string
}

export async function getExchangePrograms() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    // Get the student profile to find their institution_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("institution_id")
      .eq("user_id", session.user.id)
      .single()

    if (profileError || !profile) {
      console.error("Error fetching student profile:", profileError)
      throw new Error("Failed to fetch student profile")
    }

    // Fetch exchange programs for the student's institution
    const { data: exchangePrograms, error } = await supabase
      .from("elective_exchange")
      .select(`
        id,
        name,
        semester,
        year,
        max_selections,
        status,
        start_date,
        end_date,
        institution_id
      `)
      .eq("institution_id", profile.institution_id)
      .order("year", { ascending: false })
      .order("semester")

    if (error) {
      console.error("Error fetching exchange programs:", error)
      throw new Error("Failed to fetch exchange programs")
    }

    // For each exchange program, get the count of universities
    const programsWithCounts = await Promise.all(
      exchangePrograms.map(async (program) => {
        // Count universities for this exchange program
        const { count: universitiesCount, error: countError } = await supabase
          .from("exchange_universities")
          .select("*", { count: "exact", head: true })
          .eq("elective_pack_id", program.id)
          .eq("status", "active")

        if (countError) {
          console.error(`Error counting universities for program ${program.id}:`, countError)
        }

        // Check if there are available spaces
        const availableSpaces = universitiesCount ? universitiesCount > 0 : false

        // Get student selections for this program
        const { data: selections, error: selectionsError } = await supabase
          .from("student_exchange_selections")
          .select("id, status")
          .eq("elective_pack_id", program.id)
          .eq("student_id", session.user.id)

        if (selectionsError) {
          console.error(`Error fetching selections for program ${program.id}:`, selectionsError)
        }

        // Determine if the student has selected this program and the selection status
        const selected = selections && selections.length > 0
        const selectionStatus = selected ? selections[0].status : undefined
        const selectedCount = selections ? selections.length : 0

        return {
          ...program,
          universities_count: universitiesCount || 0,
          available_spaces: availableSpaces,
          selected,
          selection_status: selectionStatus,
          selected_count: selectedCount,
        } as ExchangeProgram
      }),
    )

    return programsWithCounts
  } catch (error) {
    console.error("Error in getExchangePrograms:", error)
    throw error
  }
}

export async function getExchangeProgram(id: string): Promise<ExchangeProgram | null> {
  try {
    const supabase = createServerComponentClient({ cookies })
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("User not authenticated")
    }

    // Fetch the specific exchange program
    const { data: program, error } = await supabase
      .from("elective_exchange")
      .select(`
        id,
        name,
        semester,
        year,
        max_selections,
        status,
        start_date,
        end_date,
        institution_id
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error fetching exchange program ${id}:`, error)
      throw new Error("Failed to fetch exchange program")
    }

    if (!program) {
      return null
    }

    // Count universities for this exchange program
    const { count: universitiesCount, error: countError } = await supabase
      .from("exchange_universities")
      .select("*", { count: "exact", head: true })
      .eq("elective_pack_id", program.id)
      .eq("status", "active")

    if (countError) {
      console.error(`Error counting universities for program ${program.id}:`, countError)
    }

    // Check if there are available spaces
    const availableSpaces = universitiesCount ? universitiesCount > 0 : false

    // Get student selections for this program
    const { data: selections, error: selectionsError } = await supabase
      .from("student_exchange_selections")
      .select("id, status")
      .eq("elective_pack_id", program.id)
      .eq("student_id", session.user.id)

    if (selectionsError) {
      console.error(`Error fetching selections for program ${program.id}:`, selectionsError)
    }

    // Determine if the student has selected this program and the selection status
    const selected = selections && selections.length > 0
    const selectionStatus = selected ? selections[0].status : undefined
    const selectedCount = selections ? selections.length : 0

    return {
      ...program,
      universities_count: universitiesCount || 0,
      available_spaces: availableSpaces,
      selected,
      selection_status: selectionStatus,
      selected_count: selectedCount,
    } as ExchangeProgram
  } catch (error) {
    console.error(`Error in getExchangeProgram for id ${id}:`, error)
    throw error
  }
}
