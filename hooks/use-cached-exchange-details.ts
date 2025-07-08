"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ExchangeDetailsData {
  exchange: any | null
  universities: any[]
  selection: any | null
}

export function useCachedExchangeDetails(packId: string) {
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()
  const [data, setData] = useState<ExchangeDetailsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (profileLoading) return

    if (profileError) {
      setError(`Failed to load profile: ${profileError}`)
      setIsLoading(false)
      return
    }

    if (!profile?.id || !packId) {
      setError("Missing required data")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fetch exchange program details
      const { data: exchangeData, error: exchangeError } = await supabaseClient
        .from("elective_exchange")
        .select("*")
        .eq("id", packId)
        .single()

      if (exchangeError) throw exchangeError

      // Fetch universities for this exchange
      const { data: universitiesData, error: universitiesError } = await supabaseClient
        .from("exchange_universities")
        .select("*")
        .contains("elective_exchange_ids", [packId])

      if (universitiesError) throw universitiesError

      // Fetch student's selection for this exchange
      const { data: selectionData, error: selectionError } = await supabaseClient
        .from("exchange_selections")
        .select("*")
        .eq("student_id", profile.id)
        .eq("elective_exchange_id", packId)
        .maybeSingle()

      if (selectionError) throw selectionError

      setData({
        exchange: exchangeData,
        universities: universitiesData || [],
        selection: selectionData,
      })
    } catch (err: any) {
      setError(err.message || "Failed to load exchange details.")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [profile, profileLoading, profileError, packId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
