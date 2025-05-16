"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function getElectivePacks(institutionId: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("elective_packs")
    .select("id, title, name, deadline, max_selections")
    .eq("institution_id", institutionId)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching elective packs:", error)
    throw new Error("Failed to fetch elective packs")
  }

  return data
}

export async function getElectivePack(id: string) {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from("elective_packs")
    .select("id, title, name, deadline, max_selections, statement_template_url")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching elective pack:", error)
    throw new Error("Failed to fetch elective pack")
  }

  return data
}
