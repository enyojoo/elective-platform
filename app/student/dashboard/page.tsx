"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, Calendar, ClipboardList, AlertCircle } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useRouter } from "next/navigation"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import {
  useCachedStudentCourseSelections,
  useCachedStudentExchangeSelections,
  useCachedAvailableElectives,
} from "@/hooks/use-cached-student-selections"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate, calculateDaysLeft } from "@/lib/utils"

// Cache constants
const DEADLINES_CACHE_KEY = "studentDashboardDeadlines"
const USER_ID_CACHE_KEY = "studentDashboardUserId"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Cache helper functions
const getCachedData = (key: string): any | null => {
  try {
    const cachedData = localStorage.getItem(key)
    if (!cachedData) return null

    const parsed = JSON.parse(cachedData)

    // Check if cache is expired
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key)
      return null
    }

    return parsed.data
  } catch (error) {
    console.error(`Error reading from cache (${key}):`, error)
    return null
  }
}

const setCachedData = (key: string, data: any) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch (error) {
    console.error(`Error writing to cache (${key}):`, error)
  }
}

interface DeadlineItem {
  id: string
  title: string
  date: string
  daysLeft: number
  type: "course" | "exchange"
}

export default function StudentDashboard() {
  const { t, language } = useLanguage()
  const { isSubdomainAccess, institution } = useInstitution()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Use a ref to track if this is the initial mount
  const isInitialMount = useRef(true)

  // State for user ID with caching
  const [userId, setUserId] = useState<string | undefined>(() => {
    // Try to get userId from cache on initial render
    if (typeof window !== "undefined") {
      try {
        const cachedUserId = getCachedData(USER_ID_CACHE_KEY)
        return cachedUserId || undefined
      } catch (e) {
        return undefined
      }
    }
    return undefined
  })

  // State for loading
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true)
  const [isValidatingRole, setIsValidatingRole] = useState(true)

  // Fetch current user ID and validate role
  useEffect(() => {
    const fetchAndValidateUser = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()

        if (authError || !authData?.user) {
          console.error("Auth error:", authError)
          router.push("/student/login")
          return
        }

        const currentUserId = authData.user.id
        console.log("Current authenticated user ID:", currentUserId)

        // Check the user's role in the profiles table
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, role, institution_id")
          .eq("id", currentUserId)
          .single()

        if (profileError || !profileData) {
          console.error("Profile fetch error:", profileError)
          router.push("/student/login")
          return
        }

        console.log("User profile data:", profileData)

        // IMPORTANT: Check if the user is actually a student
        if (profileData.role !== "student") {
          console.log(`User has role '${profileData.role}', not 'student'. Redirecting...`)

          // Clear any cached student data
          localStorage.removeItem(USER_ID_CACHE_KEY)
          localStorage.removeItem(DEADLINES_CACHE_KEY)

          // Redirect based on their actual role
          if (profileData.role === "manager") {
            router.push("/manager/dashboard")
          } else if (profileData.role === "admin") {
            router.push("/admin/dashboard")
          } else {
            router.push("/student/login")
          }
          return
        }

        // User is a valid student, proceed
        setUserId(currentUserId)
        setCachedData(USER_ID_CACHE_KEY, currentUserId)
        setIsValidatingRole(false)
      } catch (error) {
        console.error("Error validating user:", error)
        router.push("/student/login")
      }
    }

    fetchAndValidateUser()
  }, [supabase, router])

  // Fetch student profile using the cached hook
  const { profile, isLoading: isLoadingProfile, error: profileError } = useCachedStudentProfile(userId)

  // Fetch student selections
  const { selections: courseSelections, isLoading: isCourseSelectionsLoading } =
    useCachedStudentCourseSelections(userId)
  const { selections: exchangeSelections, isLoading: isExchangeSelectionsLoading } =
    useCachedStudentExchangeSelections(userId)
  const { electives: availableElectives, isLoading: isElectivesLoading } = useCachedAvailableElectives()

  // State for deadlines
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([])

  // Fetch upcoming deadlines with caching
  useEffect(() => {
    const fetchUpcomingDeadlines = async () => {
      if (!isSubdomainAccess || !institution?.id || isValidatingRole) return

      try {
        setIsLoadingDeadlines(true)

        // Check for cached data
        const cachedDeadlines = getCachedData(DEADLINES_CACHE_KEY)
        if (cachedDeadlines) {
          console.log("Using cached deadlines data")
          setUpcomingDeadlines(cachedDeadlines)
          setIsLoadingDeadlines(false)
          return
        }

        console.log("Fetching fresh deadlines data")

        // Get current date
        const now = new Date()

        // Fetch course electives with deadlines
        const { data: courseElectives, error: courseError } = await supabase
          .from("elective_courses")
          .select("id, name, name_ru, deadline, status")
          .eq("institution_id", institution.id)
          .eq("status", "published")
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .order("deadline", { ascending: true })
          .limit(5)

        // Fetch exchange programs with deadlines
        const { data: exchangePrograms, error: exchangeError } = await supabase
          .from("elective_exchange")
          .select("id, name, name_ru, deadline, status")
          .eq("institution_id", institution.id)
          .eq("status", "published")
          .not("deadline", "is", null)
          .gte("deadline", now.toISOString())
          .order("deadline", { ascending: true })
          .limit(5)

        if (!courseError && !exchangeError) {
          // Process course electives
          const courseDeadlines = (courseElectives || []).map((item) => ({
            id: item.id,
            title: language === "ru" && item.name_ru ? item.name_ru : item.name,
            date: item.deadline,
            daysLeft: calculateDaysLeft(item.deadline),
            type: "course" as const,
          }))

          // Process exchange programs
          const exchangeDeadlines = (exchangePrograms || []).map((item) => ({
            id: item.id,
            title: language === "ru" && item.name_ru ? item.name_ru : item.name,
            date: item.deadline,
            daysLeft: calculateDaysLeft(item.deadline),
            type: "exchange" as const,
          }))

          // Combine and sort by closest deadline
          const allDeadlines = [...courseDeadlines, ...exchangeDeadlines]
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5) // Take top 5 closest deadlines

          setUpcomingDeadlines(allDeadlines)

          // Cache the data
          setCachedData(DEADLINES_CACHE_KEY, allDeadlines)
        }
      } catch (error) {
        console.error("Error fetching upcoming deadlines:", error)
      } finally {
        setIsLoadingDeadlines(false)
      }
    }

    fetchUpcomingDeadlines()
  }, [supabase, isSubdomainAccess, institution?.id, language, isValidatingRole])

  // Ensure this page is only accessed via subdomain
  useEffect(() => {
    if (!isSubdomainAccess) {
      router.push("/institution-required")
    }
  }, [isSubdomainAccess, router])

  // Log when component mounts/unmounts to track re-renders
  useEffect(() => {
    console.log("Student Dashboard mounted")

    // Mark that we're no longer on initial mount
    isInitialMount.current = false

    return () => {
      console.log("Student Dashboard unmounted")
    }
  }, [])

  // Calculate student data from profile and selections
  const studentData = {
    name: profile?.full_name || "-",
    email: profile?.email || "-",
    degree: profile?.degree?.name || "Not specified",
    year: profile?.year || "Not specified",
    group: profile?.group?.name || "Not assigned",
    requiredElectives: {
      courses: availableElectives.courses.length || 0,
      exchange: availableElectives.exchanges.length || 0,
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

  const isLoading =
    isValidatingRole ||
    isLoadingProfile ||
    isCourseSelectionsLoading ||
    isExchangeSelectionsLoading ||
    isElectivesLoading

  if (!isSubdomainAccess || isValidatingRole) {
    return null // Don't render anything while redirecting or validating
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
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
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{studentData.requiredElectives.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {studentData.requiredElectives.courses} {t("student.dashboard.courses")},{" "}
                {studentData.requiredElectives.exchange} {t("student.dashboard.exchange")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.selectedElectives")}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{studentData.selectedElectives.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {studentData.selectedElectives.courses} {t("student.dashboard.courses")},{" "}
                {studentData.selectedElectives.exchange} {t("student.dashboard.exchange")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.pendingSelections")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{studentData.pendingSelections.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {studentData.pendingSelections.courses} {t("student.dashboard.courses")},{" "}
                {studentData.pendingSelections.exchange} {t("student.dashboard.exchange")}
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
