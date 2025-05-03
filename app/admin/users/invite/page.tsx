"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, type DegreeType, type ProgramType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { getDegrees, getPrograms, inviteManager } from "@/app/actions/user-management"

export default function InviteManagerPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { institution } = useInstitution()
  const currentYear = new Date().getFullYear()

  const [degrees, setDegrees] = useState<DegreeType[]>([])
  const [programs, setPrograms] = useState<ProgramType[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramType[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: UserRole.PROGRAM_MANAGER,
    degreeId: "",
    programId: "",
    enrollmentYear: currentYear.toString(),
    sendInvitation: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch degrees and programs
  useEffect(() => {
    const fetchData = async () => {
      if (!institution?.id) return

      setLoading(true)

      try {
        // Fetch degrees
        const degreesResult = await getDegrees(institution.id.toString())
        if (degreesResult.error) {
          toast({
            title: "Error",
            description: degreesResult.error,
            variant: "destructive",
          })
          return
        }

        setDegrees(degreesResult.degrees || [])

        // Fetch all programs
        const programsResult = await getPrograms(institution.id.toString())
        if (programsResult.error) {
          toast({
            title: "Error",
            description: programsResult.error,
            variant: "destructive",
          })
          return
        }

        setPrograms(programsResult.programs || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [institution?.id])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = programs.filter((program) => program.degree_id === Number(formData.degreeId))
      setFilteredPrograms(filtered)

      // Reset program selection if the current selection is not valid for the new degree
      if (!filtered.some((p) => p.id === Number(formData.programId))) {
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

    if (!institution?.id) {
      toast({
        title: "Error",
        description: "Institution information is missing",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create a FormData object to pass to the server action
      const submitData = new FormData()
      submitData.append("email", formData.email)
      submitData.append("name", formData.name)
      submitData.append("degreeId", formData.degreeId)
      submitData.append("programId", formData.programId)
      submitData.append("enrollmentYear", formData.enrollmentYear)
      submitData.append("sendInvitation", formData.sendInvitation.toString())
      submitData.append("institutionId", institution.id.toString())

      const result = await inviteManager(submitData)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `${formData.name} has been invited as a program manager.`,
      })

      router.push("/admin/users")
    } catch (error) {
      console.error("Error inviting manager:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate enrollment years (from 2021 to current year + 10)
  const enrollmentYears = Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

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
                      disabled={!formData.degreeId}
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
              <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
                {t("admin.users.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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
