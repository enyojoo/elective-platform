"use client"

import { useCallback } from "react"
import { createClient } from "@supabase/supabase-js"
import { useCachedDataPattern } from "./use-cached-data-pattern"
import { useCachedStudentProfile } from "./use-cached-student-profile"

const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ExchangeDetailsData {
  exchangePackData: any
  universities: any[]
  existingSelection: any
}

export function useCachedExchangeDetails(packId: string) {
  const { profile } = useCachedStudentProfile()

  const fetchExchangeDetails = useCallback(async (): Promise<ExchangeDetailsData> => {
    if (!profile?.id) {
      throw new Error("Student profile not loaded")
    }

    // Fetch exchange pack data
    const { data: packData, error: packError } = await supabaseClient
      .from("elective_exchange")
      .select("*")
      .eq("id", packId)
      .single()

    if (packError) throw packError
    if (!packData) throw new Error("Exchange program not found.")

    // Fetch universities using the UUIDs from the universities column
    const universityUuids = packData.universities || []
    let universitiesWithCounts: any[] = []

    if (universityUuids.length > 0) {
      const { data: fetchedUnis, error: unisError } = await supabaseClient
        .from("universities")
        .select("*")
        .in("id", universityUuids)

      if (unisError) throw unisError

      // Fetch current student counts for each university (pending + approved)
      universitiesWithCounts = await Promise.all(
        (fetchedUnis || []).map(async (university) => {
          const { count: currentStudents, error: countError } = await supabaseClient
            .from("exchange_selections")
            .select("*", { count: "exact", head: true })
            .contains("selected_university_ids", [university.id])
            .in("status", ["pending", "approved"])

          if (countError) {
            console.error("Error fetching exchange selection count:", countError)
            return { ...university, current_students: 0 }
          }

          return { ...university, current_students: currentStudents || 0 }
        }),
      )
    }

    // Fetch existing selection
    const { data: selectionData, error: selectionError } = await supabaseClient
      .from("exchange_selections")
      .select("*")
      .eq("student_id", profile.id)
      .eq("elective_exchange_id", packId)
      .maybeSingle()

    if (selectionError) throw selectionError

    return {
      exchangePackData: packData,
      universities: universitiesWithCounts,
      existingSelection: selectionData,
    }
  }, [packId, profile?.id])

  return useCachedDataPattern<ExchangeDetailsData>(
    `exchange-details-${packId}`,
    fetchExchangeDetails,
    !!profile?.id && !!packId,
    3 * 60 * 1000, // 3 minutes cache
  )
}
