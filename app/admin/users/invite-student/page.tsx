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
import { UserRole, type DegreeType, type ProgramType } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"

// Mock degrees data
const mockDegrees: DegreeType[] = [
  { id: 1, name: "Bachelor", code: "BSc" },
  { id: 2, name: "Master", code: "MSc" },
  { id: 3, name: "PhD", code: "PhD" },
]

// Mock programs data
const mockPrograms: ProgramType[] = [
  { id: 1, name: "Management", code: "MGT", degreeId: 1 },
  { id: 2, name: "International Business", code: "IB", degreeId: 1 },
  { id: 3, name: "Management", code: "MGT", degreeId: 2 },
  { id: 4, name: "Business Analytics", code: "BA", degreeId: 2 },
  { id: 5, name: "Corporate Finance", code: "CF", degreeId: 2 },
  { id: 6, name: "Management", code: "MGT", degreeId: 3 },
]

// Replace the InviteStudentPage component with this updated version that uses translations
export default function InviteStudentPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    degreeId: 0,
    programId: 0,
    enrollmentYear: new Date().getFullYear().toString(),
    sendInvitation: true,
  })

  const [degrees, setDegrees] = useState<DegreeType[]>([])
  const [programs, setPrograms] = useState<ProgramType[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramType[]>([])

  // Fetch degrees and programs
  useEffect(() => {
    // In a real app, these would be API calls
    setDegrees(mockDegrees)
    setPrograms(mockPrograms)
  }, [])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      setFilteredPrograms(programs.filter((program) => program.degreeId === formData.degreeId))
    } else {
      setFilteredPrograms([])
    }
  }, [formData.degreeId, programs])

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDegreeChange = (value: string) => {
    const degreeId = Number(value)
    setFormData((prev) => ({
      ...prev,
      degreeId,
      // Reset programId if the current program doesn't belong to the new degree
      programId: programs.some((p) => p.degreeId === degreeId && p.id === prev.programId) ? prev.programId : 0,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would be an API call to invite the student
    console.log("Inviting student:", formData)
    // Redirect to users list
    router.push("/admin/users")
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="degree">{t("admin.users.degree")}</Label>
                  <Select
                    value={formData.degreeId ? formData.degreeId.toString() : ""}
                    onValueChange={handleDegreeChange}
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
                    value={formData.programId ? formData.programId.toString() : ""}
                    onValueChange={(value) => handleInputChange("programId", Number(value))}
                    disabled={!formData.degreeId}
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
                    onCheckedChange={(checked) => handleInputChange("sendInvitation", !!checked)}
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
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              {t("admin.users.sendInvitation")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
