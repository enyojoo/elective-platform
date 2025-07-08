"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, Clock, AlertTriangle, Calendar, Users, BookOpen, Info } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { useCachedStudentCourses } from "@/hooks/use-cached-student-courses"

export default function StudentCoursesPage() {
  const { t, language } = useLanguage()
  const { data, isLoading, error } = useCachedStudentCourses()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status: SelectionStatus) => {
    switch (status) {
      case SelectionStatus.APPROVED:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case SelectionStatus.PENDING:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case SelectionStatus.REJECTED:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    }
  }

  const getStatusIcon = (status: SelectionStatus) => {
    switch (status) {
      case SelectionStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />
      case SelectionStatus.PENDING:
        return <Clock className="h-4 w-4" />
      case SelectionStatus.REJECTED:
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  if (isLoading) {
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

  const { electives, selections } = data || { electives: [], selections: [] }

  // Create a map of selections by elective_courses_id for quick lookup
  const selectionMap = new Map(selections.map((sel) => [sel.elective_courses_id, sel]))

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
          <p className="text-muted-foreground">{t("student.courses.description")}</p>
        </div>

        {electives.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("student.courses.noElectivesAvailable")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {electives.map((elective) => {
              const selection = selectionMap.get(elective.id)
              const name = language === "ru" && elective.name_ru ? elective.name_ru : elective.name
              const description =
                language === "ru" && elective.description_ru ? elective.description_ru : elective.description
              const isDeadlinePassed = new Date(elective.deadline) < new Date()
              const isDraft = elective.status === "draft"

              return (
                <Card
                  key={elective.id}
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
                      <CardTitle className="text-lg leading-tight">{name}</CardTitle>
                      {isDraft ? (
                        <Badge variant="outline" className="text-xs">
                          {t("student.courses.comingSoon")}
                        </Badge>
                      ) : isDeadlinePassed ? (
                        <Badge variant="destructive" className="text-xs">
                          {t("student.courses.closed")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {t("student.courses.open")}
                        </Badge>
                      )}
                    </div>
                    {description && <CardDescription className="text-sm line-clamp-2">{description}</CardDescription>}
                  </CardHeader>

                  <CardContent className="flex-grow pb-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {t("student.courses.deadline")}: {formatDate(elective.deadline)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>
                          {t("student.courses.maxSelections")}: {elective.max_selections}
                        </span>
                      </div>

                      {selection && (
                        <div className="pt-2">
                          <Badge className={getStatusColor(selection.status)} variant="secondary">
                            <span className="flex items-center space-x-1">
                              {getStatusIcon(selection.status)}
                              <span className="capitalize ml-1">
                                {t(`student.courses.status.${selection.status}` as any, selection.status)}
                              </span>
                            </span>
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardContent className="pt-0 border-t mt-auto">
                    <Link href={`/student/courses/${elective.id}`} className="block w-full">
                      <Button variant="outline" className="w-full bg-transparent">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {selection ? t("student.courses.viewSelection") : t("student.courses.viewDetails")}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
