"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface ElectiveCourse {
  id: string
  name: string
  name_ru: string | null
  status: string
  deadline: string
  max_selections: number
  syllabus_template_url: string | null
  courses: any[]
  institution_id: string
  created_at: string
  updated_at: string
}

interface CourseSelection {
  id: string
  student_id: string
  elective_courses_id: string
  status: string
  statement_url: string | null
  created_at: string
  updated_at: string
}

export default function ElectivesPage() {
  const { t } = useLanguage()
  const [electiveCourses, setElectiveCourses] = useState<ElectiveCourse[]>([])
  const [courseSelections, setCourseSelections] = useState<CourseSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("User not authenticated")
        return
      }

      // Get user's institution
      const { data: profile } = await supabase.from("profiles").select("institution_id").eq("id", user.id).single()

      if (!profile) {
        setError("User profile not found")
        return
      }

      // Fetch elective courses for the institution
      const { data: electiveCoursesData, error: electiveCoursesError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .order("created_at", { ascending: false })

      if (electiveCoursesError) {
        setError(electiveCoursesError.message)
        return
      }

      // Fetch user's course selections
      const { data: selectionsData, error: selectionsError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("student_id", user.id)

      if (selectionsError) {
        setError(selectionsError.message)
        return
      }

      setElectiveCourses(electiveCoursesData || [])
      setCourseSelections(selectionsData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  // Helper function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "rejected":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Get selection for an elective course
  const getSelectionForElective = (electiveId: string) => {
    return courseSelections.find((selection) => selection.elective_courses_id === electiveId)
  }

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <Button onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
          <p className="text-muted-foreground">{t("student.courses.subtitle")}</p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {electiveCourses.map((elective) => {
            const selection = getSelectionForElective(elective.id)
            const coursesArray = Array.isArray(elective.courses) ? elective.courses : []

            return (
              <Card
                key={elective.id}
                className={`h-full transition-all hover:shadow-md ${
                  selection
                    ? selection.status === "approved"
                      ? "border-green-500 bg-green-50/30 dark:bg-green-950/10"
                      : selection.status === "pending"
                        ? "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
                        : "border-red-500 bg-red-50/30 dark:bg-red-950/10"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{elective.name}</CardTitle>
                      {selection ? (
                        <Badge className={getStatusColor(selection.status)} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(selection.status)}
                            <span className="capitalize ml-1">{selection.status}</span>
                          </span>
                        </Badge>
                      ) : (
                        <Badge className={getStatusColor("none")} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getStatusIcon("none")}
                            <span className="capitalize ml-1">{t("student.courses.noSelection")}</span>
                          </span>
                        </Badge>
                      )}
                    </div>
                    {elective.status === "draft" ? (
                      <Badge variant="outline">{t("student.courses.comingSoon")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("student.courses.open")}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
                <CardFooter className="flex flex-col pt-0 pb-4 gap-4">
                  <div className="flex flex-col gap-y-2 text-sm w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t("student.courses.deadline")}:</span>
                      <span>{formatDate(elective.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{t("student.courses.courses")}:</span>
                        <span>{coursesArray.length}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{t("student.courses.limit")}:</span>
                        <span>{elective.max_selections}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-md p-2 w-full ${
                      selection
                        ? selection.status === "approved"
                          ? "bg-green-100/50 dark:bg-green-900/20"
                          : selection.status === "pending"
                            ? "bg-yellow-100/50 dark:bg-yellow-900/20"
                            : "bg-red-100/50 dark:bg-red-900/20"
                        : "bg-gray-100/50 dark:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm">
                      {t("student.courses.selected")}: {selection ? "1" : "0"}/{elective.max_selections}
                    </span>
                    <Link href={`/student/courses/${elective.id}`}>
                      <Button
                        size="sm"
                        variant={
                          elective.status === "draft"
                            ? "outline"
                            : selection
                              ? selection.status === "approved"
                                ? "outline"
                                : "secondary"
                              : "default"
                        }
                        className={`h-7 gap-1 ${
                          selection && selection.status === "approved"
                            ? "border-green-200 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-900/30"
                            : elective.status === "draft"
                              ? "border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900/30"
                              : ""
                        }`}
                      >
                        <>
                          <span>{t("student.courses.view")}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
