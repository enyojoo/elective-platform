"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"
import { FormSkeleton } from "@/components/ui/page-skeleton"

export default function InviteStudentPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [degrees, setDegrees] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    degreeId: "",
    groupId: "",
    year: "",
  })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch degrees
      const { data: degreesData, error: degreesError } = await supabase
        .from("degrees")
        .select("id, name, code")
        .eq("institution_id", institution.id)

      if (degreesError) throw degreesError
      setDegrees(degreesData || [])

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, name, degree_id")
        .eq("institution_id", institution.id)

      if (groupsError) throw groupsError
      setGroups(groupsData || [])

      // Generate years (current year - 5 to current year + 1)
      const currentYear = new Date().getFullYear()
      const yearsList = []
      for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        yearsList.push(i.toString())
      }
      setYears(yearsList)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!institution) return

    fetchData()
  }, [institution, supabase, toast])

  // Filter groups based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = groups.filter((group) => group.degree_id === Number.parseInt(formData.degreeId))
      setFilteredGroups(filtered)
      // Reset group selection if current selection is not valid for new degree
      if (!filtered.find((g) => g.id === Number.parseInt(formData.groupId))) {
        setFormData((prev) => ({ ...prev, groupId: "" }))
      }
    } else {
      setFilteredGroups([])
      setFormData((prev) => ({ ...prev, groupId: "" }))
    }
  }, [formData.degreeId, groups, formData.groupId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!institution) {
      toast({
        title: "Error",
        description: "Institution information is missing",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + "A1!"

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
      })

      if (authError) throw authError

      // Create profile record
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user?.id,
        email: formData.email,
        full_name: formData.fullName,
        role: "student",
        institution_id: institution.id,
        degree_id: formData.degreeId ? Number.parseInt(formData.degreeId) : null,
        group_id: formData.groupId ? Number.parseInt(formData.groupId) : null,
        year: formData.year,
        is_active: true,
      })

      if (profileError) throw profileError

      // Create student_profiles record
      const { error: studentError } = await supabase.from("student_profiles").insert({
        user_id: authData.user?.id,
        degree_id: formData.degreeId ? Number.parseInt(formData.degreeId) : null,
        group_id: formData.groupId ? Number.parseInt(formData.groupId) : null,
        year: formData.year,
      })

      if (studentError) throw studentError

      toast({
        title: "Success",
        description: "Student has been invited successfully",
      })

      router.push("/admin/users")
    } catch (error: any) {
      console.error("Error inviting student:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to invite student",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.ADMIN}>
        <FormSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.users.inviteStudent")}</h1>
          <p className="text-muted-foreground mt-2">{t("admin.users.inviteStudentSubtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.users.studentDetails")}</CardTitle>
            <CardDescription>{t("admin.users.fillStudentDetails")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t("admin.users.fullName")}</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder={t("admin.users.fullNamePlaceholder")}
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("admin.users.email")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("admin.users.emailPlaceholder")}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="degreeId">{t("admin.users.degree")}</Label>
                    <Select value={formData.degreeId} onValueChange={(value) => handleSelectChange("degreeId", value)}>
                      <SelectTrigger>
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
                      value={formData.groupId}
                      onValueChange={(value) => handleSelectChange("groupId", value)}
                      disabled={!formData.degreeId || filteredGroups.length === 0}
                    >
                      <SelectTrigger>
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
                  <Select value={formData.year} onValueChange={(value) => handleSelectChange("year", value)}>
                    <SelectTrigger>
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
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  {t("admin.users.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("admin.users.inviting") : t("admin.users.invite")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
