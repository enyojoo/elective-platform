"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, GlobeIcon, AlertCircle } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useCachedManagerProfile } from "@/hooks/use-cached-manager-profile"
import { Skeleton } from "@/components/ui/skeleton"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, calculateDaysLeft } from "@/lib/utils"
import { useDataCache } from "@/lib/data-cache-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DeadlineItem {
  id: string
  title: string
  date: string
  daysLeft: number
  type: "course" | "exchange"
}

interface ElectiveCounts {
  courses: number
  exchange: number
}

export default function ManagerDashboard() {
  const { t, language } = useLanguage()
  const { isSubdomainAccess, institution } = useInstitution()
  const supabase = getSupabaseBrowserClient()
  const { getCachedData, setCachedData } = useDataCache()

  // Use the robust profile hook. It handles its own loading and errors.
  const { profile, isLoading: isLoadingProfile, error: profileError } = useCachedManagerProfile()

  const [electiveCounts, setElectiveCounts] = useState<ElectiveCounts>({ courses: 0, exchange: 0 })
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([])

  const [isLoadingCounts, setIsLoadingCounts] = useState(true)
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true)

  // Effect for fetching elective counts
  useEffect(() => {
    if (!isSubdomainAccess || !institution?.id) return

    const fetchElectiveCounts = async () => {
      const cacheKey = "managerElectiveCounts"
      const itemId = institution.id
      const cachedCounts = getCachedData<ElectiveCounts>(cacheKey, itemId)

      if (cachedCounts) {
        setElectiveCounts(cachedCounts)
        setIsLoadingCounts(false)
        return
      }

      setIsLoadingCounts(true)
      try {
        const { count: courseCount, error: courseError } = await supabase
          .from("elective_courses")
          .select("*", { count: "exact", head: true })
          .eq("institution_id", institution.id)

        const { count: exchangeCount, error: exchangeError } = await supabase
          .from("elective_exchange")
          .select("*", { count: "exact", head: true })
          .eq("institution_id", institution.id)

        if (courseError || exchangeError) {
          throw new Error(courseError?.message || exchangeError?.message)
        }

        const counts = { courses: courseCount || 0, exchange: exchangeCount || 0 }
        setElectiveCounts(counts)
        setCachedData(cacheKey, itemId, counts)
      } catch (error) {
        console.error("Error fetching elective counts:", error)
      } finally {
        setIsLoadingCounts(false)
      }
    }

    fetchElectiveCounts()
  }, [isSubdomainAccess, institution?.id, getCachedData, setCachedData, supabase])

  // Effect for fetching deadlines
  useEffect(() => {
    if (!isSubdomainAccess || !institution?.id) return

    const fetchUpcomingDeadlines = async () => {
      const cacheKey = "managerDeadlines"
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
        const { data: courseElectives, error: courseError } = await supabase
          .from("elective_courses")
          .select("id, name, name_ru, deadline, status")
          .eq("institution_id", institution.id)
          .eq("status", "published")
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .order("deadline", { ascending: true })
          .limit(5)

        const { data: exchangePrograms, error: exchangeError } = await supabase
          .from("elective_exchange")
          .select("id, name, name_ru, deadline, status")
          .eq("institution_id", institution.id)
          .eq("status", "published")
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .order("deadline", { ascending: true })
          .limit(5)

        if (courseError || exchangeError) {
          throw new Error(courseError?.message || exchangeError?.message)
        }

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
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("manager.dashboard.title")}</h1>
        </div>

        {profileError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Dashboard</AlertTitle>
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("manager.dashboard.courseElectives")}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{electiveCounts.courses}</div>
              )}
              <p className="text-xs text-muted-foreground">{t("manager.dashboard.totalCourseElectives")}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manager/electives/course">{t("manager.dashboard.manageCourseElectives")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("manager.dashboard.exchangePrograms")}</CardTitle>
              <GlobeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingCounts ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{electiveCounts.exchange}</div>
              )}
              <p className="text-xs text-muted-foreground">{t("manager.dashboard.totalExchangePrograms")}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manager/electives/exchange">{t("manager.dashboard.manageExchangePrograms")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("manager.dashboard.yourInformation")}</CardTitle>
              <CardDescription>{t("manager.dashboard.managerDetails")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProfile ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("manager.dashboard.name")}:</dt>
                    <dd>{profile?.full_name || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("manager.dashboard.degree")}:</dt>
                    <dd>{profile?.degrees?.name || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("manager.dashboard.year")}:</dt>
                    <dd>{profile?.academic_year || "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">{t("manager.dashboard.email")}:</dt>
                    <dd>{profile?.email || "-"}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("manager.dashboard.upcomingDeadlines")}</CardTitle>
              <CardDescription>{t("manager.dashboard.importantDates")}</CardDescription>
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
                            ? `/manager/electives/course/${deadline.id}`
                            : `/manager/electives/exchange/${deadline.id}`
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
                          {deadline.daysLeft} {t("manager.dashboard.daysLeft")}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {t("manager.dashboard.noUpcomingDeadlines", "No upcoming deadlines")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
