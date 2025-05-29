"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, AlertCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function ElectivesPage() {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { profile, isLoading: profileLoading } = useCachedStudentProfile()
  const [electiveCourses, setElectiveCourses] = useState<any[]>([])
  const [courseSelections, setCourseSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id || !profile?.institution_id) return

    const fetchData = async () => {
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch elective courses for the institution
        const { data: coursesData, error: coursesError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("institution_id", profile.institution_id)
          .order("deadline", { ascending: false })

        if (coursesError) throw coursesError

        // Fetch student's course selections
        const { data: selectionsData, error: selectionsError } = await supabase
          .from("course_selections")
          .select("*")
          .eq("student_id", profile.id)

        if (selectionsError) throw selectionsError

        setElectiveCourses(coursesData || [])
        setCourseSelections(selectionsData || [])
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load elective courses",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [profile, toast])

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Helper function to get selection status for a course
  const getSelectionStatus = (courseId: string) => {
    const selection = courseSelections.find((sel) => sel.elective_courses_id === courseId)
    return selection?.status || null
  }

  // Helper function to get selected courses count for an elective
  const getSelectedCoursesCount = (courseId: string) => {
    const selection = courseSelections.find((sel) => sel.elective_courses_id === courseId)
    if (!selection) return 0

    // Parse the courses JSON to count selections
    try {
      const elective = electiveCourses.find((e) => e.id === courseId)
      if (elective?.courses) {
        const courses = JSON.parse(elective.courses)
        return Array.isArray(courses) ? courses.filter((c: any) => c.selected).length : 0
      }
    } catch (e) {
      return 0
    }
    return 0
  }

  // Helper function to get status color
  const getStatusColor = (status: string | null) => {
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
  const getStatusIcon = (status: string | null) => {
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

  // Helper function to check if deadline has passed
  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date()
  }

  if (profileLoading || isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
            <p className="text-muted-foreground">{t("student.courses.subtitle")}</p>
          </div>
          <TableSkeleton />
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
            const selectionStatus = getSelectionStatus(elective.id)
            const selectedCount = getSelectedCoursesCount(elective.id)
            const deadlinePassed = isDeadlinePassed(elective.deadline)
            const name = language === "ru" && elective.name_ru ? elective.name_ru : elective.name

            return (
              <Card
                key={elective.id}
                className={`h-full transition-all hover:shadow-md ${
                  selectionStatus === "approved"
                    ? "border-green-500 bg-green-50/30 dark:bg-green-950/10"
                    : selectionStatus === "pending"
                      ? "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
                      : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{name}</CardTitle>
                      {selectionStatus ? (
                        <Badge className={getStatusColor(selectionStatus)} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(selectionStatus)}
                            <span className="capitalize ml-1">{selectionStatus}</span>
                          </span>
                        </Badge>
                      ) : (
                        <Badge className={getStatusColor(null)} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(null)}
                            <span className="capitalize ml-1">{t("student.courses.noSelection")}</span>
                          </span>
                        </Badge>
                      )}
                    </div>
                    {elective.status === "draft" ? (
                      <Badge variant="outline">{t("student.courses.comingSoon")}</Badge>
                    ) : deadlinePassed ? (
                      <Badge variant="destructive">{t("student.courses.closed")}</Badge>
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
                      <span className={deadlinePassed ? "text-red-600" : ""}>{formatDate(elective.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{t("student.courses.limit")}:</span>
                        <span>{elective.max_selections}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-md p-2 w-full ${
                      selectionStatus === "approved"
                        ? "bg-green-100/50 dark:bg-green-900/20"
                        : selectionStatus === "pending"
                          ? "bg-yellow-100/50 dark:bg-yellow-900/20"
                          : "bg-gray-100/50 dark:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm">
                      {t("student.courses.selected")}: {selectedCount}/{elective.max_selections}
                    </span>
                    <Link href={`/student/courses/${elective.id}`}>
                      <Button
                        size="sm"
                        variant={
                          elective.status === "draft" || deadlinePassed
                            ? "outline"
                            : selectionStatus === "approved"
                              ? "outline"
                              : selectionStatus === "pending"
                                ? "secondary"
                                : "default"
                        }
                        className={`h-7 gap-1 ${
                          selectionStatus === "approved"
                            ? "border-green-200 hover:bg-green-100 dark:border-green-800 dark:hover:bg-green-900/30"
                            : elective.status === "draft" || deadlinePassed
                              ? "border-gray-200 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-gray-900/30"
                              : ""
                        }`}
                        disabled={elective.status === "draft"}
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

        {electiveCourses.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No elective courses available</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for new courses</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
