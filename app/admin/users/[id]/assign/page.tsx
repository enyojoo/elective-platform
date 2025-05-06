"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { useInstitution } from "@/lib/institution-context"

export default function ReassignManagerPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id
  const { toast } = useToast()
  const { institution } = useInstitution()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    role: UserRole.PROGRAM_MANAGER,
  })

  const [currentAssignment, setCurrentAssignment] = useState({
    degreeId: "",
    degreeName: "",
    groupId: "",
    groupName: "",
    year: "",
  })

  const [newAssignment, setNewAssignment] = useState({
    degreeId: "",
    groupId: "",
    year: "",
  })

  const [degrees, setDegrees] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!institution?.id || !userId) return

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .eq("id", userId)
          .single()

        if (profileError) throw profileError

        // Fetch manager profile with assignments
        const { data: managerData, error: managerError } = await supabase
          .from("manager_profiles")
          .select(`
            profile_id,
            group_id,
            degree_id,
            groups(id, name),
            degrees(id, name)
          `)
          .eq("profile_id", userId)
          .single()

        if (managerError && managerError.code !== "PGRST116") {
          // PGRST116 is "not found" which is expected if the user hasn't been assigned yet
          throw managerError
        }

        setUser({
          id: profileData.id,
          name: profileData.full_name || "",
          email: profileData.email || "",
          role: profileData.role,
        })

        if (managerData) {
          setCurrentAssignment({
            degreeId: managerData.degree_id || "",
            degreeName: managerData.degrees?.name || "",
            groupId: managerData.group_id || "",
            groupName: managerData.groups?.name || "",
            year: managerData.year || "",
          })

          setNewAssignment({
            degreeId: managerData.degree_id || "",
            groupId: managerData.group_id || "",
            year: managerData.year || "",
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [institution?.id, userId, supabase, toast])

  // Fetch degrees, groups, and years
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!institution?.id) return

      try {
        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (degreesError) throw degreesError

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, name, degree_id")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (groupsError) throw groupsError

        // Generate years (current year - 5 to current year + 1)
        const currentYear = new Date().getFullYear()
        const yearsList = []
        for (let i = currentYear - 5; i <= currentYear + 1; i++) {
          yearsList.push(i.toString())
        }

        setDegrees(degreesData)
        setGroups(groupsData)
        setYears(yearsList)
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast({
          title: "Error",
          description: "Failed to load reference data",
          variant: "destructive",
        })
      }
    }

    fetchReferenceData()
  }, [institution?.id, supabase, toast])

  // Filter groups based on selected degree
  useEffect(() => {
    if (newAssignment.degreeId) {
      setFilteredGroups(groups.filter((group) => group.degree_id === newAssignment.degreeId))
    } else {
      setFilteredGroups([])
    }

    // Reset group selection if degree changes
    if (newAssignment.degreeId !== currentAssignment.degreeId) {
      setNewAssignment((prev) => ({
        ...prev,
        groupId: "",
      }))
    }
  }, [newAssignment.degreeId, groups, currentAssignment.degreeId])

  const handleDegreeChange = (value: string) => {
    setNewAssignment((prev) => ({
      ...prev,
      degreeId: value,
    }))
  }

  const handleGroupChange = (value: string) => {
    setNewAssignment((prev) => ({
      ...prev,
      groupId: value,
    }))
  }

  const handleYearChange = (value: string) => {
    setNewAssignment((prev) => ({
      ...prev,
      year: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Check if manager profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from("manager_profiles")
        .select("profile_id")
        .eq("profile_id", userId)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("manager_profiles")
          .update({
            group_id: newAssignment.groupId,
            degree_id: newAssignment.degreeId,
            year: newAssignment.year,
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", userId)

        if (updateError) throw updateError
      } else {
        // Create new profile
        const { error: insertError } = await supabase.from("manager_profiles").insert({
          profile_id: userId,
          group_id: newAssignment.groupId,
          degree_id: newAssignment.degreeId,
          year: newAssignment.year,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) throw insertError
      }

      toast({
        title: "Success",
        description: "Program manager assignment updated successfully",
      })

      // Redirect to user details page
      router.push(`/admin/users/${userId}`)
    } catch (error: any) {
      console.error("Error updating program assignment:", error)
      toast({
        title: "Error",
        description: `Failed to update assignment: ${error.message}`,
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.ADMIN}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href={`/admin/users/${userId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[300px] flex items-center justify-center">
                <p>Loading user data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href={`/admin/users/${userId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Reassign Program Manager</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">Current Assignment</h2>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Degree</Label>
                    <p className="mt-1">{currentAssignment.degreeName || "Not assigned"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Group</Label>
                    <p className="mt-1">{currentAssignment.groupName || "Not assigned"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Year</Label>
                    <p className="mt-1">{currentAssignment.year || "Not assigned"}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h2 className="text-lg font-medium">New Assignment</h2>
                <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="degree">Degree</Label>
                      <Select value={newAssignment.degreeId} onValueChange={handleDegreeChange} required>
                        <SelectTrigger id="degree">
                          <SelectValue placeholder="Select degree" />
                        </SelectTrigger>
                        <SelectContent>
                          {degrees.map((degree) => (
                            <SelectItem key={degree.id} value={degree.id}>
                              {degree.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="group">Group</Label>
                      <Select
                        value={newAssignment.groupId}
                        onValueChange={handleGroupChange}
                        disabled={!newAssignment.degreeId}
                        required
                      >
                        <SelectTrigger id="group">
                          <SelectValue
                            placeholder={newAssignment.degreeId ? "Select group" : "Select a degree first"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Select value={newAssignment.year} onValueChange={handleYearChange} required>
                        <SelectTrigger id="year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.push(`/admin/users/${userId}`)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Assignment"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
