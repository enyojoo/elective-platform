"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getExchangeSelections(programId: string) {
  try {
    console.log("Fetching exchange selections for program:", programId)

    const { data: selections, error } = await supabase
      .from("exchange_selections")
      .select(`
        id,
        student_id,
        program_id,
        university_id,
        status,
        priority,
        created_at,
        updated_at,
        profiles!student_id (
          id,
          full_name,
          email,
          student_id,
          academic_year,
          degrees:degree_id(id, name),
          groups:group_id(id, name)
        )
      `)
      .eq("program_id", programId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exchange selections:", error)
      throw error
    }

    console.log("Raw selections data:", selections)

    // Process the data to flatten the structure
    const processedSelections = (selections || []).map((selection) => ({
      ...selection,
      student: {
        id: selection.profiles?.id,
        full_name: selection.profiles?.full_name,
        email: selection.profiles?.email,
        student_id: selection.profiles?.student_id,
        degree: selection.profiles?.degrees?.name,
        year: selection.profiles?.academic_year,
        group: selection.profiles?.groups?.name,
      },
    }))

    console.log("Processed selections:", processedSelections)
    return { data: processedSelections, error: null }
  } catch (error) {
    console.error("Server action error:", error)
    return { data: null, error: "Failed to fetch exchange selections" }
  }
}

export async function getUniversitySelectionData(programId: string, universityId: string) {
  try {
    console.log("Fetching university selection data for:", { programId, universityId })

    const { data: selections, error } = await supabase
      .from("exchange_selections")
      .select(`
        id,
        student_id,
        program_id,
        university_id,
        status,
        priority,
        created_at,
        updated_at,
        profiles!student_id (
          id,
          full_name,
          email,
          student_id,
          academic_year,
          degrees:degree_id(id, name),
          groups:group_id(id, name)
        )
      `)
      .eq("program_id", programId)
      .eq("university_id", universityId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching university selections:", error)
      throw error
    }

    console.log("Raw university selections data:", selections)

    // Process the data to flatten the structure
    const processedSelections = (selections || []).map((selection) => ({
      ...selection,
      student: {
        id: selection.profiles?.id,
        full_name: selection.profiles?.full_name,
        email: selection.profiles?.email,
        student_id: selection.profiles?.student_id,
        degree: selection.profiles?.degrees?.name,
        year: selection.profiles?.academic_year,
        group: selection.profiles?.groups?.name,
      },
    }))

    console.log("Processed university selections:", processedSelections)
    return { data: processedSelections, error: null }
  } catch (error) {
    console.error("Server action error:", error)
    return { data: null, error: "Failed to fetch university selection data" }
  }
}
