"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

export function useCachedProgramStudents(programId: string | undefined) {
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()

  useEffect(() => {
    if (!programId) {
      setIsLoading(false)
      return
    }

    const fetchProgramStudents = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedStudents = getCachedData<any[]>("programStudents", programId)

      if (cachedStudents) {
        console.log("Using cached program students")
        setStudents(cachedStudents)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching program students from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // First get all groups in this program
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id")
          .eq("program_id", programId)

        if (groupsError) throw groupsError

        // Get all student profiles in these groups
        const groupIds = groupsData.map((group) => group.id)

        if (groupIds.length === 0) {
          // No groups in this program
          setStudents([])
          setCachedData("programStudents", programId, [])
          setIsLoading(false)
          return
        }

        const { data: studentProfilesData, error: studentProfilesError } = await supabase
          .from("student_profiles")
          .select("*, profiles(*)")
          .in("group_id", groupIds)

        if (studentProfilesError) throw studentProfilesError

        // Save to cache
        setCachedData("programStudents", programId, studentProfilesData)

        // Update state
        setStudents(studentProfilesData)
      } catch (error: any) {
        console.error("Error fetching program students:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load program students",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgramStudents()
  }, [programId, getCachedData, setCachedData, toast])

  return { students, isLoading, error }
}
