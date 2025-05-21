"use client"

import { useEffect, useState, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, type Semester, type SelectionStatus, type FormattedElectiveCourse } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, AlertCircle, Clock, Download } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useDataCache } from "@/lib/data-cache-context"
import { Skeleton } from "@/components/ui/skeleton"

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  } catch (error) {
    console.error("Invalid date:", dateString)
    return "Invalid date"
  }
}

export default function ElectivesPage() {
  const { t } = useLanguage()
  const [electiveCourses, setElectiveCourses] = useState<FormattedElectiveCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [institutionId, setInstitutionId] = useState<string | null>(null)
  const { toast } = useToast()
  const { getCachedData, setCachedData } = useDataCache()
  const supabase = getSupabaseBrowserClient()

  // Get user and institution ID once
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          console.log("No authenticated user found")
          return
        }

        setUserId(user.id)

        // Get the student profile to get institution_id from the profiles table
        const { data: studentProfile, error: profileError } = await supabase
          .from("profiles")
          .select("institution_id")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
          return
        }

        if (studentProfile?.institution_id) {
          setInstitutionId(studentProfile.institution_id)
        }
      } catch (error) {
        console.error("Error getting current user:", error)
      }
    }

    getCurrentUser()
  }, [supabase])

  // Fetch elective courses only when userId and institutionId are available
  const fetchElectiveCourses = useCallback(async () => {
    if (!userId || !institutionId) return

    setIsLoading(true)

    try {
      // Try to get data from cache first
      const cacheKey = `studentElectiveCourses-${institutionId}`
      const cachedData = getCachedData<FormattedElectiveCourse[]>(cacheKey, userId)

      if (cachedData) {
        console.log("Using cached elective courses data")
        setElectiveCourses(cachedData)
        setIsLoading(false)
        return
      }

      console.log("Fetching elective courses from database")

      // Fetch elective courses for this institution
      const { data: electiveCoursesData, error: electiveCoursesError } = await supabase
        .from("elective_courses")
        .select(`
          id, 
          name, 
          name_ru,
          semester,
          academic_year,
          status,
          deadline,
          max_selections,
          syllabus_template_url,
          courses,
          institution_id,
          created_at,
          updated_at
        `)
        .eq("institution_id", institutionId)
        .order("academic_year", { ascending: false })
        .order("semester", { ascending: true })

      if (electiveCoursesError) {
        throw electiveCoursesError
      }

      console.log("Fetched elective courses:", electiveCoursesData?.length || 0)

      // Get student selections for these elective courses from course_selections table
      const { data: studentSelections, error: selectionsError } = await supabase
        .from("course_selections")
        .select("elective_courses_id, status, statement_url")
        .eq("student_id", userId)
        .eq("institution_id", institutionId)

      if (selectionsError) {
        throw selectionsError
      }

      console.log("Fetched student selections:", studentSelections?.length || 0)

      // Process and format the data
      const formattedData = electiveCoursesData.map((course) => {
        // Find selections for this course
        const courseSelections =
          studentSelections?.filter((selection) => selection.elective_courses_id === course.id) || []

        // Calculate if the course has available spaces
        const hasAvailableSpaces = course.status === "published"

        // Get statement URL if available
        const statementUrl = courseSelections.length > 0 ? courseSelections[0].statement_url : null

        return {
          id: course.id,
          name: course.name || `${course.semester} ${course.academic_year}`,
          name_ru: course.name_ru,
          semester: course.semester as Semester,
          academic_year: course.academic_year,
          deadline: course.deadline,
          max_selections: course.max_selections || 1,
          syllabus_template_url: course.syllabus_template_url,
          status: course.status || "draft",
          course_count: Array.isArray(course.courses) ? course.courses.length : 0,
          available_spaces: hasAvailableSpaces,
          selected: courseSelections.length > 0,
          selection_status: courseSelections.length > 0 ? (courseSelections[0].status as SelectionStatus) : null,
          selected_count: courseSelections.length,
          statement_url: statementUrl,
        }
      })

      console.log("Formatted data:", formattedData.length)

      // Save to cache
      setCachedData(cacheKey, userId, formattedData)

      setElectiveCourses(formattedData)
    } catch (error: any) {
      console.error("Error fetching elective courses:", error)
      toast({
        title: "Error",
        description: "Failed to load elective courses. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId, institutionId, supabase, toast, getCachedData, setCachedData])

  // Only fetch data when userId and institutionId are available
  useEffect(() => {
    if (userId && institutionId) {
      fetchElectiveCourses()
    }
  }, [userId, institutionId, fetchElectiveCourses])

  // Helper function to get status color
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "none":
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
      case "none":
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Function to handle syllabus download
  const handleSyllabusDownload = (url: string | null, courseName: string) => {
    if (!url) {
      toast({
        title: "No syllabus available",
        description: "There is no syllabus template available for this course.",
        variant: "destructive",
      })
      return
    }

    // Create a temporary anchor element to trigger download
    const a = document.createElement("a")
    a.href = url
    a.download = `${courseName.replace(/\s+/g, "_")}_syllabus.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
          <p className="text-muted-foreground">{t("student.courses.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow"></CardContent>
                <CardFooter className="flex flex-col pt-0 pb-4 gap-4">
                  <div className="flex flex-col gap-y-2 text-sm w-full">
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : electiveCourses.length === 0 ? (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium">No elective courses available</h3>
            <p className="text-muted-foreground mt-2">
              There are currently no elective courses available for selection.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {electiveCourses.map((elective) => (
              <Card
                key={elective.id}
                className={`h-full transition-all hover:shadow-md ${
                  elective.selected
                    ? elective.selection_status === "approved"
                      ? "border-green-500 bg-green-50/30 dark:bg-green-950/10"
                      : elective.selection_status === "pending"
                        ? "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
                        : "border-red-500 bg-red-50/30 dark:bg-red-950/10"
                    : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{elective.name}</CardTitle>
                      {elective.selected ? (
                        <Badge className={getStatusColor(elective.selection_status)} variant="secondary">
                          <span className="flex items-center space-x-1">
                            {getStatusIcon(elective.selection_status)}
                            <span className="capitalize ml-1">{elective.selection_status}</span>
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
                    ) : elective.available_spaces ? (
                      <Badge variant="secondary">{t("student.courses.open")}</Badge>
                    ) : (
                      <Badge variant="destructive">{t("student.courses.limited")}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {elective.academic_year} • {elective.semester.charAt(0).toUpperCase() + elective.semester.slice(1)}
                  </div>

                  {elective.syllabus_template_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => handleSyllabusDownload(elective.syllabus_template_url, elective.name)}
                    >
                      <Download className="h-4 w-4" />
                      <span>{t("student.courses.downloadSyllabus")}</span>
                    </Button>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col pt-0 pb-4 gap-4">
                  <div className="flex flex-col gap-y-2 text-sm w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t("student.courses.deadline")}:</span>
                      <span>{formatDate(elective.deadline)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{t("student.courses.courses")}:</span>
                        <span>{elective.course_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">{t("student.courses.limit")}:</span>
                        <span>{elective.max_selections}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-between rounded-md p-2 w-full ${
                      elective.selected
                        ? elective.selection_status === "approved"
                          ? "bg-green-100/50 dark:bg-green-900/20"
                          : elective.selection_status === "pending"
                            ? "bg-yellow-100/50 dark:bg-yellow-900/20"
                            : "bg-red-100/50 dark:bg-red-900/20"
                        : "bg-gray-100/50 dark:bg-gray-900/20"
                    }`}
                  >
                    <span className="text-sm">
                      {t("student.courses.selected")}: {elective.selected_count}/{elective.max_selections}
                    </span>
                    <Link href={`/student/courses/${elective.id}`}>
                      <Button
                        size="sm"
                        variant={
                          elective.status === "draft"
                            ? "outline"
                            : elective.selected
                              ? elective.selection_status === "approved"
                                ? "outline"
                                : "secondary"
                              : "default"
                        }
                        className={`h-7 gap-1 ${
                          elective.selected && elective.selection_status === "approved"
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
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
