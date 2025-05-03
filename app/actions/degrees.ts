"use server"

import { revalidatePath } from "next/cache"
import { supabase, supabaseAdmin } from "@/lib/supabase"

export interface DegreeFormData {
  id?: string
  name: string
  nameRu: string | null
  code: string
  durationYears: number
  status: string
  institution_id: string
}

export async function getDegrees(institutionId: string) {
  try {
    console.log("Fetching degrees for institution:", institutionId)

    // Check if the table exists and log available tables for debugging
    const { data: tableList } = await supabase.from("degrees").select("id").limit(1)
    console.log("Table check result:", tableList)

    const { data, error } = await supabase
      .from("degrees")
      .select("*")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching degrees:", error)
      return { degrees: [], error: error.message }
    }

    console.log("Degrees data from Supabase:", data)
    return { degrees: data || [], error: null }
  } catch (error) {
    console.error("Error in getDegrees:", error)
    return { degrees: [], error: "Failed to fetch degrees" }
  }
}

export async function createDegree(formData: DegreeFormData) {
  try {
    const { id, ...degreeData } = formData

    console.log("Creating degree with data:", {
      institution_id: degreeData.institution_id,
      name: degreeData.name,
      name_ru: degreeData.nameRu,
      code: degreeData.code,
      duration_years: degreeData.durationYears,
      status: degreeData.status,
    })

    const { data, error } = await supabaseAdmin
      .from("degrees")
      .insert({
        institution_id: degreeData.institution_id,
        name: degreeData.name,
        name_ru: degreeData.nameRu,
        code: degreeData.code,
        duration_years: degreeData.durationYears,
        status: degreeData.status,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating degree:", error)
      return { success: false, error: error.message }
    }

    console.log("Created degree:", data)
    revalidatePath("/admin/degrees")
    return { success: true, data }
  } catch (error) {
    console.error("Error in createDegree:", error)
    return { success: false, error: "Failed to create degree" }
  }
}

export async function updateDegree(formData: DegreeFormData) {
  try {
    const { id, ...degreeData } = formData

    if (!id) {
      return { success: false, error: "Degree ID is required for update" }
    }

    console.log("Updating degree with ID:", id, "and data:", {
      name: degreeData.name,
      name_ru: degreeData.nameRu,
      code: degreeData.code,
      duration_years: degreeData.durationYears,
      status: degreeData.status,
    })

    const { data, error } = await supabaseAdmin
      .from("degrees")
      .update({
        name: degreeData.name,
        name_ru: degreeData.nameRu,
        code: degreeData.code,
        duration_years: degreeData.durationYears,
        status: degreeData.status,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating degree:", error)
      return { success: false, error: error.message }
    }

    console.log("Updated degree:", data)
    revalidatePath("/admin/degrees")
    return { success: true, data }
  } catch (error) {
    console.error("Error in updateDegree:", error)
    return { success: false, error: "Failed to update degree" }
  }
}

export async function deleteDegree(id: string) {
  try {
    const { error } = await supabaseAdmin.from("degrees").delete().eq("id", id)

    if (error) {
      console.error("Error deleting degree:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/degrees")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteDegree:", error)
    return { success: false, error: "Failed to delete degree" }
  }
}
