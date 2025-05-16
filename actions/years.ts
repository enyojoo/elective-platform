"use server"

import { getSupabaseServerClient } from "@/lib/supabase"

export interface Year {
  id: string
  name: string
  name_ru: string | null
  code: string
  created_at: string
  updated_at: string
}

export async function getYears(): Promise<Year[]> {
  const supabase = getSupabaseServerClient()

  try {
    const { data, error } = await supabase.from("years").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching years:", error)
      throw new Error("Failed to fetch years")
    }

    return data || []
  } catch (error) {
    console.error("Error in getYears:", error)
    return []
  }
}
