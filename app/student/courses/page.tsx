"use client"

import { AlertDescription } from "@/components/ui/alert"

import { AlertTitle } from "@/components/ui/alert"

import { Alert } from "@/components/ui/alert"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, AlertCircle, Clock, Inbox } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function ElectivesPage() {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()
  const [electiveCourses, setElectiveCourses] = useState<any[]>([])
  const [courseSelections, setCourseSelections] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    console.log("ElectivesPage: useEffect triggered.")
    if (profileLoading) {
      console.log("ElectivesPage: Profile is loading.")
      setIsLoading(true)
      return
    }

    if (profileError) {
      console.error("ElectivesPage: Profile loading error:", profileError)
      setFetchError(`Failed to load profile: ${profileError}`)
      setIsLoading(false)
      return
    }

    if (!profile?.id || !profile?.institution_id) {
      console.log("ElectivesPage: Profile ID or Institution ID missing.", profile)
      setFetchError("Student profile information is incomplete.")
      setIsLoading(false)
      setElectiveCourses([]) // Clear any stale data
      setCourseSelections([])
      return
    }

    console.log("ElectivesPage: Profile loaded:", profile)

    const fetchData = async () => {
      setIsLoading(true)
      setFetchError(null)
      console.log("ElectivesPage: Starting data fetch for institution:", profile.institution_id)
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch elective courses for the institution
        console.log("ElectivesPage: Fetching elective_courses...")
        const { data: coursesData, error: coursesError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("institution_id", profile.institution_id)
          .order("deadline", { ascending: false })

        if (coursesError) {
          console.error("ElectivesPage: Error fetching elective_courses:", coursesError)
          throw coursesError
        }
        console.log("ElectivesPage: elective_courses fetched:", coursesData)
        setElectiveCourses(coursesData || [])

        // Fetch student's course selections
        console.log("ElectivesPage: Fetching course_selections for student:", profile.id)
        const { data: selectionsData, error: selectionsError } = await supabase
          .from("course_selections")
          .select("*")
          .eq("student_id", profile.id)

        if (selectionsError) {
          console.error("ElectivesPage: Error fetching course_selections:", selectionsError)
          throw selectionsError
        }
        console.log("ElectivesPage: course_selections fetched:", selectionsData)
        setCourseSelections(selectionsData || [])
      } catch (error: any) {
        console.error("ElectivesPage: Data fetching error:", error)
        setFetchError(error.message || "Failed to load elective courses data.")
        toast({
          title: "Error",
          description: error.message || "Failed to load elective courses",
          variant: "destructive",
        })
        setElectiveCourses([]) // Clear data on error
        setCourseSelections([])
      } finally {
        console.log("ElectivesPage: Data fetch finished.")
        setIsLoading(false)
      }
    }

    fetchData()
  }, [profile, profileLoading, profileError, toast])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getSelectionStatus = (courseId: string) => {
    const selection = courseSelections.find((sel) => sel.elective_courses_id === courseId)
    return selection?.status || null
  }

  const getSelectedCoursesCount = (electiveCourse: any) => {
    const selection = courseSelections.find((sel) => sel.elective_courses_id === electiveCourse.id)
    if (!selection || !electiveCourse.courses) return 0
    try {
      const coursesInElective = JSON.parse(electiveCourse.courses)
      if (Array.isArray(coursesInElective)) {
        // Assuming the `courses` JSON in `elective_courses` stores an array of course objects,
        // and each object might have a property like `id` or `name`.
        // The `course_selections` table's `selected_course_ids` (if it existed) or similar field would store actual selections.
        // For now, if `electiveCourse.courses` contains the *selected* courses by the student for this pack,
        // we need to know its structure.
        // Let's assume `electiveCourse.courses` (JSON) is an array of course objects, and `selected` property indicates selection.
        // This part needs clarification on how selected courses *within* an elective_courses entry are stored.
        // For now, if `course_selections` has an entry, it means the student interacted with this elective_courses pack.
        // The number of selected items within that pack depends on how `elective_courses.courses` (JSON) is structured and updated.
        // The `[packId]/page.tsx` handles individual selections within a pack.
        // This page (`/student/courses`) might just show if *any* selection was made for the pack.
        // Let's assume `electiveCourse.max_selections` is the total allowed, and `course_selections.selected_count` (hypothetical) would be the actual.
        // Since `course_selections` doesn't have `selected_count`, we'll infer from `elective_courses.courses` if possible.
        // This is tricky without knowing the exact structure of `elective_courses.courses` JSON and how it's updated.
        // For simplicity, if a selection record exists, we'll assume they selected *something*.
        // A more accurate count would require parsing `elective_courses.courses` based on its structure.
        // Let's assume `elective_courses.courses` is an array of objects like `{id: "course1", name: "Course 1", selected: true/false}`
        const selected = coursesInElective.filter((c) => c.selected === true)
        return selected.length
      }
    } catch (e) {
      console.error("Error parsing courses JSON for count:", e)
    }
    return 0 // Fallback
  }

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

  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date()

  if (profileLoading || isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
            <p className="text-muted-foreground">{t("student.courses.subtitle")}</p>
          </div>
          <TableSkeleton numberOfRows={3} />
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

        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {!fetchError && electiveCourses.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t("student.courses.noCoursesFound")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("student.courses.checkBackLater")}</p>
            </CardContent>
          </Card>
        )}

        {!fetchError && electiveCourses.length > 0 && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {electiveCourses.map((elective) => {
              const selectionStatus = getSelectionStatus(elective.id)
              const selectedCount = getSelectedCoursesCount(elective) // Pass the whole elective object
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
                              <span className="capitalize ml-1">
                                {t(`student.courses.status.${selectionStatus}` as any, selectionStatus)}
                              </span>
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
                            elective.status === "draft" ||
                            (deadlinePassed && selectionStatus !== "approved" && selectionStatus !== "pending")
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
                              : elective.status === "draft" ||
                                  (deadlinePassed && selectionStatus !== "approved" && selectionStatus !== "pending")
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
        )}
      </div>
    </DashboardLayout>
  )
}
