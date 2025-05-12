"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useCachedDegrees } from "@/hooks/use-cached-degrees"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"

// Course status options
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
]

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { t, language } = useLanguage()
  const { institution } = useInstitution()

  // Use the cached degrees hook instead of fetching directly
  const { degrees, isLoading: isLoadingDegrees } = useCachedDegrees(institution?.id?.toString())

  const [course, setCourse] = useState({
    nameEn: "",
    nameRu: "",
    degreeId: "",
    instructorEn: "",
    instructorRu: "",
    descriptionEn: "",
    descriptionRu: "",
    status: "active", // Default status
  })

  // Fetch course data
  useEffect(() => {
    async function fetchCourse() {
      if (!courseId || !institution?.id) return

      try {
        const { data, error } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .eq("institution_id", institution.id)
          .single()

        if (error) {
          throw error
        }

        if (!data) {
          toast({
            title: "Error",
            description: "Course not found",
            variant: "destructive",
          })
          router.push("/admin/courses")
          return
        }

        setCourse({
          nameEn: data.name_en || "",
          nameRu: data.name_ru || "",
          degreeId: data.degree_id || "",
          instructorEn: data.instructor_en || "",
          instructorRu: data.instructor_ru || "",
          descriptionEn: data.description_en || "",
          descriptionRu: data.description_ru || "",
          status: data.status || "active",
        })
      } catch (error: any) {
        console.error("Error fetching course:", error)
        toast({
          title: "Error",
          description: "Failed to load course: " + error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourse()
  }, [courseId, institution?.id, router, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCourse((prev) => ({ ...prev, [name]: value }))
  }

  const handleDegreeChange = (value: string) => {
    setCourse((prev) => ({ ...prev, degreeId: value }))
  }

  const handleStatusChange = (value: string) => {
    setCourse((prev) => ({ ...prev, status: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!institution?.id) {
        toast({
          title: "Error",
          description: "Institution information not available",
          variant: "destructive",
        })
        return
      }

      // Update the course in Supabase
      const { error } = await supabase
        .from("courses")
        .update({
          name_en: course.nameEn,
          name_ru: course.nameRu,
          degree_id: course.degreeId,
          instructor_en: course.instructorEn,
          instructor_ru: course.instructorRu,
          description_en: course.descriptionEn,
          description_ru: course.descriptionRu,
          status: course.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", courseId)
        .eq("institution_id", institution.id)

      if (error) {
        toast({
          title: "Error updating course",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      // Clear cache to ensure fresh data is loaded
      localStorage.removeItem("admin_courses_cache")

      toast({
        title: "Success",
        description: "Course updated successfully",
      })

      // Redirect to courses page after successful submission
      router.push("/admin/courses")
    } catch (error: any) {
      console.error("Error updating course:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to get localized degree name
  const getLocalizedDegreeName = (degree: any) => {
    if (language === "ru" && degree.name_ru) {
      return degree.name_ru
    }
    return degree.name
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
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.editCourse.title")}</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nameEn">{t("admin.editCourse.nameEn")}</Label>
                    <Input
                      id="nameEn"
                      name="nameEn"
                      placeholder={t("admin.editCourse.nameEnPlaceholder")}
                      value={course.nameEn}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nameRu">{t("admin.editCourse.nameRu")}</Label>
                    <Input
                      id="nameRu"
                      name="nameRu"
                      placeholder={t("admin.editCourse.nameRuPlaceholder")}
                      value={course.nameRu}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="degreeId">{t("admin.editCourse.degree")}</Label>
                    <Select value={course.degreeId} onValueChange={handleDegreeChange} required>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingDegrees ? t("admin.courses.loading") : t("admin.editCourse.selectDegree")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {degrees.length === 0 ? (
                          <SelectItem value="no-degrees" disabled>
                            {t("admin.editCourse.noDegrees")}
                          </SelectItem>
                        ) : (
                          degrees.map((degree) => (
                            <SelectItem key={degree.id} value={degree.id.toString()}>
                              {getLocalizedDegreeName(degree)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t("admin.editCourse.status")}</Label>
                    <Select value={course.status} onValueChange={handleStatusChange} required>
                      <SelectTrigger>
                        <SelectValue placeholder={t("admin.editCourse.selectStatus")} />
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
                    <Label htmlFor="instructorEn">{t("admin.editCourse.instructorEn")}</Label>
                    <Input
                      id="instructorEn"
                      name="instructorEn"
                      placeholder={t("admin.editCourse.instructorEnPlaceholder")}
                      value={course.instructorEn}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructorRu">{t("admin.editCourse.instructorRu")}</Label>
                    <Input
                      id="instructorRu"
                      name="instructorRu"
                      placeholder={t("admin.editCourse.instructorRuPlaceholder")}
                      value={course.instructorRu}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">{t("admin.editCourse.descriptionEn")}</Label>
                    <Textarea
                      id="descriptionEn"
                      name="descriptionEn"
                      placeholder={t("admin.editCourse.descriptionEnPlaceholder")}
                      value={course.descriptionEn}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">{t("admin.editCourse.descriptionRu")}</Label>
                    <Textarea
                      id="descriptionRu"
                      name="descriptionRu"
                      placeholder={t("admin.editCourse.descriptionRuPlaceholder")}
                      value={course.descriptionRu}
                      onChange={handleChange}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button variant="outline" type="button" onClick={() => router.push("/admin/courses")}>
                    {t("admin.editCourse.cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? t("admin.editCourse.updating") : t("admin.editCourse.update")}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
