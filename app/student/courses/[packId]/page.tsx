"use client"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Calendar, Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useCachedCourseDetails } from "@/hooks/use-cached-course-details"
import { useParams } from "next/navigation"

export default function CourseDetailsPage() {
  const { t, language } = useLanguage()
  const params = useParams()
  const packId = params.packId as string
  const { data, isLoading, error } = useCachedCourseDetails(packId)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
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

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/student/courses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("common.back")}
              </Button>
            </Link>
          </div>
          <TableSkeleton numberOfRows={5} />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !data?.elective) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/student/courses">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("common.back")}
              </Button>
            </Link>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Course not found"}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  const { elective, courses, selection } = data
  const name = language === "ru" && elective.name_ru ? elective.name_ru : elective.name
  const description = language === "ru" && elective.description_ru ? elective.description_ru : elective.description
  const isDeadlinePassed = new Date(elective.deadline) < new Date()
  const selectedCourseIds = selection?.selected_course_ids || []

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/student/courses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{name}</CardTitle>
                  {selection?.status ? (
                    <Badge className={getStatusColor(selection.status)} variant="secondary">
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(selection.status)}
                        <span className="capitalize ml-1">
                          {t(`student.courses.status.${selection.status}` as any, selection.status)}
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
                ) : isDeadlinePassed ? (
                  <Badge variant="destructive">{t("student.courses.closed")}</Badge>
                ) : (
                  <Badge variant="secondary">{t("student.courses.open")}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {description && <p className="text-muted-foreground">{description}</p>}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("student.courses.deadline")}</p>
                    <p className={`text-sm ${isDeadlinePassed ? "text-red-600" : "text-muted-foreground"}`}>
                      {formatDate(elective.deadline)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("student.courses.limit")}</p>
                    <p className="text-sm text-muted-foreground">{elective.max_selections}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("student.courses.selected")}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCourseIds.length}/{elective.max_selections}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Courses */}
          <Card>
            <CardHeader>
              <CardTitle>{t("student.courses.availableCourses")}</CardTitle>
            </CardHeader>
            <CardContent>
              {courses.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">{t("student.courses.noCoursesAvailable")}</p>
              ) : (
                <div className="grid gap-4">
                  {courses.map((course) => {
                    const courseName = language === "ru" && course.name_ru ? course.name_ru : course.name
                    const courseDescription =
                      language === "ru" && course.description_ru ? course.description_ru : course.description
                    const isSelected = selectedCourseIds.includes(course.id)

                    return (
                      <Card
                        key={course.id}
                        className={`transition-all ${isSelected ? "border-blue-500 bg-blue-50/30 dark:bg-blue-950/10" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-medium">{courseName}</h4>
                              {courseDescription && (
                                <p className="text-sm text-muted-foreground">{courseDescription}</p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {course.credits && (
                                  <span>
                                    {course.credits} {t("student.courses.credits")}
                                  </span>
                                )}
                                {course.semester && (
                                  <span>
                                    {t("student.courses.semester")} {course.semester}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t("student.courses.selected")}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selection Actions */}
          {!isDeadlinePassed && elective.status !== "draft" && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Link href={`/student/electives/course/${packId}/select`}>
                    <Button size="lg">
                      {selection ? t("student.courses.modifySelection") : t("student.courses.makeSelection")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
