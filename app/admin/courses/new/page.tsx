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
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useDataCache } from "@/lib/data-cache-context"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"

// Course status options
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
]

export default function NewCoursePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true)
  const [programs, setPrograms] = useState<any[]>([])
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const { institution } = useInstitution()

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

  // Fetch programs with caching
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!institution?.id) return

      // Try to get programs from cache
      const cachedPrograms = getCachedData<any[]>("programs", institution.id)

      if (cachedPrograms) {
        setPrograms(cachedPrograms)
        setIsLoadingPrograms(false)
        return
      }

      try {
        // Fetch programs from Supabase
        const { data, error } = await supabase
          .from("programs")
          .select("*")
          .eq("institution_id", institution.id)
          .order("name_en")

        if (error) {
          throw error
        }

        // Update state and cache
        setPrograms(data || [])
        setCachedData("programs", institution.id, data)
      } catch (error) {
        console.error("Error fetching programs:", error)
        toast({
          title: t("admin.programs.fetchError", "Failed to fetch programs"),
          description: t(
            "admin.programs.fetchErrorDesc",
            "There was an error fetching the programs. Please try again.",
          ),
          variant: "destructive",
        })
      } finally {
        setIsLoadingPrograms(false)
      }
    }

    fetchPrograms()
  }, [institution?.id, getCachedData, setCachedData, supabase, toast, t])

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
      if (!institution?.id) {
        throw new Error("Institution ID is required")
      }

      // Prepare course data
      const courseData = {
        name_en: course.nameEn,
        name_ru: course.nameRu,
        program_id: course.programId,
        instructor_en: course.instructorEn,
        instructor_ru: course.instructorRu,
        description_en: course.descriptionEn,
        description_ru: course.descriptionRu,
        status: course.status,
        institution_id: institution.id,
      }

      // Insert the course into the database
      const { data, error } = await supabase.from("courses").insert([courseData]).select()

      if (error) {
        throw error
      }

      // Invalidate the courses cache
      invalidateCache("courses", institution.id)

      // Show success toast
      toast({
        title: t("admin.courses.createSuccess", "Course created successfully"),
        description: t("admin.courses.createSuccessDesc", "The course has been added to your institution."),
      })

      // Redirect to courses page after successful submission
      router.push("/admin/courses")
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: t("admin.courses.createError", "Failed to create course"),
        description: t("admin.courses.createErrorDesc", "There was an error creating the course. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
                  {isLoadingPrograms ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={course.programId} onValueChange={handleProgramChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("admin.newCourse.selectProgram")} />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("admin.newCourse.creating")}
                    </>
                  ) : (
                    t("admin.newCourse.create")
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
