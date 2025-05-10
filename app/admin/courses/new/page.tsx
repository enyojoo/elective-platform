"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function NewCoursePage() {
  const [loading, setLoading] = useState(false)
  const [degrees, setDegrees] = useState<any[]>([])
  const [loadingDegrees, setLoadingDegrees] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLanguage()
  const supabase = getSupabaseBrowserClient()

  // Form state
  const [formData, setFormData] = useState({
    name_en: "",
    name_ru: "",
    code: "",
    instructor_en: "",
    instructor_ru: "",
    description_en: "",
    description_ru: "",
    degree_id: "",
    credits: 3,
    status: "active",
  })

  // Fetch degrees from Supabase
  useEffect(() => {
    async function fetchDegrees() {
      try {
        setLoadingDegrees(true)

        // Get current user's session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          toast({
            title: "Error",
            description: "No session found. Please log in again.",
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
            description: "Error fetching profile: " + profileError?.message,
            variant: "destructive",
          })
          return
        }

        // Fetch degrees for this institution
        const { data, error } = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", profileData.institution_id)

        if (error) {
          toast({
            title: "Error",
            description: "Error fetching degrees: " + error.message,
            variant: "destructive",
          })
          return
        }

        setDegrees(data || [])
      } catch (error: any) {
        toast({
          title: "Error",
          description: "An unexpected error occurred: " + error.message,
          variant: "destructive",
        })
      } finally {
        setLoadingDegrees(false)
      }
    }

    fetchDegrees()
  }, [supabase, toast])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Validate required fields
      if (!formData.name_en || !formData.code || !formData.degree_id) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        return
      }

      // Get current user's session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Error",
          description: "No session found. Please log in again.",
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
          description: "Error fetching profile: " + profileError?.message,
          variant: "destructive",
        })
        return
      }

      // Create course
      const { data, error } = await supabase
        .from("courses")
        .insert({
          ...formData,
          institution_id: profileData.institution_id,
        })
        .select()

      if (error) {
        toast({
          title: "Error",
          description: "Error creating course: " + error.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Course created successfully!",
      })

      // Redirect to courses page
      router.push("/admin/courses")
    } catch (error: any) {
      toast({
        title: "Error",
        description: "An unexpected error occurred: " + error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.courses.newCourse")}</h1>
          <p className="text-muted-foreground mt-2">{t("admin.courses.newCourseSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.courses.courseDetails")}</CardTitle>
              <CardDescription>{t("admin.courses.courseDetailsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name_en">{t("admin.courses.nameEn")} *</Label>
                  <Input id="name_en" name="name_en" value={formData.name_en} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ru">{t("admin.courses.nameRu")}</Label>
                  <Input id="name_ru" name="name_ru" value={formData.name_ru} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">{t("admin.courses.code")} *</Label>
                  <Input id="code" name="code" value={formData.code} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">{t("admin.courses.credits")}</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.credits}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor_en">{t("admin.courses.instructorEn")}</Label>
                  <Input
                    id="instructor_en"
                    name="instructor_en"
                    value={formData.instructor_en}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor_ru">{t("admin.courses.instructorRu")}</Label>
                  <Input
                    id="instructor_ru"
                    name="instructor_ru"
                    value={formData.instructor_ru}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree_id">{t("admin.courses.degree")} *</Label>
                  <Select
                    value={formData.degree_id}
                    onValueChange={(value) => handleSelectChange("degree_id", value)}
                    disabled={loadingDegrees}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingDegrees ? t("admin.courses.loadingDegrees") : t("admin.courses.selectDegree")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map((degree) => (
                        <SelectItem key={degree.id} value={degree.id}>
                          {degree.name} ({degree.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("admin.courses.status")}</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.courses.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("admin.courses.active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.courses.inactive")}</SelectItem>
                      <SelectItem value="draft">{t("admin.courses.draft")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_en">{t("admin.courses.descriptionEn")}</Label>
                <Textarea
                  id="description_en"
                  name="description_en"
                  value={formData.description_en}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_ru">{t("admin.courses.descriptionRu")}</Label>
                <Textarea
                  id="description_ru"
                  name="description_ru"
                  value={formData.description_ru}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/courses")}
                  disabled={loading}
                >
                  {t("admin.courses.cancel")}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t("admin.courses.creating") : t("admin.courses.createCourse")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
