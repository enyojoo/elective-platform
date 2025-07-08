"use client"

import { useEffect, useState, useCallback } from "react"
import { Clock, CheckCircle, AlertTriangle, Info, BookOpen, Users, Calendar } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { createClient } from "@supabase/supabase-js"

export default function StudentCoursesPage() {
  const { t, language } = useLanguage()
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()

  const [electivePacks, setElectivePacks] = useState<any[]>([])
  const [studentSelections, setStudentSelections] = useState<any[]>([])
  const [courseEnrollmentCounts, setCourseEnrollmentCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (profileLoading) return
    if (profileError) {
      setError(`Failed to load profile: ${profileError}`)
      setIsLoading(false)
      return
    }
    if (!profile?.id) {
      setError("Student profile not loaded or incomplete.")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      // Fetch elective course packs
      const { data: packs, error: packsError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("institution_id", profile.institution_id)
        .order("created_at", { ascending: false })

      if (packsError) throw packsError

      // Fetch student's existing selections
      const { data: selections, error: selectionsError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("student_id", profile.id)

      if (selectionsError) throw selectionsError

      // For each pack, get course enrollment counts
      const enrollmentCounts: Record<string, number> = {}

      for (const pack of packs || []) {
        if (pack.courses && Array.isArray(pack.courses)) {
          for (const courseId of pack.courses) {
            // Count ALL selections for this course (pending, approved, rejected)
            const { count, error: countError } = await supabase
              .from("course_selections")
              .select("*", { count: "exact", head: true })
              .contains("selected_course_ids", [courseId])

            if (countError) {
              console.error(`Error counting enrollments for course ${courseId}:`, countError)
            } else {
              enrollmentCounts[courseId] = count || 0
            }
          }
        }
      }

      setElectivePacks(packs || [])
      setStudentSelections(selections || [])
      setCourseEnrollmentCounts(enrollmentCounts)
    } catch (error: any) {
      setError(error.message || "Failed to load course data.")
    } finally {
      setIsLoading(false)
    }
  }, [profile, profileLoading, profileError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getSelectionForPack = (packId: string) => {
    return studentSelections.find((selection) => selection.elective_courses_id === packId)
  }

  const getStatusBadge = (status: SelectionStatus) => {
    switch (status) {
      case SelectionStatus.APPROVED:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("student.courses.approved")}
          </Badge>
        )
      case SelectionStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            {t("student.courses.pending")}
          </Badge>
        )
      case SelectionStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
            <AlertTriangle className="mr-1 h-3 w-3" />
            {t("student.courses.rejected")}
          </Badge>
        )
      default:
        return null
    }
  }

  const getPackStatusAlert = (pack: any) => {
    const selection = getSelectionForPack(pack.id)
    const isDeadlinePassed = pack.deadline ? new Date(pack.deadline) < new Date() : false

    if (selection?.status === SelectionStatus.APPROVED) {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    }

    if (selection?.status === SelectionStatus.PENDING) {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    }

    if (selection?.status === SelectionStatus.REJECTED) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionRejected")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionRejectedDesc")}</AlertDescription>
        </Alert>
      )
    }

    if (pack.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>{t("student.courses.comingSoonDesc")}</AlertDescription>
        </Alert>
      )
    }

    if (isDeadlinePassed) {
      return (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.deadlinePassed")}</AlertTitle>
          <AlertDescription>{t("student.courses.deadlinePassedDesc")}</AlertDescription>
        </Alert>
      )
    }

    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
        <AlertDescription>
          {t("student.courses.selectionPeriodDesc")} {pack.max_selections} {t("student.courses.until")}{" "}
          {pack.deadline && formatDate(pack.deadline)}.
        </AlertDescription>
      </Alert>
    )
  }

  const getCourseEnrollmentInfo = (courseId: string, maxStudents: number | null) => {
    const currentEnrollment = courseEnrollmentCounts[courseId] || 0
    const max = maxStudents || 0

    if (max === 0) return null

    return {
      current: currentEnrollment,
      max: max,
      isFull: currentEnrollment >= max,
    }
  }

  if (profileLoading || isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <PageSkeleton />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Courses</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
          <p className="text-muted-foreground">{t("student.courses.description")}</p>
        </div>

        {electivePacks.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("student.courses.noCoursesAvailable")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {electivePacks.map((pack) => {
              const selection = getSelectionForPack(pack.id)
              const packName = language === "ru" && pack.name_ru ? pack.name_ru : pack.name
              const packDescription = language === "ru" && pack.description_ru ? pack.description_ru : pack.description
              const isDeadlinePassed = pack.deadline ? new Date(pack.deadline) < new Date() : false
              const canSelect = !isDeadlinePassed && pack.status === "published" && !selection

              return (
                <Card
                  key={pack.id}
                  className={`flex flex-col h-full transition-all hover:shadow-md ${
                    selection?.status === SelectionStatus.APPROVED
                      ? "border-green-200 dark:border-green-800"
                      : selection?.status === SelectionStatus.PENDING
                        ? "border-yellow-200 dark:border-yellow-800"
                        : selection?.status === SelectionStatus.REJECTED
                          ? "border-red-200 dark:border-red-800"
                          : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">{packName}</CardTitle>
                      {selection && getStatusBadge(selection.status)}
                    </div>
                    {packDescription && (
                      <CardDescription className="text-sm line-clamp-2">{packDescription}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex-grow space-y-3">
                    <div className="space-y-2 text-sm">
                      {pack.deadline && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {t("student.courses.deadline")}: {formatDate(pack.deadline)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>
                          {t("student.courses.maxSelections")}: {pack.max_selections || 0}
                        </span>
                      </div>
                      {pack.courses && Array.isArray(pack.courses) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>
                            {pack.courses.length} {t("student.courses.coursesAvailable")}
                          </span>
                        </div>
                      )}
                    </div>

                    {selection && selection.selected_course_ids && selection.selected_course_ids.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h4 className="text-sm font-medium mb-2">{t("student.courses.selectedCourses")}:</h4>
                        <div className="space-y-1">
                          {selection.selected_course_ids.slice(0, 2).map((courseId: string, index: number) => (
                            <div key={courseId} className="text-xs text-muted-foreground">
                              • {t("student.courses.course")} {index + 1}
                            </div>
                          ))}
                          {selection.selected_course_ids.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              • {t("student.courses.andMore", { count: selection.selected_course_ids.length - 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0 border-t mt-auto">
                    <div className="w-full space-y-3">
                      {getPackStatusAlert(pack)}
                      <div className="flex gap-2">
                        <Button asChild className="flex-1" disabled={!canSelect && !selection}>
                          <Link href={`/student/courses/${pack.id}`}>
                            {selection
                              ? t("student.courses.viewSelection")
                              : canSelect
                                ? t("student.courses.selectCourses")
                                : t("student.courses.viewCourses")}
                          </Link>
                        </Button>
                      </div>
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
