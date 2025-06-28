"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, Calendar, ClipboardList, AlertCircle } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, calculateDaysLeft } from "@/lib/utils"
import { useDataCache } from "@/lib/data-cache-context"

interface DeadlineItem {
  id: string
  title: string
  date: string
  daysLeft: number
  type: "course" | "exchange"
}

interface ElectiveCounts {
  required: { courses: number; exchange: number; total: number }
  selected: { courses: number; exchange: number; total: number }
  pending: { courses: number; exchange: number; total: number }
}

export default function StudentDashboard() {
  const { t, language } = useLanguage()
  const { isSubdomainAccess, institution } = useInstitution()
  const supabase = getSupabaseBrowserClient()
  const { getCachedData, setCachedData } = useDataCache()

  // Use the robust profile hook. It handles its own loading and errors.
  const { profile, isLoading: isLoadingProfile, error: profileError } = useCachedStudentProfile()
  const userId = profile?.id

  const [electiveCounts, setElectiveCounts] = useState<ElectiveCounts>({
    required: { courses: 0, exchange: 0, total: 0 },
    selected: { courses: 0, exchange: 0, total: 0 },
    pending: { courses: 0, exchange: 0, total: 0 },
  })
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([])

  const [isLoadingElectiveCounts, setIsLoadingElectiveCounts] = useState(true)
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true)

  // Effect for fetching elective counts, depends on userId.
  useEffect(() => {
    if (!isSubdomainAccess || !institution?.id || !userId) {
      // If there's no userId yet, we can't fetch counts.
      // If the profile hook is loading, we should also be in a loading state.
      if (!isLoadingProfile) setIsLoadingElectiveCounts(false)
      return
    }

    const fetchElectiveCounts = async () => {
      const cacheKey = "studentElectiveCounts"
      const itemId = userId
      const cachedCounts = getCachedData<ElectiveCounts>(cacheKey, itemId)

      if (cachedCounts) {
        setElectiveCounts(cachedCounts)
        setIsLoadingElectiveCounts(false)
        return
      }

      setIsLoadingElectiveCounts(true)
      try {
        const { count: availableCoursesCount } = await supabase
          .from("elective_courses")
          .select("*", { count: "exact", head: true })
          .eq("institution_id", institution.id)
          .eq("status", "published")

        const { count: availableExchangeCount } = await supabase
          .from("elective_exchange")
          .select("*", { count: "exact", head: true })
          .eq("institution_id", institution.id)
          .eq("status", "published")

        const { data: courseSelections } = await supabase.from("course_selections").select("*").eq("student_id", userId)
        const { data: exchangeSelections } = await supabase
          .from("exchange_selections")
          .select("*")
          .eq("student_id", userId)

        const selectedCourses = courseSelections?.length || 0
        const selectedExchange = exchangeSelections?.length || 0
        const pendingCourses = courseSelections?.filter((s) => s.status === "pending")?.length || 0
        const pendingExchange = exchangeSelections?.filter((s) => s.status === "pending")?.length || 0

        const counts: ElectiveCounts = {
          required: {
            courses: availableCoursesCount || 0,
            exchange: availableExchangeCount || 0,
            total: (availableCoursesCount || 0) + (availableExchangeCount || 0),
          },
          selected: {
            courses: selectedCourses,
            exchange: selectedExchange,
            total: selectedCourses + selectedExchange,
          },
          pending: {
            courses: pendingCourses,
            exchange: pendingExchange,
            total: pendingCourses + pendingExchange,
          },
        }

        setElectiveCounts(counts)
        setCachedData(cacheKey, itemId, counts)
      } catch (error) {
        console.error("Error fetching elective counts:", error)
      } finally {
        setIsLoadingElectiveCounts(false)
      }
    }

    fetchElectiveCounts()
  }, [isSubdomainAccess, institution?.id, userId, isLoadingProfile, getCachedData, setCachedData, supabase])

  // Effect for fetching deadlines
  useEffect(() => {
    if (!isSubdomainAccess || !institution?.id) return

    const fetchUpcomingDeadlines = async () => {
      const cacheKey = "studentDeadlines"
      const itemId = institution.id
      const cachedDeadlines = getCachedData<DeadlineItem[]>(cacheKey, itemId)

      if (cachedDeadlines) {
        setUpcomingDeadlines(cachedDeadlines)
        setIsLoadingDeadlines(false)
        return
      }

      setIsLoadingDeadlines(true)
      try {
        const now = new Date()
        const { data: courseElectives } = await supabase
          .from("elective_courses")
          .select("id, name, name_ru, deadline, status")
          .eq("institution_id", institution.id)
          .eq("status", "published")
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .order("deadline", { ascending: true })
          .limit(5)

        const { data: exchangePrograms } = await supabase
          .from("elective_exchange")
          .select("id, name, name_ru, deadline, status")
          .eq("institution_id", institution.id)
          .eq("status", "published")
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .order("deadline", { ascending: true })
          .limit(5)

        const courseDeadlines = (courseElectives || []).map((item) => ({
          id: item.id,
          title: language === "ru" && item.name_ru ? item.name_ru : item.name,
          date: item.deadline,
          daysLeft: calculateDaysLeft(item.deadline),
          type: "course" as const,
        }))

        const exchangeDeadlines = (exchangePrograms || []).map((item) => ({
          id: item.id,
          title: language === "ru" && item.name_ru ? item.name_ru : item.name,
          date: item.deadline,
          daysLeft: calculateDaysLeft(item.deadline),
          type: "exchange" as const,
        }))

        const allDeadlines = [...courseDeadlines, ...exchangeDeadlines]
          .sort((a, b) => a.daysLeft - b.daysLeft)
          .slice(0, 5)

        setUpcomingDeadlines(allDeadlines)
        setCachedData(cacheKey, itemId, allDeadlines)
      } catch (error) {
        console.error("Error fetching upcoming deadlines:", error)
      } finally {
        setIsLoadingDeadlines(false)
      }
    }

    fetchUpcomingDeadlines()
  }, [isSubdomainAccess, institution?.id, language, getCachedData, setCachedData, supabase])

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoadingProfile ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              t("student.dashboard.welcome", { name: profile?.full_name || t("student.dashboard.student") })
            )}
          </h1>
          <p className="text-muted-foreground">{t("student.dashboard.subtitle")}</p>
        </div>

        {profileError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
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
              {isLoadingElectiveCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{electiveCounts.required.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {electiveCounts.required.courses} {t("student.dashboard.courses")}, {electiveCounts.required.exchange}{" "}
                {t("student.dashboard.exchange")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.selectedElectives")}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingElectiveCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{electiveCounts.selected.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {electiveCounts.selected.courses} {t("student.dashboard.courses")}, {electiveCounts.selected.exchange}{" "}
                {t("student.dashboard.exchange")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.pendingSelections")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingElectiveCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{electiveCounts.pending.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {electiveCounts.pending.courses} {t("student.dashboard.courses")}, {electiveCounts.pending.exchange}{" "}
                {t("student.dashboard.exchange")}
              </p>
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
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.name")}:</dt>
                    <dd>{profile?.full_name || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.degree")}:</dt>
                    <dd>{profile?.degree?.name || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.year")}:</dt>
                    <dd>{profile?.year || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.group")}:</dt>
                    <dd>{profile?.group?.name || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("student.dashboard.email")}:</dt>
                    <dd>{profile?.email || "-"}</dd>
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
              {isLoadingDeadlines ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : upcomingDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deadline.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(deadline.date)}</p>
                      </div>
                      <Link
                        href={
                          deadline.type === "course"
                            ? `/student/courses/${deadline.id}`
                            : `/student/exchange/${deadline.id}`
                        }
                      >
                        <div
                          className={`px-2 py-1 rounded-md text-xs font-medium cursor-pointer ${
                            deadline.daysLeft < 7
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : deadline.daysLeft < 30
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {deadline.daysLeft} {t("student.dashboard.daysLeft")}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {t("student.dashboard.noUpcomingDeadlines", "No upcoming deadlines")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
