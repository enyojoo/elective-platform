"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getExchangeProgram(id: string) {
  try {
    const { data, error } = await supabase.from("elective_exchange").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching exchange program:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getExchangeProgram:", error)
    return null
  }
}

export async function getUniversitiesFromIds(universityIds: string[]) {
  if (!universityIds || universityIds.length === 0) {
    return []
  }

  try {
    // First try to get universities without languages
    const { data: universities, error: univError } = await supabase
      .from("universities")
      .select("*")
      .in("id", universityIds)
      .order("name")

    if (univError) {
      console.error("Error fetching universities:", univError)
      return []
    }

    // Then try to get languages for each university
    const universitiesWithLanguages = await Promise.all(
      (universities || []).map(async (university) => {
        try {
          const { data: languages, error: langError } = await supabase
            .from("university_languages")
            .select("language")
            .eq("university_id", university.id)

          if (langError) {
            console.error("Error fetching languages for university:", university.id, langError)
            return {
              ...university,
              university_languages: [],
            }
          }

          return {
            ...university,
            university_languages: languages || [],
          }
        } catch (error) {
          console.error("Error processing university languages:", error)
          return {
            ...university,
            university_languages: [],
          }
        }
      }),
    )

    return universitiesWithLanguages
  } catch (error) {
    console.error("Error in getUniversitiesFromIds:", error)
    return []
  }
}

export async function getExchangeSelections(exchangeId: string) {
  try {
    // First get the selections
    const { data: selections, error: selectionsError } = await supabase
      .from("exchange_selections")
      .select("*")
      .eq("elective_exchange_id", exchangeId)
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching exchange selections:", selectionsError)
      return []
    }

    // Then get profile data for each selection
    const selectionsWithProfiles = await Promise.all(
      (selections || []).map(async (selection) => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", selection.student_id)
            .single()

          if (profileError) {
            console.error("Error fetching profile for student:", selection.student_id, profileError)
            return {
              ...selection,
              profiles: null,
            }
          }

          return {
            ...selection,
            profiles: profile,
          }
        } catch (error) {
          console.error("Error processing selection profile:", error)
          return {
            ...selection,
            profiles: null,
          }
        }
      }),
    )

    return selectionsWithProfiles
  } catch (error) {
    console.error("Error in getExchangeSelections:", error)
    return []
  }
}

export async function getUniversitySelectionData(universityId: string, exchangeId: string) {
  try {
    // Get all selections for this exchange
    const { data: selections, error: selectionsError } = await supabase
      .from("exchange_selections")
      .select("*")
      .eq("elective_exchange_id", exchangeId)

    if (selectionsError) {
      console.error("Error fetching selections:", selectionsError)
      return []
    }

    // Filter selections that include this university
    const filteredSelections = (selections || []).filter(
      (selection) =>
        selection.selected_universities &&
        Array.isArray(selection.selected_universities) &&
        selection.selected_universities.includes(universityId),
    )

    // Get profile data for filtered selections
    const selectionsWithProfiles = await Promise.all(
      filteredSelections.map(async (selection) => {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", selection.student_id)
            .single()

          if (profileError) {
            console.error("Error fetching profile:", profileError)
            return {
              ...selection,
              profiles: null,
            }
          }

          return {
            ...selection,
            profiles: profile,
          }
        } catch (error) {
          console.error("Error processing profile:", error)
          return {
            ...selection,
            profiles: null,
          }
        }
      }),
    )

    return selectionsWithProfiles
  } catch (error) {
    console.error("Error in getUniversitySelectionData:", error)
    return []
  }
}

export async function downloadStatementFile(statementUrl: string) {
  try {
    // Extract the file path from the full URL if needed
    let filePath = statementUrl
    if (statementUrl.includes("/storage/v1/object/public/statements/")) {
      filePath = statementUrl.split("/storage/v1/object/public/statements/")[1]
    } else if (statementUrl.includes("/statements/")) {
      filePath = statementUrl.split("/statements/")[1]
    }

    const { data, error } = await supabase.storage.from("statements").download(filePath)

    if (error) {
      console.error("Error downloading statement:", error)
      throw new Error("Failed to download statement file")
    }

    return data
  } catch (error) {
    console.error("Error in downloadStatementFile:", error)
    throw new Error("Failed to download statement file")
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
      throw new Error("Failed to update selection status")
    }

    revalidatePath("/manager/electives/exchange")
    return data
  } catch (error) {
    console.error("Error in updateSelectionStatus:", error)
    throw new Error("Failed to update selection status")
  }
}
