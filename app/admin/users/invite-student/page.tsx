"use client"

import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Send } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"

export default function InviteStudentPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    degreeId: "",
    programId: "",
    groupId: "",
    enrollmentYear: new Date().getFullYear().toString(),
    sendInvitation: true,
  })

  const [degrees, setDegrees] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Fetch degrees, programs, groups, and academic years
  useEffect(() => {
    if (!institution) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name, code")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (degreesError) throw degreesError
        setDegrees(degreesData || [])

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name, code, degree_id")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (programsError) throw programsError
        setPrograms(programsData || [])

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, name, degree_id, program_id, year")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (groupsError) throw groupsError
        setGroups(groupsData || [])

        // Fetch academic years
        const { data: yearsData, error: yearsError } = await supabase
          .from("academic_years")
          .select("year")
          .eq("institution_id", institution.id)
          .eq("is_active", true)
          .order("year", { ascending: false })

        if (yearsError) throw yearsError

        if (yearsData && yearsData.length > 0) {
          const uniqueYears = [...new Set(yearsData.map((y) => y.year))]
          setYears(uniqueYears)
          // Set default year to the most recent one
          setFormData((prev) => ({
            ...prev,
            enrollmentYear: uniqueYears[0] || new Date().getFullYear().toString(),
          }))
        } else {
          // If no years in database, use current year
          setYears([new Date().getFullYear().toString()])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [institution, supabase, toast])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = programs.filter((program) => program.degree_id.toString() === formData.degreeId)
      setFilteredPrograms(filtered)

      // Reset program selection if the current selection is not valid for the new degree
      if (!filtered.some((p) => p.id.toString() === formData.programId)) {
        setFormData((prev) => ({
          ...prev,
          programId: "",
          groupId: "", // Also reset group when program changes
        }))
      }
    } else {
      setFilteredPrograms([])
      setFormData((prev) => ({
        ...prev,
        programId: "",
        groupId: "",
      }))
    }
  }, [formData.degreeId, programs, formData.programId])

  // Filter groups based on selected degree, program, and year
  useEffect(() => {
    let filtered = groups

    if (formData.degreeId) {
      filtered = filtered.filter((g) => g.degree_id.toString() === formData.degreeId)
    }

    if (formData.programId) {
      filtered = filtered.filter((g) => g.program_id.toString() === formData.programId)
    }

    if (formData.enrollmentYear) {
      filtered = filtered.filter((g) => g.year === formData.enrollmentYear)
    }

    setFilteredGroups(filtered)

    // Reset group selection if the current selection is not valid for the new filters
    if (!filtered.some((g) => g.id.toString() === formData.groupId)) {
      setFormData((prev) => ({
        ...prev,
        groupId: "",
      }))
    }
  }, [formData.degreeId, formData.programId, formData.enrollmentYear, formData.groupId, groups])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      sendInvitation: checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!institution) throw new Error("Institution not found")

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: formData.name,
        },
      })

      if (authError) throw authError

      // 2. Create profile in profiles table
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        institution_id: institution.id,
        full_name: formData.name,
        email: formData.email,
        role: "student",
        degree_id: formData.degreeId ? Number.parseInt(formData.degreeId) : null,
        program_id: formData.programId ? Number.parseInt(formData.programId) : null,
        year: formData.enrollmentYear,
        group_id: formData.groupId ? Number.parseInt(formData.groupId) : null,
        is_active: true,
      })

      if (profileError) throw profileError

      // 3. Send password reset email if sendInvitation is true
      if (formData.sendInvitation) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/student/reset-password`,
        })

        if (resetError) throw resetError
      }

      toast({
        title: "Student Invited",
        description: `${formData.name} has been successfully invited.`,
      })

      router.push("/admin/users")
    } catch (error: any) {
      console.error("Error inviting student:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to invite student. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate enrollment years if none from database
  const currentYear = new Date().getFullYear()
  const enrollmentYears =
    years.length > 0 ? years : Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.users.inviteStudentTitle")}</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("admin.users.fullName")}</Label>
                  <Input
                    id="name"
                    placeholder={t("admin.users.fullName")}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    disabled={isLoading || isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("admin.users.emailAddress")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("admin.users.emailAddress")}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    disabled={isLoading || isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">{t("admin.users.degree")}</Label>
                  <Select
                    value={formData.degreeId}
                    onValueChange={(value) => handleInputChange("degreeId", value)}
                    disabled={isLoading || isSubmitting || degrees.length === 0}
                  >
                    <SelectTrigger id="degree">
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
                  <Label htmlFor="program">{t("admin.users.program")}</Label>
                  <Select
                    value={formData.programId}
                    onValueChange={(value) => handleInputChange("programId", value)}
                    disabled={!formData.degreeId || isLoading || isSubmitting || filteredPrograms.length === 0}
                  >
                    <SelectTrigger id="program">
                      <SelectValue
                        placeholder={
                          formData.degreeId ? t("admin.users.selectProgram") : t("admin.users.selectDegreeFirst")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPrograms.map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enrollmentYear">{t("admin.users.enrollmentYear")}</Label>
                  <Select
                    value={formData.enrollmentYear}
                    onValueChange={(value) => handleInputChange("enrollmentYear", value)}
                    disabled={isLoading || isSubmitting}
                  >
                    <SelectTrigger id="enrollmentYear">
                      <SelectValue placeholder={t("admin.users.selectYear")} />
                    </SelectTrigger>
                    <SelectContent>
                      {enrollmentYears.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group">{t("admin.users.group")}</Label>
                <Select
                  value={formData.groupId}
                  onValueChange={(value) => handleInputChange("groupId", value)}
                  disabled={
                    !formData.degreeId ||
                    !formData.programId ||
                    !formData.enrollmentYear ||
                    isLoading ||
                    isSubmitting ||
                    filteredGroups.length === 0
                  }
                >
                  <SelectTrigger id="group">
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
                {formData.degreeId && formData.programId && formData.enrollmentYear && filteredGroups.length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">{t("admin.users.noGroupsAvailable")}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitation"
                    checked={formData.sendInvitation}
                    onCheckedChange={(checked) => handleCheckboxChange(!!checked)}
                    disabled={isLoading || isSubmitting}
                  />
                  <Label htmlFor="sendInvitation">{t("admin.users.sendStudentInvitation")}</Label>
                </div>

                {formData.sendInvitation && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {t("admin.users.studentEmailInfo").replace("{0}", formData.email || t("admin.users.student"))}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/users")} disabled={isSubmitting}>
              {t("admin.users.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? (
                t("admin.users.sending")
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t("admin.users.sendInvitation")}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
