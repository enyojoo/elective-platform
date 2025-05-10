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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"

// Course status options
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
]

export default function NewCoursePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [degrees, setDegrees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()
  const supabase = createClientComponentClient()

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

  // Fetch degrees from Supabase
  useEffect(() => {
    async function fetchDegrees() {
      try {
        setLoading(true)

        // Get current user's session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.error("No session found")
          return
        }

        // Get user's profile to get institution_id
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("institution_id")
          .eq("id", session.user.id)
          .single()

        if (profileError || !profileData) {
          console.error("Error fetching profile:", profileError)
          return
        }

        // Fetch degrees for this institution
        const { data, error } = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", profileData.institution_id)

        if (error) {
          console.error("Error fetching degrees:", error)
          return
        }

        setDegrees(data || [])
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDegrees()
  }, [supabase])

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
      // Get current user's session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create a course",
          variant: "destructive",
        })
        return
      }

      // Get user's profile to get institution_id
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("institution_id")
        .eq("id", session.user.id)
        .single()

      if (profileError || !profileData) {
        toast({
          title: "Error",
          description: "Could not fetch your profile information",
          variant: "destructive",
        })
        return
      }

      // Create the course in Supabase
      const { error } = await supabase.from("courses").insert({
        name_en: course.nameEn,
        name_ru: course.nameRu,
        degree_id: course.degreeId,
        instructor_en: course.instructorEn,
        instructor_ru: course.instructorRu,
        description_en: course.descriptionEn,
        description_ru: course.descriptionRu,
        status: course.status,
        institution_id: profileData.institution_id,
        code: `C${Math.floor(Math.random() * 10000)}`, // Generate a random code
      })

      if (error) {
        toast({
          title: "Error creating course",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Course created successfully",
      })

      // Redirect to courses page after successful submission
      router.push("/admin/courses")
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
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
                  <Label htmlFor="degreeId">{t("admin.newCourse.degree")}</Label>
                  <Select value={course.degreeId} onValueChange={handleDegreeChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading degrees..." : t("admin.newCourse.selectDegree")} />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((degree) => (
                        <SelectItem key={degree.id} value={degree.id}>
                          {degree.name || degree.name_en}
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
