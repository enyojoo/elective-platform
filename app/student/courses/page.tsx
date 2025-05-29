"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, BookOpen, CheckCircle, AlertCircle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useCachedStudentElectiveCourses } from "@/hooks/use-cached-student-selections"
import { useRouter } from "next/navigation"

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

export default function StudentCoursesPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)
  const [userDataLoading, setUserDataLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      console.log("StudentCoursesPage: Fetching user data...")
      setUserDataLoading(true)
      setAuthError(null)

      try {
        // First check if we have a session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("StudentCoursesPage: Session error:", sessionError)
          setAuthError("Session error: " + sessionError.message)
          router.push("/student/login")
          return
        }

        if (!session) {
          console.log("StudentCoursesPage: No session found, redirecting to login")
          setAuthError("No active session found")
          router.push("/student/login")
          return
        }

        console.log("StudentCoursesPage: Session found for user:", session.user.id)
        setStudentId(session.user.id)

        // Get user's institution from profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("institution_id, role")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          console.error("StudentCoursesPage: Error fetching profile:", profileError)
          setAuthError("Could not retrieve user profile: " + profileError.message)
          return
        }

        if (!profile) {
          console.error("StudentCoursesPage: No profile found for user")
          setAuthError("User profile not found")
          return
        }

        // Check if user is a student
        if (profile.role !== "student") {
          console.error("StudentCoursesPage: User is not a student:", profile.role)
          setAuthError("Access denied: Student role required")
          router.push("/student/login")
          return
        }

        if (!profile.institution_id) {
          console.warn("StudentCoursesPage: Institution ID not found in profile")
          setAuthError("Institution not set for your profile")
          return
        }

        console.log("StudentCoursesPage: Institution ID found:", profile.institution_id)
        setInstitutionId(profile.institution_id)
      } catch (err) {
        console.error("StudentCoursesPage: Unexpected error:", err)
        setAuthError("An unexpected error occurred")
      } finally {
        setUserDataLoading(false)
      }
    }

    fetchUserData()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("StudentCoursesPage: Auth state changed:", event, session?.user?.id)
      if (event === "SIGNED_OUT" || !session) {
        setStudentId(undefined)
        setInstitutionId(undefined)
        router.push("/student/login")
      } else if (event === "SIGNED_IN" && session) {
        // Refetch user data when signed in
        fetchUserData()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const {
    electiveCourses,
    courseSelections,
    isLoading: coursesLoading,
    error,
    refreshData,
  } = useCachedStudentElectiveCourses(studentId, institutionId)

  const isLoading = userDataLoading || coursesLoading

  useEffect(() => {
    console.log("StudentCoursesPage: Hook data update:", {
      studentId,
      institutionId,
      electiveCourses: electiveCourses?.length,
      courseSelections: courseSelections?.length,
      isCombinedLoading: isLoading,
      isUserDataLoading: userDataLoading,
      isCoursesLoading: coursesLoading,
      error,
      authError,
    })
  }, [
    studentId,
    institutionId,
    electiveCourses,
    courseSelections,
    isLoading,
    userDataLoading,
    coursesLoading,
    error,
    authError,
  ])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getSelectionForCourse = (courseId: string): CourseSelection | undefined => {
    return courseSelections.find((selection) => selection.elective_courses_id === courseId)
  }

  const getStatusBadge = (course: ElectiveCourse) => {
    const selection = getSelectionForCourse(course.id)

    if (selection) {
      switch (selection.status) {
        case "approved":
          return <Badge className="bg-green-600 text-white">Approved</Badge>
        case "pending":
          return (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700">
              Pending
            </Badge>
          )
        case "rejected":
          return <Badge variant="destructive">Rejected</Badge>
        default:
          return <Badge variant="secondary">Unknown</Badge>
      }
    }

    if (course.status === "draft") {
      return <Badge variant="secondary">Coming Soon</Badge>
    }

    const deadline = new Date(course.deadline)
    const now = new Date()

    if (deadline < now) {
      return <Badge variant="destructive">Closed</Badge>
    }

    return <Badge className="bg-blue-600 text-white">Open</Badge>
  }

  const getCardStyle = (course: ElectiveCourse) => {
    const selection = getSelectionForCourse(course.id)

    if (selection) {
      switch (selection.status) {
        case "approved":
          return "border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/10"
        case "pending":
          return "border-yellow-200 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/10"
        case "rejected":
          return "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-950/10"
        default:
          return ""
      }
    }
    return ""
  }

  // Show auth error if there's one
  if (authError) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/student/login")}>Go to Login</Button>
        </div>
      </DashboardLayout>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
          </div>
          <p className="text-muted-foreground">
            {userDataLoading ? "Loading user information..." : "Loading courses..."}
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={refreshData}>Try Again</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("student.courses.title")}</h1>
            <p className="text-muted-foreground">{t("student.courses.subtitle")}</p>
          </div>
        </div>

        {electiveCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("student.courses.noCoursesTitle")}</h3>
              <p className="text-muted-foreground text-center max-w-md">{t("student.courses.noCoursesDescription")}</p>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Student ID: {studentId}</p>
                <p>Institution ID: {institutionId}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {electiveCourses.map((course) => {
              const selection = getSelectionForCourse(course.id)
              const deadline = new Date(course.deadline)
              const now = new Date()
              const isExpired = deadline < now
              const canSelect = course.status === "published" && !isExpired && !selection

              return (
                <Card key={course.id} className={`h-full transition-all hover:shadow-md ${getCardStyle(course)}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{course.name}</CardTitle>
                      {getStatusBadge(course)}
                    </div>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(course.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.max_selections} max</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {Array.isArray(course.courses) && course.courses.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">{course.courses.length}</span> courses available
                        </div>
                      )}

                      {selection && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-700 dark:text-green-300">Selection submitted</span>
                          </div>
                          {selection.statement_url && (
                            <div className="text-xs text-muted-foreground">Statement uploaded</div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Link href={`/student/courses/${course.id}`} className="flex-1">
                          <Button
                            variant={selection ? "outline" : "default"}
                            className="w-full"
                            disabled={course.status === "draft"}
                          >
                            {selection ? "View Selection" : canSelect ? "Select Courses" : "View Details"}
                          </Button>
                        </Link>
                      </div>
                    </div>
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
