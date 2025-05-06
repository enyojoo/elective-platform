"\"use client"

import { createClient } from "@supabase/supabase-js"
import { createCachedDataHook } from "./use-cached-data-base"

export interface University {
  id: number
  name: string
  country: string
  city: string
  website: string
  exchangePrograms: number
  status: string
}

// Function to fetch universities data
async function fetchUniversities(institutionId: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const { data, error } = await supabase
    .from("universities")
    .select("*")
    .eq("institution_id", institutionId)
    .order("name")

  if (error) {
    console.error("Error fetching universities:", error)
    throw new Error(error.message)
  }

  return data || []
}

// Create the cached hook for universities
export const useCachedUniversities = createCachedDataHook<University[]>("universities", fetchUniversities)
