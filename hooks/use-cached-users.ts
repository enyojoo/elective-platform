"use client"

import { createClient } from "@supabase/supabase-js"
import { createCachedDataHook } from "./use-cached-data-base"

async function fetchUsers(institutionId: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Fetch profiles
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("institution_id", institutionId)

  if (profilesError) throw profilesError

  // Transform the data
  const transformedUsers = profilesData.map((profile) => ({
    id: profile.id,
    name: profile.full_name || "",
    email: profile.email || "",
    role: profile.role || "",
    status: profile.is_active ? "active" : "inactive",
    // Add other fields as needed
  }))

  return transformedUsers
}

export const useCachedUsers = createCachedDataHook("users", fetchUsers)
