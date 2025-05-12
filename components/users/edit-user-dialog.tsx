"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { useInstitution } from "@/lib/institution-context"
import { useTranslation } from "react-i18next"
import { useDataCache } from "@/lib/data-cache-context"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Save } from "lucide-react"

interface EditUserDialogProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  onUserUpdated: () => void
}

export function EditUserDialog({ isOpen, onClose, userId, onUserUpdated }: EditUserDialogProps) {
  const { toast } = useToast()
  const { institution } = useInstitution()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { t } = useTranslation()
  const { invalidateCache } = useDataCache()
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString())

  // Initialize all state variables with default values
  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    role: UserRole.STUDENT,
    status: "active",
  })

  const [studentData, setStudentData] = useState({
    groupId: "",
    year: "",
    degreeId: "",
  })

  const [managerData, setManagerData] = useState({
    degreeId: "",
    groupId: "",
  })

  const [degrees, setDegrees] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Fetch reference data (degrees, groups)
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
          .select("id, name, degree_id, display_name")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (groupsError) throw groupsError

        setDegrees(degreesData || [])
        setGroups(groupsData || [])
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast({
          title: "Error",
          description: "Failed to load reference data",
          variant: "destructive",
        })
      }
    }

    if (isOpen) {
      fetchReferenceData()
    }
  }, [institution?.id, supabase, toast, isOpen])

  // Fetch user data when dialog opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !institution?.id || !isOpen) return

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
            .select("group_id, year, degree_id")
            .eq("profile_id", userId)
            .maybeSingle()

          if (studentError && studentError.code !== "PGRST116") throw studentError

          if (studentProfile) {
            setStudentData({
              groupId: studentProfile.group_id || "",
              year: studentProfile.year || "",
              degreeId: studentProfile.degree_id || "",
            })
          }
        }

        // If manager, fetch manager profile
        if (profileData.role === UserRole.PROGRAM_MANAGER) {
          const { data: managerProfile, error: managerError } = await supabase
            .from("manager_profiles")
            .select("group_id, degree_id")
            .eq("profile_id", userId)
            .maybeSingle()

          if (managerError && managerError.code !== "PGRST116") throw managerError

          if (managerProfile) {
            setManagerData({
              degreeId: managerProfile.degree_id || "",
              groupId: managerProfile.group_id || "",
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
      }
    }

    fetchUserData()
  }, [userId, institution?.id, supabase, toast, isOpen])

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setUser({
        id: "",
        name: "",
        email: "",
        role: UserRole.STUDENT,
        status: "active",
      })
      setStudentData({
        groupId: "",
        year: "",
        degreeId: "",
      })
      setManagerData({
        degreeId: "",
        groupId: "",
      })
    }
  }, [isOpen])

  // Filter groups based on selected degree
  useEffect(() => {
    if (studentData.degreeId) {
      const filtered = groups.filter((group) => group.degree_id === studentData.degreeId)
      setFilteredGroups(filtered)
      // Reset group selection if current selection is not valid for new degree
      if (!filtered.find((g) => g.id === studentData.groupId)) {
        setStudentData((prev) => ({ ...prev, groupId: "" }))
      }
    } else {
      setFilteredGroups([])
      setStudentData((prev) => ({ ...prev, groupId: "" }))
    }
  }, [studentData.degreeId, groups, studentData.groupId])

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
              year: studentData.year,
              degree_id: studentData.degreeId,
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", user.id)

          if (updateError) throw updateError
        } else if (studentData.groupId && studentData.year && studentData.degreeId) {
          // Create new profile
          const { error: insertError } = await supabase.from("student_profiles").insert({
            profile_id: user.id,
            group_id: studentData.groupId,
            year: studentData.year,
            degree_id: studentData.degreeId,
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
              group_id: managerData.groupId,
              degree_id: managerData.degreeId,
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", user.id)

          if (updateError) throw updateError
        } else if (managerData.groupId && managerData.degreeId) {
          // Create new profile
          const { error: insertError } = await supabase.from("manager_profiles").insert({
            profile_id: user.id,
            group_id: managerData.groupId,
            degree_id: managerData.degreeId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) throw insertError
        }
      }

      // Invalidate the users cache
      if (institution?.id) {
        invalidateCache("users", institution.id)
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      // Call the onUserUpdated callback to refresh the user list
      onUserUpdated()

      // Close the dialog
      onClose()
    } catch (error: any) {
      console.error("Error saving user:", error)
      toast({
        title: "Error",
        description: `Failed to save user: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="sm:max-w-[600px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("admin.users.editUser")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("admin.users.fullName")}</Label>
              <Input id="name" value={user.name} onChange={(e) => handleInputChange("name", e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("admin.users.emailAddress")}</Label>
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
              <Label htmlFor="role">{t("admin.users.userRole")}</Label>
              <Select value={user.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder={t("admin.users.selectRole")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.STUDENT}>{t("admin.users.student")}</SelectItem>
                  <SelectItem value={UserRole.PROGRAM_MANAGER}>{t("admin.users.program_manager")}</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>{t("admin.users.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("admin.users.status")}</Label>
              <Select value={user.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder={t("admin.users.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("admin.users.active")}</SelectItem>
                  <SelectItem value="inactive">{t("admin.users.inactive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {user.role === UserRole.STUDENT && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degreeId">{t("admin.users.degree")}</Label>
                  <Select
                    value={studentData.degreeId}
                    onValueChange={(value) => handleStudentDataChange("degreeId", value)}
                  >
                    <SelectTrigger id="degreeId">
                      <SelectValue placeholder={t("admin.users.selectDegree")} />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((degree) => (
                        <SelectItem key={degree.id} value={degree.id.toString()}>
                          {degree.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupId">{t("admin.users.group")}</Label>
                  <Select
                    value={studentData.groupId}
                    onValueChange={(value) => handleStudentDataChange("groupId", value)}
                    disabled={!studentData.degreeId || filteredGroups.length === 0}
                  >
                    <SelectTrigger id="groupId">
                      <SelectValue placeholder={t("admin.users.selectGroup")} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">{t("admin.users.year")}</Label>
                <Select value={studentData.year} onValueChange={(value) => handleStudentDataChange("year", value)}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder={t("admin.users.selectYear")} />
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
            </>
          )}

          {user.role === UserRole.PROGRAM_MANAGER && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerDegree">{t("admin.users.degree")}</Label>
                <Select
                  value={managerData.degreeId}
                  onValueChange={(value) => handleManagerDataChange("degreeId", value)}
                >
                  <SelectTrigger id="managerDegree">
                    <SelectValue placeholder={t("admin.users.selectDegree")} />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((degree) => (
                      <SelectItem key={degree.id} value={degree.id.toString()}>
                        {degree.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerGroup">{t("admin.users.group")}</Label>
                <Select
                  value={managerData.groupId}
                  onValueChange={(value) => handleManagerDataChange("groupId", value)}
                >
                  <SelectTrigger id="managerGroup">
                    <SelectValue placeholder={t("admin.users.selectGroup")} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              {t("admin.users.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? t("admin.users.saving") : t("admin.users.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
