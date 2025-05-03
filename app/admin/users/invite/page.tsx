"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"

export default function InviteManagerPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()
  const currentYear = new Date().getFullYear()

  const [degrees, setDegrees] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const [years, setYears] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: "manager", // Using the actual role value in the database
    degreeId: "",
    programId: "",
    enrollmentYear: currentYear.toString(),
    sendInvitation: true,
  })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Fetch degrees, programs, and academic years
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
            enrollmentYear: uniqueYears[0] || currentYear.toString(),
          }))
        } else {
          // If no years in database, use current year
          setYears([currentYear.toString()])
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
  }, [institution, supabase, toast, currentYear])

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
        }))
      }
    } else {
      setFilteredPrograms([])
    }
  }, [formData.degreeId, programs, formData.programId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
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
        role: formData.role,
        degree_id: formData.degreeId ? Number.parseInt(formData.degreeId) : null,
        program_id: formData.programId ? Number.parseInt(formData.programId) : null,
        year: formData.enrollmentYear,
        is_active: true,
      })

      if (profileError) throw profileError

      // 3. Send password reset email if sendInvitation is true
      if (formData.sendInvitation) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        })

        if (resetError) throw resetError
      }

      const degree = degrees.find((d) => d.id.toString() === formData.degreeId)
      const program = programs.find((p) => p.id.toString() === formData.programId)

      toast({
        title: "Invitation sent",
        description: `${formData.name} has been invited to manage ${degree?.name || ""} in ${program?.name || ""} for enrollment year ${formData.enrollmentYear}.`,
      })

      router.push("/admin/users")
    } catch (error: any) {
      console.error("Error inviting manager:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate enrollment years if none from database
  const enrollmentYears =
    years.length > 0 ? years : Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.users.inviteManagerTitle")}</h1>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("admin.users.fullName")}</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder={t("admin.users.fullName")}
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading || isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("admin.users.emailAddress")}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("admin.users.emailAddress")}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading || isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Program Assignment */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">{t("admin.users.degree")}</Label>
                    <Select
                      value={formData.degreeId}
                      onValueChange={(value) => handleSelectChange("degreeId", value)}
                      required
                      disabled={isLoading || isSubmitting || degrees.length === 0}
                    >
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
                    <Label htmlFor="program">{t("admin.users.program")}</Label>
                    <Select
                      value={formData.programId}
                      onValueChange={(value) => handleSelectChange("programId", value)}
                      disabled={!formData.degreeId || isLoading || isSubmitting || filteredPrograms.length === 0}
                      required
                    >
                      <SelectTrigger>
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
                      onValueChange={(value) => handleSelectChange("enrollmentYear", value)}
                      required
                      disabled={isLoading || isSubmitting}
                    >
                      <SelectTrigger>
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
              </div>

              {/* Invitation Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitation"
                    checked={formData.sendInvitation}
                    onCheckedChange={handleCheckboxChange}
                    disabled={isLoading || isSubmitting}
                  />
                  <Label htmlFor="sendInvitation">{t("admin.users.sendEmailInvitation")}</Label>
                </div>

                {formData.sendInvitation && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {t("admin.users.emailInvitationInfo").replace("{0}", formData.email || t("admin.users.manager"))}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.push("/admin/users")}
                disabled={isSubmitting}
              >
                {t("admin.users.cancel")}
              </Button>
              <Button type="submit" disabled={isLoading || isSubmitting}>
                {isSubmitting ? (
                  t("admin.users.sending")
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("admin.users.inviteManagerButton")}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
