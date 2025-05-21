"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, ClipboardList, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useRouter } from "next/navigation"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import {
  useCachedStudentCourseSelections,
  useCachedStudentExchangeSelections,
} from "@/hooks/use-cached-student-selections"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { supabase } from "@/lib/supabase"

export default function StudentDashboard() {
  const { t } = useLanguage()
  const { institution, isSubdomainAccess } = useInstitution()
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>(undefined)

  useEffect(() => {
    async function getCurrentUserId() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        } else {
          // If no user is found, redirect to login
          router.push("/student/login")
        }
      } catch (error) {
        console.error("Error getting current user:", error)
      }
    }

    getCurrentUserId()
  }, [router])

  const { profile, isLoading: isProfileLoading, error: profileError } = useCachedStudentProfile(userId)
  const { selections: courseSelections, isLoading: isCourseSelectionsLoading } =
    useCachedStudentCourseSelections(userId)
  const { selections: exchangeSelections, isLoading: isExchangeSelectionsLoading } =
    useCachedStudentExchangeSelections(userId)

  // Ensure this page is only accessed via subdomain
  useEffect(() => {
    if (!isSubdomainAccess) {
      router.push("/institution-required")
    }
  }, [isSubdomainAccess, router])

  // Get upcoming deadlines from elective packs
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([])
  const [isDeadlinesLoading, setIsDeadlinesLoading] = useState(true)

  useEffect(() => {
    async function fetchDeadlines() {
      if (!institution?.id) return

      try {
        const { data, error } = await supabase
          .from("elective_packs")
          .select("*")
          .eq("institution_id", institution.id)
          .eq("status", "published")
          .order("deadline", { ascending: true })
          .limit(3)

        if (error) throw error

        // Calculate days left for each deadline
        const deadlinesWithDaysLeft = data.map((pack) => {
          const deadlineDate = new Date(pack.deadline)
          const today = new Date()
          const diffTime = deadlineDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

          return {
            title: pack.name,
            date: pack.deadline,
            daysLeft: diffDays > 0 ? diffDays : 0,
          }
        })

        setUpcomingDeadlines(deadlinesWithDaysLeft)
      } catch (error) {
        console.error("Error fetching deadlines:", error)
      } finally {
        setIsDeadlinesLoading(false)
      }
    }

    fetchDeadlines()
  }, [institution?.id])

  // Calculate student data from profile and selections
  const studentData = {
    name: profile?.full_name || "Loading...",
    email: profile?.email || "Loading...",
    degree: profile?.studentDetails?.groups?.programs?.degrees?.name || "Loading...",
    program: profile?.studentDetails?.groups?.programs?.name || "Loading...",
    year: profile?.studentDetails?.enrollment_year || "Loading...",
    group: profile?.studentDetails?.groups?.name || "Loading...",
    requiredElectives: {
      courses: profile?.studentDetails?.groups?.required_course_electives || 0,
      exchange: profile?.studentDetails?.groups?.required_exchange_electives || 0,
      get total() {
        return this.courses + this.exchange
      },
    },
    selectedElectives: {
      courses: courseSelections?.length || 0,
      exchange: exchangeSelections?.length || 0,
      get total() {
        return this.courses + this.exchange
      },
    },
    pendingSelections: {
      courses: courseSelections?.filter((s) => s.status === "pending")?.length || 0,
      exchange: exchangeSelections?.filter((s) => s.status === "pending")?.length || 0,
      get total() {
        return this.courses + this.exchange
      },
    },
  }

  const isLoading = isProfileLoading || isCourseSelectionsLoading || isExchangeSelectionsLoading || isDeadlinesLoading

  if (!isSubdomainAccess) {
    return null // Don't render anything while redirecting
  }

  if (isProfileLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <PageSkeleton type="dashboard" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("student.dashboard.welcome", { name: profile?.full_name || t("student.dashboard.student") })}
          </h1>
          <p className="text-muted-foreground">{t("student.dashboard.subtitle")}</p>
        </div>
        {profileError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.requiredElectives")}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{studentData.requiredElectives.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {studentData.requiredElectives.courses} {t("student.dashboard.courses")},{" "}
                    {studentData.requiredElectives.exchange} {t("student.dashboard.exchange")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.selectedElectives")}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{studentData.selectedElectives.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {studentData.selectedElectives.courses} {t("student.dashboard.courses")},{" "}
                    {studentData.selectedElectives.exchange} {t("student.dashboard.exchange")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.pendingSelections")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{studentData.pendingSelections.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {studentData.pendingSelections.courses} {t("student.dashboard.courses")},{" "}
                    {studentData.pendingSelections.exchange} {t("student.dashboard.exchange")}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("student.dashboard.yourInfo")}</CardTitle>
              <CardDescription>{t("student.dashboard.academicDetails")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.name")}:</dt>
                    <dd>{studentData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.degree")}:</dt>
                    <dd>{studentData.degree}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.year")}:</dt>
                    <dd>{studentData.year}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.group")}:</dt>
                    <dd>{studentData.group}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.email")}:</dt>
                    <dd>{studentData.email}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("student.dashboard.upcomingDeadlines")}</CardTitle>
              <CardDescription>{t("student.dashboard.importantDates")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isDeadlinesLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : upcomingDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deadline.title}</p>
                        <p className="text-sm text-muted-foreground">{new Date(deadline.date).toLocaleDateString()}</p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                          deadline.daysLeft < 7
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : deadline.daysLeft < 30
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {deadline.daysLeft} {t("student.dashboard.daysLeft")}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">{t("student.dashboard.noDeadlines")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
