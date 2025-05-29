"use client"

import { AlertTitle } from "@/components/ui/alert"

import { Alert, AlertDescription } from "@/components/ui/alert"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, CheckCircle, AlertCircle, Clock, Info, Loader2 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useCachedStudentElectiveCoursesPageData } from "@/hooks/use-cached-student-selections"
import { useRouter } from "next/navigation"

// Interfaces for data structures based on Supabase schema
interface ElectiveCoursePack {
  // Represents a record from 'elective_courses' table
  id: string
  name: string
  name_ru?: string | null
  status: "draft" | "published" | "closed" | "archived"
  deadline: string // ISO date string
  max_selections: number // Max sub-courses a student can pick from this pack's 'courses' JSONB
  syllabus_template_url?: string | null
  courses: any[] // JSONB array of actual course items within the pack
  institution_id: string
  created_at: string
  updated_at: string
}

interface StudentCourseSelection {
  // Represents a record from 'course_selections' table
  id: string
  student_id: string
  elective_courses_id: string // Foreign Key to ElectiveCoursePack.id
  status: "pending" | "approved" | "rejected"
  statement_url?: string | null
  selected_courses?: any[] // JSONB array of selected sub-course IDs or objects from the pack's 'courses'
  created_at: string
  updated_at: string
}

export default function StudentCoursesListPage() {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)
  const [userDataLoading, setUserDataLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      if (!language) {
        // Wait for language context to be available
        setUserDataLoading(true) // Keep loading true until language is ready
        return
      }

      setUserDataLoading(true)
      setAuthError(null)
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError

        if (!session) {
          router.push(`/${language}/student/login`) // Ensure language prefix
          return
        }

        // Only set studentId if it has changed to avoid unnecessary re-renders/re-fetches
        if (studentId !== session.user.id) {
          setStudentId(session.user.id)
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("institution_id, role")
          .eq("id", session.user.id)
          .single()

        if (profileError) throw profileError

        if (!profile) {
          setAuthError(t("student.courses.profileNotFound"))
          router.push(`/${language}/student/login`) // Ensure language prefix
          return
        }

        if (profile.role !== UserRole.STUDENT) {
          setAuthError(t("student.courses.accessDenied"))
          router.push(`/${language}/student/login`) // Ensure language prefix
          return
        }

        if (!profile.institution_id) {
          setAuthError(t("student.courses.institutionIdNotFound"))
          // Redirect to a page that tells the user their institution is not set up
          // The /institution-required page is handled by middleware to be on the main domain.
          router.push("/institution-required")
          return
        }

        // Only set institutionId if it has changed
        if (institutionId !== profile.institution_id) {
          setInstitutionId(profile.institution_id)
        }
      } catch (err: any) {
        console.error("Auth or profile fetch error:", err)
        setAuthError(err.message || t("student.courses.failedToLoadUserData"))
        // Optionally, redirect to login on critical errors, ensuring language prefix
        // Add a check to prevent redirect loops if the error persists
        if (!sessionStorage.getItem("studentCoursesErrorRedirect")) {
          sessionStorage.setItem("studentCoursesErrorRedirect", "true")
          router.push(`/${language}/student/login`)
          setTimeout(() => sessionStorage.removeItem("studentCoursesErrorRedirect"), 3000) // Clear flag after a delay
        }
      } finally {
        setUserDataLoading(false)
      }
    }

    fetchUserData() // Call fetchUserData

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!language) return // Ensure language is available for redirect paths

      if (event === "SIGNED_OUT" || !session) {
        setStudentId(undefined)
        setInstitutionId(undefined)
        router.push(`/${language}/student/login`)
      } else if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session?.user) {
        // If user signs in or is updated, re-fetch their data.
        // Calling fetchUserData directly is fine as long as its dependencies are managed.
        fetchUserData()
      }
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, t, language, studentId, institutionId]) // Added studentId and institutionId to dependencies
  // to re-run if they are changed by another source,
  // though onAuthStateChange should handle most cases.
  // `language` ensures effect re-runs if language changes.

  const {
    electiveCourses, // These are ElectiveCoursePack[]
    courseSelections, // These are StudentCourseSelection[]
    isLoading: dataLoading,
    error: dataError,
  } = useCachedStudentElectiveCoursesPageData(studentId, institutionId)

  const isLoading = userDataLoading || dataLoading

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  const getStudentSelectionForPack = (packId: string): StudentCourseSelection | undefined => {
    return courseSelections.find((sel) => sel.elective_courses_id === packId)
  }

  const getSelectedSubCoursesCount = (selection: StudentCourseSelection | undefined): number => {
    if (!selection || !selection.selected_courses) return 0
    return Array.isArray(selection.selected_courses) ? selection.selected_courses.length : 0
  }

  const getPackDisplayStatus = (pack: ElectiveCoursePack) => {
    const studentSelection = getStudentSelectionForPack(pack.id)
    const now = new Date()
    const deadlineDate = new Date(pack.deadline)

    if (studentSelection) {
      switch (studentSelection.status) {
        case "approved":
          return {
            text: t("student.courses.statusApproved"),
            Icon: CheckCircle,
            color: "text-green-600",
            badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          }
        case "pending":
          return {
            text: t("student.courses.statusPending"),
            Icon: Clock,
            color: "text-yellow-600",
            badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          }
        case "rejected":
          return {
            text: t("student.courses.statusRejected"),
            Icon: AlertCircle,
            color: "text-red-600",
            badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          }
      }
    }
    if (pack.status === "draft")
      return {
        text: t("student.courses.comingSoon"),
        Icon: Info,
        color: "text-gray-500",
        badgeClass: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      }
    if (pack.status === "closed" || (pack.status !== "draft" && now > deadlineDate))
      return {
        text: t("student.courses.statusClosed"),
        Icon: AlertCircle,
        color: "text-red-500",
        badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      }
    if (pack.status === "published" && now <= deadlineDate)
      return {
        text: t("student.courses.statusOpen"),
        Icon: CheckCircle,
        color: "text-blue-600",
        badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      }

    return {
      text: t("student.courses.statusUnknown"),
      Icon: Info,
      color: "text-gray-500",
      badgeClass: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    }
  }

  const getCardBorderClass = (pack: ElectiveCoursePack) => {
    const studentSelection = getStudentSelectionForPack(pack.id)
    if (studentSelection) {
      if (studentSelection.status === "approved") return "border-green-500 bg-green-50/30 dark:bg-green-950/10"
      if (studentSelection.status === "pending") return "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
      if (studentSelection.status === "rejected") return "border-red-500 bg-red-50/30 dark:bg-red-950/10"
    }
    return "border-gray-200 dark:border-gray-700 hover:shadow-lg"
  }

  const isPackActionable = (pack: ElectiveCoursePack) => {
    const studentSelection = getStudentSelectionForPack(pack.id)
    if (studentSelection?.status === "approved" || studentSelection?.status === "rejected") return false
    if (pack.status === "draft" || pack.status === "closed" || new Date() > new Date(pack.deadline)) return false
    return true
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }
  if (authError) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="text-center text-red-500 py-10">{authError}</div>
      </DashboardLayout>
    )
  }
  if (dataError && !electiveCourses?.length) {
    // Show data error only if no data is displayed
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="text-center text-red-500 py-10">{dataError}</div>
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
        {dataError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t("student.courses.error")}</AlertTitle>
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        )}

        {electiveCourses && electiveCourses.length > 0 ? (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {electiveCourses.map((pack) => {
              const { text, Icon, color, badgeClass } = getPackDisplayStatus(pack)
              const borderClass = getCardBorderClass(pack)
              const studentSelection = getStudentSelectionForPack(pack.id)
              const selectedCount = getSelectedSubCoursesCount(studentSelection)
              const actionable = isPackActionable(pack)

              return (
                <Card key={pack.id} className={`h-full transition-all ${borderClass}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">
                        {language === "ru" && pack.name_ru ? pack.name_ru : pack.name}
                      </CardTitle>
                      <Badge className={`${badgeClass} whitespace-nowrap`} variant="secondary">
                        <Icon className={`w-3.5 h-3.5 mr-1.5 ${color}`} />
                        {text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow pb-2">
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        {t("student.courses.deadline")}: {formatDate(pack.deadline)}
                      </p>
                      <p>
                        {t("student.courses.maxSelections")}: {pack.max_selections}
                      </p>
                      <p>
                        {t("student.courses.totalSubCourses")}: {pack.courses?.length || 0}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col pt-0 pb-4 gap-3">
                    <div
                      className={`flex items-center justify-between rounded-md p-2 w-full text-sm ${studentSelection ? (studentSelection.status === "approved" ? "bg-green-50 dark:bg-green-900/30" : studentSelection.status === "pending" ? "bg-yellow-50 dark:bg-yellow-900/30" : "bg-red-50 dark:bg-red-900/30") : "bg-gray-100 dark:bg-gray-800/30"}`}
                    >
                      <span>
                        {t("student.courses.selected")}: {selectedCount}/{pack.max_selections}
                      </span>
                      <Button
                        asChild
                        size="sm"
                        variant={actionable ? "default" : "outline"}
                        className={!actionable ? "cursor-not-allowed" : ""}
                      >
                        <Link href={`/${language}/student/courses/${pack.id}`}>
                          {actionable ? t("student.courses.manageSelection") : t("student.courses.viewDetails")}
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          !isLoading && <div className="text-center py-10 text-muted-foreground">{t("student.courses.noCourses")}</div>
        )}
      </div>
    </DashboardLayout>
  )
}
