"use client"

import { useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedDataPattern } from "./use-cached-data-pattern"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface StudentExchangeData {
  exchangePrograms: any[]
  exchangeSelections: any[]
}

export function useCachedStudentExchange() {
  const { profile } = useCachedStudentProfile()

  const fetchStudentExchange = useCallback(async (): Promise<StudentExchangeData> => {
    if (!profile?.id || !profile?.institution_id || !profile.group?.id) {
      throw new Error("Student profile information is incomplete")
    }

    // Fetch exchange programs for the institution and group
    const { data: exchangeData, error: exchangeError } = await supabaseClient
      .from("elective_exchange")
      .select("*")
      .eq("institution_id", profile.institution_id)
      .eq("group_id", profile.group.id)
      .order("deadline", { ascending: false })

    if (exchangeError) throw exchangeError

    // Fetch student's exchange selections
    const { data: selectionsData, error: selectionsError } = await supabaseClient
      .from("exchange_selections")
      .select("*")
      .eq("student_id", profile.id)

    if (selectionsError) throw selectionsError

    return {
      exchangePrograms: exchangeData || [],
      exchangeSelections: selectionsData || [],
    }
  }, [profile?.id, profile?.institution_id, profile?.group?.id])

  return useCachedDataPattern<StudentExchangeData>(
    "student-exchange",
    fetchStudentExchange,
    !!profile?.id && !!profile?.institution_id && !!profile?.group?.id,
    5 * 60 * 1000, // 5 minutes cache
  )
}
