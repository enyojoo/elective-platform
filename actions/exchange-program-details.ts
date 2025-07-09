"use server"

import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getExchangeProgram(id: string) {
  try {
    console.log("Fetching exchange program with ID:", id)

    const { data: program, error } = await supabase.from("elective_exchange").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching exchange program:", error)
      throw new Error(`Failed to fetch exchange program: ${error.message}`)
    }

    if (!program) {
      throw new Error("Exchange program not found")
    }

    console.log("Exchange program fetched successfully:", program.name)

    // Fetch universities if they exist
    let universities = []
    if (program.universities && program.universities.length > 0) {
      universities = await getUniversitiesFromIds(program.universities)
    }

    return {
      ...program,
      universities,
    }
  } catch (error) {
    console.error("Error in getExchangeProgram:", error)
    throw error
  }
}

export async function getUniversitiesFromIds(universityIds: string[]) {
  try {
    console.log("Fetching universities with IDs:", universityIds)

    const { data: universities, error } = await supabase.from("universities").select("*").in("id", universityIds)

    if (error) {
      console.error("Error fetching universities:", error)
      throw new Error(`Failed to fetch universities: ${error.message}`)
    }

    console.log("Universities fetched successfully:", universities?.length || 0)
    return universities || []
  } catch (error) {
    console.error("Error in getUniversitiesFromIds:", error)
    throw error
  }
}

export async function getExchangeSelections(programId: string) {
  try {
    console.log("Fetching exchange selections for program:", programId)

    const { data: selections, error } = await supabase
      .from("exchange_selections")
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          email,
          academic_year,
          degrees:degree_id(id, name),
          groups:group_id(id, name)
        )
      `)
      .eq("exchange_program_id", programId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching exchange selections:", error)
      throw new Error(`Failed to fetch exchange selections: ${error.message}`)
    }

    // Process the data to flatten the structure
    const processedSelections = (selections || []).map((selection) => ({
      ...selection,
      student: {
        id: selection.profiles?.id,
        full_name: selection.profiles?.full_name,
        email: selection.profiles?.email,
        degree: selection.profiles?.degrees?.name,
        year: selection.profiles?.academic_year,
        group: selection.profiles?.groups?.name,
      },
    }))

    console.log("Exchange selections fetched successfully:", processedSelections.length)
    return processedSelections
  } catch (error) {
    console.error("Error in getExchangeSelections:", error)
    throw error
  }
}

export async function getUniversitySelectionData(programId: string, universityId: string) {
  try {
    console.log("Fetching university selection data for program:", programId, "university:", universityId)

    const { data: selections, error } = await supabase
      .from("exchange_selections")
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          email,
          academic_year,
          degrees:degree_id(id, name),
          groups:group_id(id, name)
        )
      `)
      .eq("exchange_program_id", programId)
      .contains("selected_universities", [universityId])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching university selection data:", error)
      throw new Error(`Failed to fetch university selection data: ${error.message}`)
    }

    // Process the data to flatten the structure
    const processedSelections = (selections || []).map((selection) => ({
      ...selection,
      student: {
        id: selection.profiles?.id,
        full_name: selection.profiles?.full_name,
        email: selection.profiles?.email,
        degree: selection.profiles?.degrees?.name,
        year: selection.profiles?.academic_year,
        group: selection.profiles?.groups?.name,
      },
    }))

    console.log("University selection data fetched successfully:", processedSelections.length)
    return processedSelections
  } catch (error) {
    console.error("Error in getUniversitySelectionData:", error)
    throw error
  }
}

export async function downloadStatementFile(selectionId: string) {
  try {
    console.log("Downloading statement file for selection:", selectionId)

    const { data: selection, error } = await supabase
      .from("exchange_selections")
      .select("statement_file_url")
      .eq("id", selectionId)
      .single()

    if (error) {
      console.error("Error fetching selection:", error)
      throw new Error(`Failed to fetch selection: ${error.message}`)
    }

    if (!selection?.statement_file_url) {
      throw new Error("No statement file found for this selection")
    }

    // Return the file URL for download
    return selection.statement_file_url
  } catch (error) {
    console.error("Error in downloadStatementFile:", error)
    throw error
  }
}

export async function updateSelectionStatus(selectionId: string, status: string) {
  try {
    console.log("Updating selection status:", selectionId, "to:", status)

    const { error } = await supabase.from("exchange_selections").update({ status }).eq("id", selectionId)

    if (error) {
      console.error("Error updating selection status:", error)
      throw new Error(`Failed to update selection status: ${error.message}`)
    }

    console.log("Selection status updated successfully")
    return { success: true }
  } catch (error) {
    console.error("Error in updateSelectionStatus:", error)
    throw error
  }
}

export async function updateStudentSelection(selectionId: string, data: any) {
  try {
    console.log("Updating student selection:", selectionId, "with data:", data)

    const { error } = await supabase.from("exchange_selections").update(data).eq("id", selectionId)

    if (error) {
      console.error("Error updating student selection:", error)
      throw new Error(`Failed to update student selection: ${error.message}`)
    }

    console.log("Student selection updated successfully")
    return { success: true }
  } catch (error) {
    console.error("Error in updateStudentSelection:", error)
    throw error
  }
}
