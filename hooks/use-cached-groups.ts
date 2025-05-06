"use client"

import { useState, useEffect } from "react"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { useInstitutionContext } from "@/lib/institution-context"

export function useCachedGroups() {
  const [groups, setGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { getCachedData, setCachedData } = useDataCache()
  const { toast } = useToast()
  const { institution } = useInstitutionContext()
  const institutionId = institution?.id

  useEffect(() => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    const fetchGroups = async () => {
      setIsLoading(true)
      setError(null)

      // Try to get data from cache first
      const cachedGroups = getCachedData<any[]>("groups", institutionId)

      if (cachedGroups) {
        console.log("Using cached groups data")
        setGroups(cachedGroups)
        setIsLoading(false)
        return
      }

      // If not in cache, fetch from API
      console.log("Fetching groups data from API")
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // First, fetch the groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("*")
          .eq("institution_id", institutionId)
          .order("name")

        if (groupsError) throw groupsError

        if (!groupsData) {
          setGroups([])
          setIsLoading(false)
          return
        }

        // Fetch program and degree information separately
        const programIds = [...new Set(groupsData.map((g) => g.program_id).filter(Boolean))]
        const degreeIds = [...new Set(groupsData.map((g) => g.degree_id).filter(Boolean))]

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name")
          .in("id", programIds)

        if (programsError) throw programsError

        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .in("id", degreeIds)

        if (degreesError) throw degreesError

        // Create maps for quick lookups
        const programMap = new Map()
        if (programsData) {
          programsData.forEach((program) => {
            programMap.set(program.id, program.name)
          })
        }

        const degreeMap = new Map()
        if (degreesData) {
          degreesData.forEach((degree) => {
            degreeMap.set(degree.id, degree.name)
          })
        }

        // Count students in each group
        const studentCountMap = new Map()
        for (const group of groupsData) {
          const { count, error: countError } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)
            .eq("role", "student")

          if (countError) {
            console.error("Error counting students for group", group.id, countError)
            studentCountMap.set(group.id, 0)
          } else {
            studentCountMap.set(group.id, count || 0)
          }
        }

        // Format the groups data
        const formattedGroups = groupsData.map((group) => ({
          id: group.id.toString(),
          name: group.name,
          displayName: group.display_name,
          program: programMap.get(group.program_id) || "Unknown",
          programId: group.program_id,
          degree: degreeMap.get(group.degree_id) || "Unknown",
          degreeId: group.degree_id,
          year: group.year,
          students: studentCountMap.get(group.id) || 0,
          status: group.status,
        }))

        // Save to cache
        setCachedData("groups", institutionId, formattedGroups)

        // Update state
        setGroups(formattedGroups)
      } catch (error: any) {
        console.error("Error fetching groups:", error)
        setError(error.message)
        toast({
          title: "Error",
          description: "Failed to load groups data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [institutionId, getCachedData, setCachedData, toast])

  return { groups, isLoading, error }
}
