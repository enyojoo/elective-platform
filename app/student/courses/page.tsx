"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, Clock, Info } from "lucide-react"
import { UserRole } from "@/lib/types" // Assuming Semester and SelectionStatus might be used from here
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useCachedStudentElectiveCoursesPageData } from "@/hooks/use-cached-student-selections" // Updated hook
import { useRouter } from "next/navigation"
import Link from "next/link"

// Define interfaces for the data structures based on your Supabase schema
interface ElectiveCoursePack {
  id: string
  name: string
  name_ru: string | null
  status: "draft" | "published" | "closed" | "archived" // from elective_courses table
  deadline: string // Assuming ISO date string
  max_selections: number // Max sub-courses a student can pick from this pack
  syllabus_template_url: string | null
  courses: any[] // JSONB array of actual course items
  institution_id: string
  created_at: string
  updated_at: string
}

interface StudentCourseSelection {
  id: string
  student_id: string
  elective_courses_id: string // FK to ElectiveCoursePack.id
  status: "pending" | "approved" | "rejected" // from course_selections table
  statement_url: string | null
  created_at: string
  updated_at: string
  // Potentially a field like selected_sub_course_ids: string[] if you store that
}

export default function StudentCoursesPage() {
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
      setUserDataLoading(true)
      setAuthError(null)
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!session) {
          router.push("/student/login")
          return
        }
        setStudentId(session.user.id)

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("institution_id, role")
          .eq("id", session.user.id)
          .single()

        if (profileError) throw profileError
        if (!profile) throw new Error("Profile not found.")
        if (profile.role !== UserRole.STUDENT) {
          setAuthError("Access denied. Student role required.")
          // Redirect or show error
          router.push("/student/login") // Or a generic error page
          return
        }
        if (!profile.institution_id) {
          setAuthError("Institution ID not found in your profile. Please contact support.")
          return
        }
        setInstitutionId(profile.institution_id)
      } catch (err: any) {
        console.error("Auth or profile fetch error:", err)
        setAuthError(err.message || "Failed to load user data.")
        // router.push("/student/login")
      } finally {
        setUserDataLoading(false)
      }
    }
    fetchUserData()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setStudentId(undefined)
        setInstitutionId(undefined)
        router.push("/student/login")
      } else if (event === "SIGNED_IN" && session) {
        fetchUserData() // Re-fetch user data on sign-in
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const {
    electiveCourses, // These are ElectiveCoursePack[]
    courseSelections, // These are StudentCourseSelection[]
    isLoading: dataLoading,
    error: dataError,
    refreshData,
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
    if (pack.status === "closed" || now > deadlineDate)
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
    return "border-gray-200 dark:border-gray-700"
  }

  if (isLoading) {
    return <div className="text-center py-4">{t("student.courses.loading")}</div>
  }

  if (authError) {
    return <div className="text-center text-red-500 py-4">{authError}</div>
  }

  if (dataError) {
    return <div className="text-center text-red-500 py-4">{dataError}</div>
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-semibold mb-4">{t("student.courses.title")}</h1>
      {electiveCourses && electiveCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {electiveCourses.map((pack) => {
            const { text, Icon, color, badgeClass } = getPackDisplayStatus(pack)
            const borderClass = getCardBorderClass(pack)
            return (
              <div key={pack.id} className={`rounded-lg border ${borderClass} shadow-md overflow-hidden`}>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">
                      {language === "ru" && pack.name_ru ? pack.name_ru : pack.name}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
                    >
                      <Icon className={`w-4 h-4 mr-1 ${color}`} />
                      {text}
                    </span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                    {t("student.courses.deadline")}: {formatDate(pack.deadline)}
                  </p>
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/student/courses/${pack.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-300"
                    >
                      {t("student.courses.viewDetails")}
                      <svg
                        className="w-3 h-3 ml-2.5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 18 18"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11v4.833A1.169 1.169 0 0 1 13.833 17H2.167A1.169 1.169 0 0 1 1 15.833V4.167A1.169 1.169 0 0 1 2.167 3h4.618m9.015 7.5L13 13M3.736 5h10.528"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-4">{t("student.courses.noCourses")}</div>
      )}
    </div>
  )
}
