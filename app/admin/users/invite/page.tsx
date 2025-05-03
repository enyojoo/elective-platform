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

export default function InviteManagerPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [degrees, setDegrees] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    degreeId: "",
    programId: "",
  })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

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

        if (degreesError) throw degreesError
        setDegrees(degreesData || [])

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name, code, degree_id")
          .eq("institution_id", institution.id)

        if (programsError) throw programsError
        setPrograms(programsData || [])
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

    fetchData()
  }, [institution, supabase, toast])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = programs.filter((program) => program.degree_id === Number.parseInt(formData.degreeId))
      setFilteredPrograms(filtered)
      // Reset program selection if current selection is not valid for new degree
      if (!filtered.find((p) => p.id === Number.parseInt(formData.programId))) {
        setFormData((prev) => ({ ...prev, programId: "" }))
      }
    } else {
      setFilteredPrograms([])
      setFormData((prev) => ({ ...prev, programId: "" }))
    }
  }, [formData.degreeId, programs, formData.programId])

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
        role: "manager",
        institution_id: institution.id,
        degree_id: formData.degreeId ? Number.parseInt(formData.degreeId) : null,
        program_id: formData.programId ? Number.parseInt(formData.programId) : null,
        is_active: true,
      })

      if (profileError) throw profileError

      // Create manager_profiles record
      const { error: managerError } = await supabase.from("manager_profiles").insert({
        user_id: authData.user?.id,
        degree_id: formData.degreeId ? Number.parseInt(formData.degreeId) : null,
        program_id: formData.programId ? Number.parseInt(formData.programId) : null,
      })

      if (managerError) throw managerError

      toast({
        title: "Success",
        description: "Manager has been invited successfully",
      })

      router.push("/admin/users")
    } catch (error: any) {
      console.error("Error inviting manager:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to invite manager",
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
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.users.inviteManager")}</h1>
          <p className="text-muted-foreground mt-2">{t("admin.users.inviteManagerSubtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("admin.users.managerDetails")}</CardTitle>
            <CardDescription>{t("admin.users.fillManagerDetails")}</CardDescription>
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
                    <Label htmlFor="programId">{t("admin.users.program")}</Label>
                    <Select
                      value={formData.programId}
                      onValueChange={(value) => handleSelectChange("programId", value)}
                      disabled={!formData.degreeId || filteredPrograms.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("admin.users.selectProgram")} />
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
