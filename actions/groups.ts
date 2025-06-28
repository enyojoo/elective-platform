"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export interface Group {
  id: string
  name: string
  name_ru: string | null
}

export async function getGroups(institutionId: string): Promise<Group[]> {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, name_ru")
    .eq("institution_id", institutionId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching groups:", error)
    throw new Error("Failed to fetch groups")
  }

  return data || []
}
