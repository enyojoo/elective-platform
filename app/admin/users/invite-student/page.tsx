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
import { Skeleton } from "@/components/ui/skeleton"
import { useDataCache } from "@/lib/data-cache-context"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InviteStudentPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData } = useDataCache()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    programId: "",
    groupId: "",
    year: "",
  })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    if (!institution) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Check cache for degrees
        const cachedDegrees = getCachedData<any[]>("degrees", institution.id.toString())

        if (cachedDegrees) {
          setDegrees(cachedDegrees)
        } else {
          // Fetch degrees
          const { data: degreesData, error: degreesError } = await supabase
            .from("degrees")
            .select("id, name, code")
            .eq("institution_id", institution.id)

          if (degreesError) throw degreesError
          setDegrees(degreesData || [])

          // Cache the degrees
          setCachedData("degrees", institution.id.toString(), degreesData)
        }

        // Check cache for programs
        const cachedPrograms = getCachedData<any[]>("programs", institution.id.toString())

        if (cachedPrograms) {
          setPrograms(cachedPrograms)
        } else {
          // Fetch programs
          const { data: programsData, error: programsError } = await supabase
            .from("programs")
            .select("id, name, code, degree_id")
            .eq("institution_id", institution.id)

          if (programsError) throw programsError
          setPrograms(programsData || [])

          // Cache the programs
          setCachedData("programs", institution.id.toString(), programsData)
        }

        // Check cache for groups
        const cachedGroups = getCachedData<any[]>("groups", institution.id.toString())

        if (cachedGroups) {
          setGroups(cachedGroups)
        } else {
          // Fetch groups
          const { data: groupsData, error: groupsError } = await supabase
            .from("groups")
            .select("id, name, program_id")
            .eq("institution_id", institution.id)

          if (groupsError) throw groupsError
          setGroups(groupsData || [])

          // Cache the groups
          setCachedData("groups", institution.id.toString(), groupsData)
        }

        // Generate years (current year - 5 to current year + 1)
        const currentYear = new Date().getFullYear()
        const yearsList = []
        for (let i = currentYear - 5; i <= currentYear + 1; i++) {
          yearsList.push(i.toString())
        }
        setYears(yearsList)
      } catch (error: any) {
        console.error("Error fetching data:", error)
        setError(error.message || "Failed to load form data")
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
  }, [institution, supabase, toast, getCachedData, setCachedData])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = programs.filter((program) => program.degree_id === Number.parseInt(formData.degreeId))
      setFilteredPrograms(filtered)
      // Reset program selection if current selection is not valid for new degree
      if (!filtered.find((p) => p.id === Number.parseInt(formData.programId))) {
        setFormData((prev) => ({ ...prev, programId: "", groupId: "" }))
        setFilteredGroups([])
      }
    } else {
      setFilteredPrograms([])
      setFormData((prev) => ({ ...prev, programId: "", groupId: "" }))
      setFilteredGroups([])
    }
  }, [formData.degreeId, programs, formData.programId])

  // Filter groups based on selected program
  useEffect(() => {
    if (formData.programId) {
      const filtered = groups.filter((group) => group.program_id === Number.parseInt(formData.programId))
      setFilteredGroups(filtered)
      // Reset group selection if current selection is not valid for new program
      if (!filtered.find((g) => g.id === Number.parseInt(formData.groupId))) {
        setFormData((prev) => ({ ...prev, groupId: "" }))
      }
    } else {
      setFilteredGroups([])
      setFormData((prev) => ({ ...prev, groupId: "" }))
    }
  }, [formData.programId, groups, formData.groupId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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
        program_id: formData.programId ? Number.parseInt(formData.programId) : null,
        group_id: formData.groupId ? Number.parseInt(formData.groupId) : null,
        year: formData.year,
        is_active: true,
      })

      if (profileError) throw profileError

      // Create student_profiles record
      const { error: studentError } = await supabase.from("student_profiles").insert({
        user_id: authData.user?.id,
        degree_id: formData.degreeId ? Number.parseInt(formData.degreeId) : null,
        program_id: formData.programId ? Number.parseInt(formData.programId) : null,
        group_id: formData.groupId ? Number.parseInt(formData.groupId) : null,
        enrollment_year: formData.year,
      })

      if (studentError) throw studentError

      toast({
        title: "Success",
        description: "Student has been invited successfully",
      })

      router.push("/admin/users")
    } catch (error: any) {
      console.error("Error inviting student:", error)
      setError(error.message || "Failed to invite student")
      toast({
        title: "Error",
        description: error.message || "Failed to invite student",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.users.inviteStudent")}</h1>
          <p className="text-muted-foreground mt-2">{t("admin.users.inviteStudentSubtitle")}</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                      disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="degreeId">{t("admin.users.degree")}</Label>
                    {isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={formData.degreeId}
                        onValueChange={(value) => handleSelectChange("degreeId", value)}
                        disabled={isSubmitting}
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
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="programId">{t("admin.users.program")}</Label>
                    {isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={formData.programId}
                        onValueChange={(value) => handleSelectChange("programId", value)}
                        disabled={isSubmitting || !formData.degreeId || filteredPrograms.length === 0}
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
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="groupId">{t("admin.users.group")}</Label>
                    {isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={formData.groupId}
                        onValueChange={(value) => handleSelectChange("groupId", value)}
                        disabled={isSubmitting || !formData.programId || filteredGroups.length === 0}
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
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">{t("admin.users.enrollmentYear")}</Label>
                    {isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <Select
                        value={formData.year}
                        onValueChange={(value) => handleSelectChange("year", value)}
                        disabled={isSubmitting}
                      >
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
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSubmitting}>
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
