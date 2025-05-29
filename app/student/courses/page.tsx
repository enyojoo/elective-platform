"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, Clock, Info } from "lucide-react"
import { UserRole } from "@/lib/types" // Assuming Semester and SelectionStatus might be used from here
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useCachedStudentElectiveCoursesPageData } from "@/hooks/use-cached-student-selections" // Updated hook
import { useRouter } from "next/navigation"

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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
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
            return;
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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setStudentId(undefined);
        setInstitutionId(undefined);
        router.push('/student/login');
      } else if (event === 'SIGNED_IN' && session) {
        fetchUserData(); // Re-fetch user data on sign-in
      }
    });

    return () => subscription.unsubscribe();
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
      return new Date(dateString).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  const getStudentSelectionForPack = (packId: string): StudentCourseSelection | undefined => {
    return courseSelections.find(sel => sel.elective_courses_id === packId)
  }

  const getPackDisplayStatus = (pack: ElectiveCoursePack) => {
    const studentSelection = getStudentSelectionForPack(pack.id)
    const now = new Date()
    const deadlineDate = new Date(pack.deadline)

    if (studentSelection) {
      switch (studentSelection.status) {
        case "approved": return { text: t('student.courses.statusApproved'), Icon: CheckCircle, color: "text-green-600", badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
        case "pending": return { text: t('student.courses.statusPending'), Icon: Clock, color: "text-yellow-600", badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" };
        case "rejected": return { text: t('student.courses.statusRejected'), Icon: AlertCircle, color: "text-red-600", badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
      }
    }
    if (pack.status === "draft") return { text: t('student.courses.comingSoon'), Icon: Info, color: "text-gray-500", badgeClass: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" };
    if (pack.status === "closed" || now > deadlineDate) return { text: t('student.courses.statusClosed'), Icon: AlertCircle, color: "text-red-500", badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" };
    if (pack.status === "published" && now <= deadlineDate) return { text: t('student.courses.statusOpen'), Icon: CheckCircle, color: "text-blue-600", badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    
    return { text: t('student.courses.statusUnknown'), Icon: Info, color: "text-gray-500", badgeClass: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200" };
  }
  
  const getCardBorderClass = (pack: ElectiveCoursePack) => {
    const studentSelection = getStudentSelectionForPack(pack.id);
    if (studentSelection) {
      if (studentSelection.status === "approved") return "border-green-500 bg-green-50/30 dark:bg-green-950/10";
      if (studentSelection.status === "pending") return "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10";
      if (studentSelection.status === "rejected") return \"border-red-500 bg-red-50/30 dark:bg-red-950/
