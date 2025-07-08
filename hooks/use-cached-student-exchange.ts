"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface StudentExchangeData {
  exchangePrograms: any[]
  exchangeSelections: any[]
}

export function useCachedStudentExchange() {
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()
  const [data, setData] = useState<StudentExchangeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (profileLoading) return

    if (profileError) {
      setError(`Failed to load profile: ${profileError}`)
      setIsLoading(false)
      return
    }

    if (!profile?.id || !profile?.institution_id || !profile.group?.id) {
      setError(
        "Student profile information (including group assignment) is incomplete. Cannot fetch group-specific exchange programs.",
      )
      setIsLoading(false)
      setData({ exchangePrograms: [], exchangeSelections: [] })
      return
    }

    try {
      setIsLoading(true)
      setError(null)

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

      setData({
        exchangePrograms: exchangeData || [],
        exchangeSelections: selectionsData || [],
      })
    } catch (err: any) {
      setError(err.message || "Failed to load exchange programs data.")
      setData({ exchangePrograms: [], exchangeSelections: [] })
    } finally {
      setIsLoading(false)
    }
  }, [profile, profileLoading, profileError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
