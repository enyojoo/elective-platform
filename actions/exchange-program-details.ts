"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getExchangeSelections(exchangeId: string) {
  try {
    console.log("Fetching exchange selections for:", exchangeId)

    // Fetch exchange selections with student profile data
    const { data: selections, error: selectionsError } = await supabase
      .from("exchange_selections")
      .select(`
        id,
        student_id,
        exchange_id,
        selected_universities,
        statement_url,
        status,
        priority_order,
        created_at,
        updated_at,
        profiles!exchange_selections_student_id_fkey (
          id,
          full_name,
          email,
          academic_year,
          degrees:degree_id(id, name),
          groups:group_id(id, name)
        )
      `)
      .eq("exchange_id", exchangeId)
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching exchange selections:", selectionsError)
      throw selectionsError
    }

    console.log("Raw selections data:", selections)

    // Process the data to flatten the structure
    const processedSelections =
      selections?.map((selection) => ({
        ...selection,
        student_name: selection.profiles?.full_name || "N/A",
        student_email: selection.profiles?.email || "N/A",
        degree: selection.profiles?.degrees?.name || "N/A",
        year: selection.profiles?.academic_year || "N/A",
        group: selection.profiles?.groups?.name || "N/A",
      })) || []

    console.log("Processed selections:", processedSelections)

    return {
      success: true,
      data: processedSelections,
    }
  } catch (error) {
    console.error("Error in getExchangeSelections:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getUniversitySelectionData(exchangeId: string, universityId: string) {
  try {
    console.log("Fetching university selection data for:", { exchangeId, universityId })

    // Fetch selections that include this university
    const { data: selections, error: selectionsError } = await supabase
      .from("exchange_selections")
      .select(`
        id,
        student_id,
        exchange_id,
        selected_universities,
        statement_url,
        status,
        priority_order,
        created_at,
        updated_at,
        profiles!exchange_selections_student_id_fkey (
          id,
          full_name,
          email,
          academic_year,
          degrees:degree_id(id, name),
          groups:group_id(id, name)
        )
      `)
      .eq("exchange_id", exchangeId)
      .contains("selected_universities", [universityId])
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching university selections:", selectionsError)
      throw selectionsError
    }

    console.log("Raw university selections:", selections)

    // Process the data to flatten the structure
    const processedSelections =
      selections?.map((selection) => ({
        ...selection,
        student_name: selection.profiles?.full_name || "N/A",
        student_email: selection.profiles?.email || "N/A",
        degree: selection.profiles?.degrees?.name || "N/A",
        year: selection.profiles?.academic_year || "N/A",
        group: selection.profiles?.groups?.name || "N/A",
      })) || []

    console.log("Processed university selections:", processedSelections)

    return {
      success: true,
      data: processedSelections,
    }
  } catch (error) {
    console.error("Error in getUniversitySelectionData:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
