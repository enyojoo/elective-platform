"use server"

import { getSupabaseServerClient } from "@/lib/supabase"
import { unstable_noStore as noStore } from "next/cache"
import { getInstitutionId } from "@/lib/session"

export interface Group {
  id: string
  name: string
}

export async function getGroups(): Promise<Group[]> {
  noStore()
  const supabase = getSupabaseServerClient()
  const institutionId = await getInstitutionId()

  if (!institutionId) {
    console.error("Action:getGroups - User is not associated with an institution")
    return []
  }

  const { data, error } = await supabase
    .from("groups")
    .select("id, name")
    .eq("institution_id", institutionId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching groups:", error)
    return []
  }

  return data as Group[]
}
