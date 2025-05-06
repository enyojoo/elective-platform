"use client"

import { createClient } from "@supabase/supabase-js"
import { createCachedDataHook } from "./use-cached-data-base"

async function fetchPrograms(institutionId: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const { data, error } = await supabase.from("programs").select("*, degrees(name)").eq("institution_id", institutionId)

  if (error) throw error

  return data
}

export const useCachedPrograms = createCachedDataHook("programs", fetchPrograms)
