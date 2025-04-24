"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// Add the GraduationCap icon to the imports from lucide-react
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// First, import the useLanguage hook at the top of the file with the other imports
import { useLanguage } from "@/lib/language-context"

// Mock programs data
const mockPrograms = [
  { id: 1, name: "Master in Management", code: "MiM" },
  { id: 2, name: "Master in Business Analytics", code: "MiBA" },
  { id: 3, name: "Master in Corporate Finance", code: "MiCF" },
  { id: 4, name: "Bachelor in Management", code: "BM" },
]

// Course status options
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
]

// Then, inside the NewCoursePage component, add the useLanguage hook after the useState declarations
export default function NewCoursePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [programs, setPrograms] = useState(mockPrograms)
  const { t } = useLanguage()
  const [course, setCourse] = useState({
    nameEn: "",
    nameRu: "",
    programId: "",
    instructorEn: "",
    instructorRu: "",
    descriptionEn: "",
    descriptionRu: "",
    status: "active", // Default status
  })

  // Fetch programs (simulated)
  useEffect(() => {
    // In a real app, this would be an API call
    setPrograms(mockPrograms)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCourse((prev) => ({ ...prev, [name]: value }))
  }

  const handleProgramChange = (value: string) => {
    setCourse((prev) => ({ ...prev, programId: value }))
  }

  const handleStatusChange = (value: string) => {
    setCourse((prev) => ({ ...prev, status: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to courses page after successful submission
      router.push("/admin/courses")
    } catch (error) {
      console.error("Error creating course:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update the JSX to use the translation keys
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.newCourse.title")}</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t("admin.newCourse.nameEn")}</Label>
                  <Input
                    id="nameEn"
                    name="nameEn"
                    placeholder="Strategic Management"
                    value={course.nameEn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameRu">{t("admin.newCourse.nameRu")}</Label>
                  <Input
                    id="nameRu"
                    name="nameRu"
                    placeholder="Стратегический менеджмент"
                    value={course.nameRu}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="programId">{t("admin.newCourse.program")}</Label>
                  <Select value={course.programId} onValueChange={handleProgramChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.newCourse.selectProgram")} />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("admin.newCourse.status")}</Label>
                  <Select value={course.status} onValueChange={handleStatusChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.newCourse.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`admin.courses.${option.value}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="instructorEn">{t("admin.newCourse.instructorEn")}</Label>
                  <Input
                    id="instructorEn"
                    name="instructorEn"
                    placeholder="Prof. John Smith"
                    value={course.instructorEn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructorRu">{t("admin.newCourse.instructorRu")}</Label>
                  <Input
                    id="instructorRu"
                    name="instructorRu"
                    placeholder="Проф. Иван Смирнов"
                    value={course.instructorRu}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t("admin.newCourse.descriptionEn")}</Label>
                  <Textarea
                    id="descriptionEn"
                    name="descriptionEn"
                    placeholder={t("admin.newCourse.courseDescEn")}
                    value={course.descriptionEn}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionRu">{t("admin.newCourse.descriptionRu")}</Label>
                  <Textarea
                    id="descriptionRu"
                    name="descriptionRu"
                    placeholder={t("admin.newCourse.courseDescRu")}
                    value={course.descriptionRu}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/courses")}>
                  {t("admin.newCourse.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("admin.newCourse.creating") : t("admin.newCourse.create")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
