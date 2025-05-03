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
import { getDegrees, getPrograms, getGroups, inviteStudent } from "@/app/actions/user-management"
import { toast } from "@/hooks/use-toast"

interface Group {
  id: number
  name: string
}

export default function InviteStudentPage() {
  const { t } = useLanguage()
  const router = useRouter()
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

  const [degrees, setDegrees] = useState<Array<{ id: number; name: string; code: string }>>([])
  const [programs, setPrograms] = useState<Array<{ id: number; name: string; code: string; degree_id: number }>>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<
    Array<{ id: number; name: string; code: string; degree_id: number }>
  >([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch degrees, programs, and groups
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
          groupId: "",
        }))
      }
    } else {
      setFilteredPrograms([])
    }
  }, [formData.degreeId, programs, formData.programId])

  // Fetch groups when program changes
  useEffect(() => {
    const fetchGroups = async () => {
      if (!formData.programId) {
        setGroups([])
        return
      }

      try {
        const result = await getGroups(Number(formData.programId))
        if (result.error) {
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          })
          return
        }

        setGroups(result.groups || [])

        // Reset group selection if the current selection is not valid for the new program
        if (!result.groups.some((g) => g.id === Number(formData.groupId))) {
          setFormData((prev) => ({
            ...prev,
            groupId: "",
          }))
        }
      } catch (error) {
        console.error("Error fetching groups:", error)
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive",
        })
      }
    }

    fetchGroups()
  }, [formData.programId, formData.groupId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, sendInvitation: checked }))
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
      submitData.append("groupId", formData.groupId)
      submitData.append("enrollmentYear", formData.enrollmentYear)
      submitData.append("sendInvitation", formData.sendInvitation.toString())
      submitData.append("institutionId", institution.id.toString())

      const result = await inviteStudent(submitData)

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
        description: `${formData.name} has been invited as a student.`,
      })

      router.push("/admin/users")
    } catch (error) {
      console.error("Error inviting student:", error)
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
  const currentYear = new Date().getFullYear()
  const enrollmentYears = Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">{t("admin.users.degree")}</Label>
                  <Select
                    value={formData.degreeId}
                    onValueChange={(value) => handleInputChange("degreeId", value)}
                    required
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
                    disabled={!formData.degreeId}
                    required
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
                  <Label htmlFor="group">{t("admin.users.group")}</Label>
                  <Select
                    value={formData.groupId}
                    onValueChange={(value) => handleInputChange("groupId", value)}
                    disabled={!formData.programId}
                    required
                  >
                    <SelectTrigger id="group">
                      <SelectValue
                        placeholder={
                          formData.programId ? t("admin.users.selectGroup") : t("admin.users.selectProgramFirst")
                        }
                      />
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

                <div className="space-y-2">
                  <Label htmlFor="enrollmentYear">{t("admin.users.enrollmentYear")}</Label>
                  <Select
                    value={formData.enrollmentYear}
                    onValueChange={(value) => handleInputChange("enrollmentYear", value)}
                    required
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

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitation"
                    checked={formData.sendInvitation}
                    onCheckedChange={handleCheckboxChange}
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
            <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
              {t("admin.users.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
