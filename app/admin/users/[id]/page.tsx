"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { useInstitution } from "@/lib/institution-context"

export default function UserEditPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id
  const isNewUser = userId === "new"
  const { toast } = useToast()
  const { institution } = useInstitution()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    role: UserRole.STUDENT,
    status: "active",
  })

  const [studentData, setStudentData] = useState({
    groupId: "",
    enrollmentYear: "",
  })

  const [managerData, setManagerData] = useState({
    degreeId: "",
    programId: "",
    academicYearId: "",
  })

  const [degrees, setDegrees] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])

  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [filteredYears, setFilteredYears] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch reference data (degrees, programs, academic years, groups)
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

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name, degree_id")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (programsError) throw programsError

        // Fetch academic years
        const { data: yearsData, error: yearsError } = await supabase
          .from("academic_years")
          .select("id, year, program_id")
          .eq("institution_id", institution.id)
          .eq("is_active", true)

        if (yearsError) throw yearsError

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, name, display_name, program_id, academic_year_id")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (groupsError) throw groupsError

        setDegrees(degreesData)
        setPrograms(programsData)
        setAcademicYears(yearsData)
        setGroups(groupsData)
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

  // Fetch user data if editing existing user
  useEffect(() => {
    const fetchUserData = async () => {
      if (isNewUser || !institution?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, is_active")
          .eq("id", userId)
          .single()

        if (profileError) throw profileError

        setUser({
          id: profileData.id,
          name: profileData.full_name || "",
          email: profileData.email || "",
          role: profileData.role,
          status: profileData.is_active ? "active" : "inactive",
        })

        // If student, fetch student profile
        if (profileData.role === UserRole.STUDENT) {
          const { data: studentProfile, error: studentError } = await supabase
            .from("student_profiles")
            .select("group_id, enrollment_year")
            .eq("profile_id", userId)
            .maybeSingle()

          if (studentError && studentError.code !== "PGRST116") throw studentError

          if (studentProfile) {
            setStudentData({
              groupId: studentProfile.group_id || "",
              enrollmentYear: studentProfile.enrollment_year || "",
            })
          }
        }

        // If manager, fetch manager profile
        if (profileData.role === UserRole.PROGRAM_MANAGER) {
          const { data: managerProfile, error: managerError } = await supabase
            .from("manager_profiles")
            .select("program_id, degree_id, academic_year_id")
            .eq("profile_id", userId)
            .maybeSingle()

          if (managerError && managerError.code !== "PGRST116") throw managerError

          if (managerProfile) {
            setManagerData({
              degreeId: managerProfile.degree_id || "",
              programId: managerProfile.program_id || "",
              academicYearId: managerProfile.academic_year_id || "",
            })
          }
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
  }, [isNewUser, userId, institution?.id, supabase, toast])

  // Filter programs based on selected degree
  useEffect(() => {
    if (managerData.degreeId) {
      setFilteredPrograms(programs.filter((program) => program.degree_id === managerData.degreeId))
    } else {
      setFilteredPrograms([])
    }
  }, [managerData.degreeId, programs])

  // Filter academic years based on selected program
  useEffect(() => {
    if (managerData.programId) {
      setFilteredYears(academicYears.filter((year) => year.program_id === managerData.programId))
    } else {
      setFilteredYears([])
    }
  }, [managerData.programId, academicYears])

  // Filter groups based on selected program and academic year
  useEffect(() => {
    if (studentData.groupId) {
      // Find the current group to get its program and academic year
      const currentGroup = groups.find((group) => group.id === studentData.groupId)
      if (currentGroup) {
        // Find all groups with the same program and academic year
        setFilteredGroups(
          groups.filter(
            (group) =>
              group.program_id === currentGroup.program_id && group.academic_year_id === currentGroup.academic_year_id,
          ),
        )
      }
    } else {
      setFilteredGroups([])
    }
  }, [studentData.groupId, groups])

  const handleInputChange = (field: string, value: string | number) => {
    setUser((prev) => ({ ...prev, [field]: value }))
  }

  const handleStudentDataChange = (field: string, value: string) => {
    setStudentData((prev) => ({ ...prev, [field]: value }))
  }

  const handleManagerDataChange = (field: string, value: string) => {
    setManagerData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (isNewUser) {
        // Create new user logic
        // This would involve creating an auth user and a profile
        toast({
          title: "Not Implemented",
          description: "Creating new users via this interface is not yet implemented",
          variant: "destructive",
        })
        return
      }

      // Update existing user
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.status === "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Handle student-specific data
      if (user.role === UserRole.STUDENT) {
        // Check if student profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("student_profiles")
          .select("profile_id")
          .eq("profile_id", user.id)
          .maybeSingle()

        if (checkError) throw checkError

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("student_profiles")
            .update({
              group_id: studentData.groupId,
              enrollment_year: studentData.enrollmentYear,
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", user.id)

          if (updateError) throw updateError
        } else if (studentData.groupId && studentData.enrollmentYear) {
          // Create new profile
          const { error: insertError } = await supabase.from("student_profiles").insert({
            profile_id: user.id,
            group_id: studentData.groupId,
            enrollment_year: studentData.enrollmentYear,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) throw insertError
        }
      }

      // Handle manager-specific data
      if (user.role === UserRole.PROGRAM_MANAGER) {
        // Check if manager profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("manager_profiles")
          .select("profile_id")
          .eq("profile_id", user.id)
          .maybeSingle()

        if (checkError) throw checkError

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("manager_profiles")
            .update({
              program_id: managerData.programId,
              degree_id: managerData.degreeId,
              academic_year_id: managerData.academicYearId,
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", user.id)

          if (updateError) throw updateError
        } else if (managerData.programId && managerData.degreeId && managerData.academicYearId) {
          // Create new profile
          const { error: insertError } = await supabase.from("manager_profiles").insert({
            profile_id: user.id,
            program_id: managerData.programId,
            degree_id: managerData.degreeId,
            academic_year_id: managerData.academicYearId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) throw insertError
        }
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      // Redirect to users list
      router.push("/admin/users")
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: `Failed to save user: ${error.message}`,
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
            <Link href="/admin/users">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] flex items-center justify-center">
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
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNewUser ? "Create New User" : `Edit User: ${user.name}`}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select value={user.role} onValueChange={(value) => handleInputChange("role", value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                      <SelectItem value={UserRole.PROGRAM_MANAGER}>Program Manager</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={user.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {user.role === UserRole.STUDENT && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="group">Group</Label>
                    <Select
                      value={studentData.groupId}
                      onValueChange={(value) => handleStudentDataChange("groupId", value)}
                    >
                      <SelectTrigger id="group">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name} ({group.display_name})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enrollmentYear">Enrollment Year</Label>
                    <Select
                      value={studentData.enrollmentYear}
                      onValueChange={(value) => handleStudentDataChange("enrollmentYear", value)}
                    >
                      <SelectTrigger id="enrollmentYear">
                        <SelectValue placeholder="Select enrollment year" />
                      </SelectTrigger>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.year}>
                            {year.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {user.role === UserRole.PROGRAM_MANAGER && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerDegree">Degree</Label>
                    <Select
                      value={managerData.degreeId}
                      onValueChange={(value) => handleManagerDataChange("degreeId", value)}
                    >
                      <SelectTrigger id="managerDegree">
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
                    <Label htmlFor="managerProgram">Program</Label>
                    <Select
                      value={managerData.programId}
                      onValueChange={(value) => handleManagerDataChange("programId", value)}
                      disabled={!managerData.degreeId}
                    >
                      <SelectTrigger id="managerProgram">
                        <SelectValue placeholder={managerData.degreeId ? "Select program" : "Select a degree first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPrograms.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerYear">Academic Year</Label>
                    <Select
                      value={managerData.academicYearId}
                      onValueChange={(value) => handleManagerDataChange("academicYearId", value)}
                      disabled={!managerData.programId}
                    >
                      <SelectTrigger id="managerYear">
                        <SelectValue placeholder={managerData.programId ? "Select year" : "Select a program first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
              Cancel
            </Button>

            <div className="flex gap-2">
              {!isNewUser && (
                <Button variant="destructive" type="button">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              )}

              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : isNewUser ? "Create User" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
