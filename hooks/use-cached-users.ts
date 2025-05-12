"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useDataCache } from "@/lib/data-cache-context"

export function useCachedUsers(institutionId?: string) {
  const [users, setUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false)
  const { getCachedData, setCachedData } = useDataCache()

  const fetchUsers = async () => {
    if (!institutionId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Try to get data from cache first
      const cachedUsers = getCachedData<any[]>("users", institutionId)

      if (cachedUsers && cachedUsers.length > 0) {
        setUsers(cachedUsers)
        setIsLoading(false)
        setIsInitialDataLoaded(true)
        return
      }

      // Fetch profiles for the institution
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active")
        .eq("institution_id", institutionId)
        .order("full_name")

      if (profilesError) throw profilesError

      if (!profilesData) {
        setUsers([])
        setIsLoading(false)
        setIsInitialDataLoaded(true)
        return
      }

      // Get all student profiles
      const { data: studentProfiles, error: studentError } = await supabase
        .from("student_profiles")
        .select("profile_id, group_id, year, degree_id")

      if (studentError) throw studentError

      // Get all manager profiles
      const { data: managerProfiles, error: managerError } = await supabase
        .from("manager_profiles")
        .select("profile_id, group_id, degree_id")

      if (managerError) throw managerError

      // Get all groups
      const { data: groups, error: groupsError } = await supabase.from("groups").select("id, name, degree_id")

      if (groupsError) throw groupsError

      // Get all degrees
      const { data: degrees, error: degreesError } = await supabase.from("degrees").select("id, name")

      if (degreesError) throw degreesError

      // Create maps for quick lookups
      const studentProfileMap = new Map()
      if (studentProfiles) {
        studentProfiles.forEach((profile) => {
          studentProfileMap.set(profile.profile_id, profile)
        })
      }

      const managerProfileMap = new Map()
      if (managerProfiles) {
        managerProfiles.forEach((profile) => {
          managerProfileMap.set(profile.profile_id, profile)
        })
      }

      const groupMap = new Map()
      if (groups) {
        groups.forEach((group) => {
          groupMap.set(group.id, group)
        })
      }

      const degreeMap = new Map()
      if (degrees) {
        degrees.forEach((degree) => {
          degreeMap.set(degree.id, degree)
        })
      }

      // Format the users data
      const formattedUsers = profilesData.map((profile) => {
        const studentProfile = studentProfileMap.get(profile.id)
        const managerProfile = managerProfileMap.get(profile.id)
        const roleSpecificProfile = profile.role === "student" ? studentProfile : managerProfile

        let groupName = ""
        let degreeName = ""
        let year = ""

        if (roleSpecificProfile) {
          const group = groupMap.get(roleSpecificProfile.group_id)
          const degree = degreeMap.get(roleSpecificProfile.degree_id)

          groupName = group ? group.name : ""
          degreeName = degree ? degree.name : ""
          year = roleSpecificProfile.year || ""
        }

        return {
          id: profile.id,
          name: profile.full_name || "",
          email: profile.email || "",
          role: profile.role,
          status: profile.is_active ? "active" : "inactive",
          groupId: roleSpecificProfile?.group_id || "",
          groupName,
          degreeId: roleSpecificProfile?.degree_id || "",
          degreeName,
          year,
        }
      })

      // Save to cache
      setCachedData("users", institutionId, formattedUsers)

      setUsers(formattedUsers)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching users:", err)
      setError(err.message || "Failed to fetch users")
    } finally {
      setIsLoading(false)
      setIsInitialDataLoaded(true)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [institutionId])

  return { users, isLoading, error, isInitialDataLoaded, refetchUsers: fetchUsers }
}
