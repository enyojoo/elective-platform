"use client"

import { createClient } from "@supabase/supabase-js"
import { createCachedDataHook } from "./use-cached-data-base"

async function fetchGroups(institutionId: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const { data, error } = await supabase
    .from("groups")
    .select("*, programs(name, code)")
    .eq("institution_id", institutionId)

  if (error) throw error

  return data
}

export const useCachedGroups = createCachedDataHook("groups", fetchGroups)
