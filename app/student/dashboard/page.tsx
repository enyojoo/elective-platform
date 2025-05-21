"use client"

import { useEffect, useState, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, ClipboardList, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { supabase } from "@/lib/supabase"
import { formatDate, calculateDaysLeft } from "@/lib/utils"
import Link from "next/link"

// Cache constants
const STUDENT_PROFILE_CACHE_KEY = "studentDashboardProfile"
const COURSE_SELECTIONS_CACHE_KEY = "studentDashboardCourseSelections"
const EXCHANGE_SELECTIONS_CACHE_KEY = "studentDashboardExchangeSelections"
const DEADLINES_CACHE_KEY = "studentDashboardDeadlines"
const USER_ID_CACHE_KEY = "studentDashboardUserId"
const CACHE_EXPIRY = 5 * 60 * 1000 // 5 minutes

// Cache helper functions
const getCachedData = (key: string): any | null => {
  try {
    if (typeof window === "undefined") return null

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
    if (typeof window === "undefined") return

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
  const { institution, isSubdomainAccess } = useInstitution()
  const router = useRouter()

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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isLoadingCourseSelections, setIsLoadingCourseSelections] = useState(true)
  const [isLoadingExchangeSelections, setIsLoadingExchangeSelections] = useState(true)
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true)

  // State for data
  const [profile, setProfile] = useState<any>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [courseSelections, setCourseSelections] = useState<any[]>([])
  const [exchangeSelections, setExchangeSelections] = useState<any[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([])

  // Fetch current user ID only once on mount
  useEffect(() => {
    const fetchUserId = async () => {
      // Skip if we already have a userId from cache
      if (userId) return

      try {
        const { data } = await supabase.auth.getUser()
        if (data?.user) {
          const newUserId = data.user.id
          setUserId(newUserId)
          // Cache the userId
          setCachedData(USER_ID_CACHE_KEY, newUserId)
        } else {
          // If no user is found, redirect to login
          router.push("/student/login")
        }
      } catch (error) {
        console.error("Error getting current user:", error)
      }
    }

    fetchUserId()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // Fetch student profile with caching
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!userId) return

      try {
        setIsLoadingProfile(true)
        setProfileError(null)

        // Try to get data from cache first
        const cachedProfile = getCachedData(STUDENT_PROFILE_CACHE_KEY)
        if (cachedProfile) {
          console.log("Using cached student profile")
          setProfile(cachedProfile)
          setIsLoadingProfile(false)
          return
        }

        console.log("Fetching student profile from API")

        // Fetch profile with related data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(`
            *,
            studentDetails:student_details(
              *,
              groups(
                *,
                programs(
                  *,
                  degrees(*)
                )
              )
            )
          `)
          .eq("id", userId)
          .eq("role", "student")
          .single()

        if (profileError) throw profileError

        // Save to cache
        setCachedData(STUDENT_PROFILE_CACHE_KEY, profileData)

        // Update state
        setProfile(profileData)
      } catch (error: any) {
        console.error("Error fetching student profile:", error)
        setProfileError(error.message)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchStudentProfile()
  }, [userId])

  // Fetch course selections with caching
  useEffect(() => {
    const fetchCourseSelections = async () => {
      if (!userId) return

      try {
        setIsLoadingCourseSelections(true)

        // Try to get data from cache first
        const cachedSelections = getCachedData(COURSE_SELECTIONS_CACHE_KEY)
        if (cachedSelections) {
          console.log("Using cached course selections")
          setCourseSelections(cachedSelections)
          setIsLoadingCourseSelections(false)
          return
        }

        console.log("Fetching course selections from API")

        // Fetch course selections
        const { data, error } = await supabase
          .from("student_course_selections")
          .select("*, elective_courses(*)")
          .eq("student_id", userId)

        if (error) throw error

        // Save to cache
        setCachedData(COURSE_SELECTIONS_CACHE_KEY, data)

        // Update state
        setCourseSelections(data || [])
      } catch (error) {
        console.error("Error fetching course selections:", error)
      } finally {
        setIsLoadingCourseSelections(false)
      }
    }

    fetchCourseSelections()
  }, [userId])

  // Fetch exchange selections with caching
  useEffect(() => {
    const fetchExchangeSelections = async () => {
      if (!userId) return

      try {
        setIsLoadingExchangeSelections(true)

        // Try to get data from cache first
        const cachedSelections = getCachedData(EXCHANGE_SELECTIONS_CACHE_KEY)
        if (cachedSelections) {
          console.log("Using cached exchange selections")
          setExchangeSelections(cachedSelections)
          setIsLoadingExchangeSelections(false)
          return
        }

        console.log("Fetching exchange selections from API")

        // Fetch exchange selections
        const { data, error } = await supabase
          .from("student_exchange_selections")
          .select("*, elective_exchange(*)")
          .eq("student_id", userId)

        if (error) throw error

        // Save to cache
        setCachedData(EXCHANGE_SELECTIONS_CACHE_KEY, data)

        // Update state
        setExchangeSelections(data || [])
      } catch (error) {
        console.error("Error fetching exchange selections:", error)
      } finally {
        setIsLoadingExchangeSelections(false)
      }
    }

    fetchExchangeSelections()
  }, [userId])

  // Fetch upcoming deadlines with caching
  useEffect(() => {
    const fetchUpcomingDeadlines = async () => {
      if (!isSubdomainAccess || !institution?.id) return

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
  }, [supabase, isSubdomainAccess, institution?.id, language])

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

  const isLoading = isLoadingProfile || isLoadingCourseSelections || isLoadingExchangeSelections || isLoadingDeadlines

  if (!isSubdomainAccess) {
    return null // Don't render anything while redirecting
  }

  if (isLoadingProfile && !profile) {
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
              {isLoadingProfile ? (
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
              {isLoadingCourseSelections || isLoadingExchangeSelections ? (
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
              {isLoadingCourseSelections || isLoadingExchangeSelections ? (
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
              {isLoadingProfile ? (
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
              {isLoadingDeadlines ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
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
