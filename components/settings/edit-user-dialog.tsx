"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { UserRole } from "@/lib/types"
import { useDataCache } from "@/lib/data-cache-context"

interface EditUserDialogProps {
  isOpen: boolean
  onClose: () => void
  userId: string | null
  onUserUpdated: () => void
  institutionId: string
}

export function EditUserDialog({ isOpen, onClose, userId, onUserUpdated, institutionId }: EditUserDialogProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { invalidateCache } = useDataCache()

  // User data state
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
    status: "active",
  })

  // Student-specific data
  const [studentData, setStudentData] = useState({
    groupId: "",
    year: "",
    degreeId: "",
  })

  // Manager-specific data
  const [managerData, setManagerData] = useState({
    degreeId: "",
    groupId: "",
  })

  // Reference data
  const [degrees, setDegrees] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Generate years array (current year and 9 years back)
  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const yearsArray = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString())
    setYears(yearsArray)
  }, [])

  // Fetch reference data (degrees, groups)
  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!institutionId) return

      try {
        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name, name_ru")
          .eq("institution_id", institutionId)
          .eq("status", "active")

        if (degreesError) throw degreesError
        setDegrees(degreesData || [])

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, name, degree_id")
          .eq("institution_id", institutionId)
          .eq("status", "active")

        if (groupsError) throw groupsError
        setGroups(groupsData || [])
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast({
          title: t("admin.users.error"),
          description: t("admin.users.errorFetchingReferenceData"),
          variant: "destructive",
        })
      }
    }

    if (isOpen && institutionId) {
      fetchReferenceData()
    }
  }, [isOpen, institutionId, t, toast])

  // Fetch user data when dialog opens
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !isOpen) return

      try {
        setIsLoading(true)

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, is_active")
          .eq("id", userId)
          .single()

        if (profileError) throw profileError

        setUserData({
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
          title: t("admin.users.error"),
          description: t("admin.users.errorFetchingUser"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [userId, isOpen, toast, t])

  // Filter groups based on selected degree for student
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
    }
  }, [studentData.degreeId, groups, studentData.groupId])

  // Filter groups based on selected degree for manager
  useEffect(() => {
    if (managerData.degreeId) {
      const filtered = groups.filter((group) => group.degree_id === managerData.degreeId)
      setFilteredGroups(filtered)

      // Reset group selection if current selection is not valid for new degree
      if (!filtered.find((g) => g.id === managerData.groupId)) {
        setManagerData((prev) => ({ ...prev, groupId: "" }))
      }
    } else {
      setFilteredGroups([])
    }
  }, [managerData.degreeId, groups, managerData.groupId])

  const handleInputChange = (field: string, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }))
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
      // Update user profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: userData.name,
          email: userData.email,
          role: userData.role,
          is_active: userData.status === "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userData.id)

      if (updateError) throw updateError

      // Handle student-specific data
      if (userData.role === UserRole.STUDENT) {
        // Check if student profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("student_profiles")
          .select("profile_id")
          .eq("profile_id", userData.id)
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
            .eq("profile_id", userData.id)

          if (updateError) throw updateError
        } else if (studentData.groupId && studentData.year && studentData.degreeId) {
          // Create new profile
          const { error: insertError } = await supabase.from("student_profiles").insert({
            profile_id: userData.id,
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
      if (userData.role === UserRole.PROGRAM_MANAGER) {
        // Check if manager profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("manager_profiles")
          .select("profile_id")
          .eq("profile_id", userData.id)
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
            .eq("profile_id", userData.id)

          if (updateError) throw updateError
        } else if (managerData.groupId && managerData.degreeId) {
          // Create new profile
          const { error: insertError } = await supabase.from("manager_profiles").insert({
            profile_id: userData.id,
            group_id: managerData.groupId,
            degree_id: managerData.degreeId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) throw insertError
        }
      }

      // Invalidate users cache
      if (institutionId) {
        invalidateCache("users", institutionId)
      }

      toast({
        title: t("admin.users.success"),
        description: t("admin.users.userUpdated"),
      })

      // Close dialog and refresh data
      onUserUpdated()
      onClose()
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: t("admin.users.error"),
        description: t("admin.users.errorUpdating"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Get degree name based on ID and language
  const getDegreeName = (degreeId: string) => {
    const degree = degrees.find((d) => d.id === degreeId)
    if (!degree) return ""
    return language === "ru" && degree.name_ru ? degree.name_ru : degree.name
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[550px]"
        onEscapeKeyDown={(e) => {
          e.stopPropagation()
          onClose()
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault()
          onClose()
        }}
        onInteractOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("admin.users.editUser")}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center">{t("admin.users.loading")}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("admin.users.fullName")}</Label>
                <Input
                  id="name"
                  value={userData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("admin.users.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">{t("admin.users.role")}</Label>
                <Select value={userData.role} onValueChange={(value) => handleInputChange("role", value)}>
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
                <Select value={userData.status} onValueChange={(value) => handleInputChange("status", value)}>
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

            {/* Student-specific fields */}
            {userData.role === UserRole.STUDENT && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentDegree">{t("admin.users.degree")}</Label>
                    <Select
                      value={studentData.degreeId}
                      onValueChange={(value) => handleStudentDataChange("degreeId", value)}
                    >
                      <SelectTrigger id="studentDegree">
                        <SelectValue placeholder={t("admin.users.selectDegree")} />
                      </SelectTrigger>
                      <SelectContent>
                        {degrees.map((degree) => (
                          <SelectItem key={degree.id} value={degree.id}>
                            {language === "ru" && degree.name_ru ? degree.name_ru : degree.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentGroup">{t("admin.users.group")}</Label>
                    <Select
                      value={studentData.groupId}
                      onValueChange={(value) => handleStudentDataChange("groupId", value)}
                      disabled={!studentData.degreeId || filteredGroups.length === 0}
                    >
                      <SelectTrigger id="studentGroup">
                        <SelectValue
                          placeholder={
                            !studentData.degreeId
                              ? t("admin.users.selectDegreeFirst")
                              : filteredGroups.length === 0
                                ? t("admin.users.noGroupsAvailable")
                                : t("admin.users.selectGroup")
                          }
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentYear">{t("admin.users.year")}</Label>
                  <Select value={studentData.year} onValueChange={(value) => handleStudentDataChange("year", value)}>
                    <SelectTrigger id="studentYear">
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

            {/* Manager-specific fields */}
            {userData.role === UserRole.PROGRAM_MANAGER && (
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
                        <SelectItem key={degree.id} value={degree.id}>
                          {language === "ru" && degree.name_ru ? degree.name_ru : degree.name}
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
                    disabled={!managerData.degreeId || filteredGroups.length === 0}
                  >
                    <SelectTrigger id="managerGroup">
                      <SelectValue
                        placeholder={
                          !managerData.degreeId
                            ? t("admin.users.selectDegreeFirst")
                            : filteredGroups.length === 0
                              ? t("admin.users.noGroupsAvailable")
                              : t("admin.users.selectGroup")
                        }
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
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                {t("admin.users.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("admin.users.saving") : t("admin.users.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
