"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import {
  Download,
  CheckCircle,
  Clock,
  Info,
  BookOpen,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  UploadCloud,
  Users,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter as ShadDialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { uploadStatement } from "@/lib/file-utils"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { cancelCourseSelection } from "@/app/actions/student-selections"

// Assuming these types/enums are defined elsewhere and passed as props or imported
// For example:
// import { ElectivePack, Course, CourseSelection, UserProfile, SelectionStatus } from '@/types';
// import { useTranslation } from 'react-i18next'; // Or your i18n solution

// Mock types for demonstration if not available
// enum SelectionStatus {
//   DRAFT = "draft",
//   PENDING = "pending",
//   APPROVED = "approved",
//   REJECTED = "rejected",
// }

type ElectivePack = {
  id: string
  name: string
  max_selections: number
  status: "draft" | "published" | "archived" // Assuming status for the pack itself
  syllabus_template_url?: string | null // Path to template in Supabase storage
  // ... other properties
}

type Course = {
  id: string
  name: string
  name_en: string
  name_ru: string
  instructor_en: string
  instructor_ru: string
  description_en: string
  description_ru: string
  max_students: number | null | undefined
  current_students: number | null | undefined
  teacher: string
  // ... other properties
}

type CourseSelection = {
  id: string
  student_id: string
  elective_courses_id: string
  selected_course_ids: string[]
  status: SelectionStatus
  statement_url?: string | null // Path to student's uploaded statement in Supabase storage
  // ... other properties
}

type UserProfile = {
  id: string
  // ... other properties
}

interface ElectivePageProps {
  params: {
    packId: string
  }
}

interface ElectivePackPageClientProps {
  electiveData: ElectivePack
  courses: Course[] // Assuming courses are also passed if needed for other parts
  existingSelection: CourseSelection | null
  profile: UserProfile // Student's profile
  // packId: string // Already in electiveData.id
}

// Utility to get filename from a path
const getFileNameFromPath = (path: string | null | undefined): string | null => {
  if (!path) return null
  const name = path.substring(path.lastIndexOf("/") + 1)
  try {
    return decodeURIComponent(name)
  } catch (e) {
    return name // Fallback if decoding fails
  }
}

export default function ElectivePage({ params }: ElectivePageProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<any>(null)
  const [uploadedStatement, setUploadedStatement] = useState<File | null>(null)
  const [isUploadingStatement, setIsUploadingStatement] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const [electiveCourseData, setElectiveCourseData] = useState<any>(null)
  const [individualCourses, setIndividualCourses] = useState<any[]>([])
  const [existingSelectionRecord, setExistingSelectionRecord] = useState<any>(null)
  const [selectedIndividualCourseIds, setSelectedIndividualCourseIds] = useState<string[]>([])

  const packId = params.packId

  const loadData = useCallback(async () => {
    if (profileLoading) return
    if (profileError) {
      setFetchError(`Failed to load profile: ${profileError}`)
      setIsLoadingPage(false)
      return
    }
    if (!profile?.id) {
      setFetchError("Student profile not loaded or incomplete.")
      setIsLoadingPage(false)
      return
    }

    setIsLoadingPage(true)
    setFetchError(null)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: ecData, error: ecError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .single()

      if (ecError) throw ecError
      if (!ecData) throw new Error("Elective course pack not found.")
      setElectiveCourseData(ecData)

      let courseUuids: string[] = []
      if (ecData.courses && typeof ecData.courses === "string") {
        try {
          const parsed = JSON.parse(ecData.courses)
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
            courseUuids = parsed
          }
        } catch (e) {
          console.error("Error parsing 'courses' JSON from elective_courses:", e)
        }
      } else if (Array.isArray(ecData.courses) && ecData.courses.every((item: any) => typeof item === "string")) {
        courseUuids = ecData.courses
      }

      // After fetching courses, get current enrollment counts
      if (courseUuids.length > 0) {
        const { data: fetchedCourses, error: coursesError } = await supabase
          .from("courses")
          .select("id, name_en, name_ru, instructor_en, instructor_ru, description_en, description_ru, max_students")
          .in("id", courseUuids)

        if (coursesError) throw coursesError

        // Get current enrollment counts for each course (pending + approved)
        const { data: enrollmentCounts, error: enrollmentError } = await supabase
          .from("course_selections")
          .select("selected_course_ids, status")
          .eq("elective_courses_id", packId)
          .in("status", ["pending", "approved"])

        if (enrollmentError) throw enrollmentError

        // Calculate current students for each course
        const coursesWithEnrollment = fetchedCourses?.map((course) => {
          const currentStudents =
            enrollmentCounts?.reduce((count, selection) => {
              if (selection.selected_course_ids && selection.selected_course_ids.includes(course.id)) {
                return count + 1
              }
              return count
            }, 0) || 0

          return {
            ...course,
            current_students: currentStudents,
          }
        })

        const fetchedCoursesMap = new Map(coursesWithEnrollment?.map((fc) => [fc.id, fc]))
        const orderedFetchedCourses = courseUuids.map((uuid) => fetchedCoursesMap.get(uuid)).filter(Boolean)
        setIndividualCourses(orderedFetchedCourses || [])
      } else {
        setIndividualCourses([])
      }

      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("student_id", profile.id)
        .eq("elective_courses_id", packId)
        .maybeSingle()

      if (selectionError) throw selectionError
      setExistingSelectionRecord(selectionData)

      // Example: If 'course_selections' table has a 'selected_course_ids' (TEXT[]) column
      // setSelectedIndividualCourseIds(selectionData?.selected_course_ids || []);
      // For now, keeping it simple as the schema detail for this is pending
      setSelectedIndividualCourseIds(selectionData?.selected_course_ids || [])
    } catch (error: any) {
      setFetchError(error.message || "Failed to load elective course details.")
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsLoadingPage(false)
    }
  }, [profile, profileLoading, profileError, packId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleCourseSelection = (individualCourseId: string) => {
    setSelectedIndividualCourseIds((prevSelected) => {
      if (prevSelected.includes(individualCourseId)) {
        return prevSelected.filter((id) => id !== individualCourseId)
      } else {
        if (prevSelected.length < (electiveCourseData?.max_selections || Number.POSITIVE_INFINITY)) {
          return [...prevSelected, individualCourseId]
        }
        toast({
          title: t("student.courses.maxSelectionsReached"),
          description: t("student.courses.maxSelectionsReachedDesc", { count: electiveCourseData?.max_selections }),
          variant: "warning",
        })
        return prevSelected
      }
    })
  }

  const handleSubmit = async () => {
    const statementRequired = !!electiveCourseData?.syllabus_template_url

    if (!profile?.id) {
      toast({ title: "Missing Information", description: "Profile not loaded.", variant: "destructive" })
      return
    }
    if (!profile?.institution_id) {
      toast({
        title: "Missing Information",
        description: "Institution ID not found in profile.",
        variant: "destructive",
      })
      return
    }
    if (statementRequired && !uploadedStatement && !existingSelectionRecord?.statement_url) {
      toast({ title: "Missing Information", description: "Statement is required.", variant: "destructive" })
      return
    }
    if (selectedIndividualCourseIds.length === 0 && (electiveCourseData?.max_selections || 0) > 0) {
      toast({ title: "No Courses Selected", description: "Please select at least one course.", variant: "destructive" })
      return
    }
    if (selectedIndividualCourseIds.length > (electiveCourseData?.max_selections || Number.POSITIVE_INFINITY)) {
      toast({
        title: "Too Many Courses",
        description: `You can select at most ${electiveCourseData?.max_selections} courses.`,
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      let statementUrlToSave = existingSelectionRecord?.statement_url

      if (uploadedStatement) {
        setIsUploadingStatement(true)
        statementUrlToSave = await uploadStatement(uploadedStatement, profile.id, packId)
        setIsUploadingStatement(false)
      }

      if (statementRequired && !statementUrlToSave) {
        throw new Error("Statement is required and was not uploaded.")
      }

      const selectionPayload: any = {
        student_id: profile.id,
        elective_courses_id: packId,
        status: SelectionStatus.PENDING,
        selected_course_ids: selectedIndividualCourseIds, // Store the selected course IDs
        institution_id: profile.institution_id, // Add this line
        authorized_by: studentName.trim(), // Add this line
      }
      if (statementUrlToSave) {
        selectionPayload.statement_url = statementUrlToSave
      }

      if (existingSelectionRecord) {
        const { error } = await supabase
          .from("course_selections")
          .update(selectionPayload)
          .eq("id", existingSelectionRecord.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("course_selections").insert(selectionPayload).select().single()
        if (error) throw error
      }

      toast({ title: "Selection submitted", description: "Your course selection has been submitted successfully." })
      window.location.href = "/student/courses"
    } catch (error: any) {
      console.error("Submission error:", error)
      toast({ title: "Submission failed", description: error.message || "An error occurred.", variant: "destructive" })
    } finally {
      setSubmitting(false)
      setIsUploadingStatement(false)
      setConfirmDialogOpen(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ title: "Invalid file type", description: "Please upload a PDF file", variant: "destructive" })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        toast({ title: "File too large", description: "Please upload a file smaller than 5MB", variant: "destructive" })
        return
      }
      setUploadedStatement(file)
      toast({ title: "File selected", description: `"${file.name}" ready for upload.` })
    }
  }

  const handleDownloadStatementTemplate = async () => {
    if (!electiveCourseData?.syllabus_template_url) {
      toast({ title: "No template", description: "Statement template is not available.", variant: "destructive" })
      return
    }
    setDownloadingStatement(true)
    try {
      window.open(electiveCourseData.syllabus_template_url, "_blank")
    } catch (error) {
      toast({ title: "Download failed", variant: "destructive" })
    } finally {
      setDownloadingStatement(false)
    }
  }

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const selectionProgress =
    electiveCourseData?.max_selections && electiveCourseData.max_selections > 0
      ? (selectedIndividualCourseIds.length / electiveCourseData.max_selections) * 100
      : 0

  const isDeadlinePassed = electiveCourseData?.deadline ? new Date(electiveCourseData.deadline) < new Date() : false
  const currentSelectionStatus = existingSelectionRecord?.status as SelectionStatus | undefined

  const getStatusAlert = () => {
    if (currentSelectionStatus === SelectionStatus.APPROVED) {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (currentSelectionStatus === SelectionStatus.PENDING) {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (currentSelectionStatus === SelectionStatus.REJECTED) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionRejected")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionRejectedDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (electiveCourseData?.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>{t("student.courses.comingSoonDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (isDeadlinePassed) {
      return (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.deadlinePassed")}</AlertTitle>
          <AlertDescription>{t("student.courses.deadlinePassedDesc")}</AlertDescription>
        </Alert>
      )
    }
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
        <AlertDescription>
          {t("student.courses.selectionPeriodDesc")} {electiveCourseData?.max_selections} {t("student.courses.until")}{" "}
          {electiveCourseData?.deadline && formatDateDisplay(electiveCourseData.deadline)}.
        </AlertDescription>
      </Alert>
    )
  }

  if (profileLoading || isLoadingPage) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <PageSkeleton />
      </DashboardLayout>
    )
  }
  if (fetchError) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Page</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }
  if (!electiveCourseData) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="p-4 text-center">{t("student.courses.notFound")}</div>
      </DashboardLayout>
    )
  }

  const electivePackName =
    language === "ru" && electiveCourseData.name_ru ? electiveCourseData.name_ru : electiveCourseData.name
  const canSubmit =
    !isDeadlinePassed && electiveCourseData.status !== "draft" && currentSelectionStatus !== SelectionStatus.APPROVED

  const handleCancelSelection = async () => {
    if (!profile?.id || !electiveCourseData?.id) {
      toast({ title: "Error", description: "Cannot cancel selection. Missing information.", variant: "destructive" })
      return
    }
    if (!existingSelectionRecord) {
      toast({ title: "No Selection", description: "There is no selection to cancel.", variant: "destructive" })
      return
    }

    setIsCancelling(true)
    const formData = new FormData()
    formData.append("studentId", profile.id)
    formData.append("electiveCoursesId", electiveCourseData.id)

    const result = await cancelCourseSelection(formData)

    if (result.success) {
      toast({ title: "Selection Cancelled", description: result.message })
      setExistingSelectionRecord(null)
      setSelectedIndividualCourseIds([])
      setUploadedStatement(null)
      // await loadData(); // Optionally reload all data
    } else {
      toast({ title: "Cancellation Failed", description: result.error, variant: "destructive" })
    }
    setIsCancelling(false)
  }

  const statementRequiredForPack = !!electiveCourseData?.syllabus_template_url
  const isStatementHandled =
    !statementRequiredForPack || !!uploadedStatement || !!existingSelectionRecord?.statement_url
  const areCoursesSelected = selectedIndividualCourseIds.length > 0 || (electiveCourseData?.max_selections || 0) === 0

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <Link href="/student/courses" passHref>
            <Button variant="outline" size="icon" aria-label={t("student.courses.backToCourses")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{electivePackName}</h1>
            <p className="text-sm text-muted-foreground">{t("student.courses.selectIndividualCourses")}</p>
          </div>
        </div>

        {getStatusAlert()}

        <Card
          className={
            currentSelectionStatus === SelectionStatus.APPROVED
              ? "border-green-200 dark:border-green-800"
              : currentSelectionStatus === SelectionStatus.PENDING
                ? "border-yellow-200 dark:border-yellow-800"
                : ""
          }
        >
          <CardHeader>
            <CardTitle>{t("student.courses.selectionProgress")}</CardTitle>
            <CardDescription>
              {t("student.courses.selectedOutOf")} {selectedIndividualCourseIds.length} {t("student.courses.of")}{" "}
              {electiveCourseData.max_selections || 0} {t("student.courses.allowedCourses")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={selectionProgress}
              className={`h-3 ${currentSelectionStatus === SelectionStatus.APPROVED ? "bg-green-100 dark:bg-green-950 [&>*]:bg-green-600" : currentSelectionStatus === SelectionStatus.PENDING ? "bg-yellow-100 dark:bg-yellow-950 [&>*]:bg-yellow-500" : "[&>*]:bg-primary"}`}
            />
            {(electiveCourseData.max_selections || 0) > 0 && (
              <p className="mt-2.5 text-sm text-muted-foreground">
                {selectedIndividualCourseIds.length === electiveCourseData.max_selections
                  ? t("student.courses.maxSelections")
                  : `${t("student.courses.canSelectMore")} ${electiveCourseData.max_selections - selectedIndividualCourseIds.length} ${electiveCourseData.max_selections - selectedIndividualCourseIds.length === 1 ? t("student.courses.moreCourse") : t("student.courses.moreCourses")}`}
              </p>
            )}
          </CardContent>
        </Card>

        {statementRequiredForPack && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t("student.statement.title")}
              </CardTitle>
              <CardDescription>{t("student.statement.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {electiveCourseData.syllabus_template_url && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent"
                  onClick={handleDownloadStatementTemplate}
                  disabled={downloadingStatement || electiveCourseData.status === "draft"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingStatement ? t("student.statement.downloading") : t("student.statement.downloadTemplate")}
                </Button>
              )}
              <div className="relative">
                <Label
                  htmlFor="statement-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold">{t("student.statement.clickToUpload")}</span>{" "}
                      {t("student.statement.orDragAndDrop")}
                    </p>
                    <p className="text-xs text-muted-foreground">{t("student.statement.pdfOnly")}</p>
                  </div>
                  <Input
                    id="statement-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isUploadingStatement || !canSubmit}
                    className="sr-only"
                  />
                </Label>
                {isUploadingStatement && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {t("student.statement.uploading")}
                  </div>
                )}
              </div>

              {uploadedStatement && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>{t("student.statement.fileReadyTitle")}</AlertTitle>
                  <AlertDescription>
                    {t("student.statement.fileReadyDesc", { fileName: uploadedStatement.name })}
                  </AlertDescription>
                </Alert>
              )}
              {existingSelectionRecord?.statement_url && !uploadedStatement && (
                <Alert variant="info">
                  <Info className="h-4 w-4" />
                  <AlertTitle>{t("student.statement.previouslyUploadedTitle")}</AlertTitle>
                  <AlertDescription>{t("student.statement.previouslyUploadedDesc")}</AlertDescription>
                  {/* Optionally, add a button to view/download the existing statement if URL is directly accessible */}
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {individualCourses.length > 0 ? (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {individualCourses.map((course) => {
              const isSelected = selectedIndividualCourseIds.includes(course.id)
              const isDisabledByMax =
                !isSelected &&
                selectedIndividualCourseIds.length >= (electiveCourseData.max_selections || Number.POSITIVE_INFINITY)
              return (
                <Card
                  key={course.id}
                  className={`flex flex-col h-full transition-all hover:shadow-md ${isSelected ? (currentSelectionStatus === SelectionStatus.APPROVED ? "border-green-500 ring-2 ring-green-500/50" : currentSelectionStatus === SelectionStatus.PENDING ? "border-yellow-500 ring-2 ring-yellow-500/50" : "border-primary ring-2 ring-primary/50") : "border-border"} ${isDisabledByMax ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">
                        {language === "ru" && course.name_ru ? course.name_ru : course.name_en || course.name}
                      </CardTitle>
                      {course.max_students !== null && course.max_students !== undefined && (
                        <span className="text-xs whitespace-nowrap text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {typeof course.current_students === "number" ? course.current_students : "?"}/
                          {course.max_students}
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-xs">
                      {language === "ru" && course.instructor_ru
                        ? course.instructor_ru
                        : course.instructor_en || course.teacher}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pb-3">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-sm text-primary hover:text-primary/80"
                      onClick={() => setViewingCourse(course)}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                      {t("student.courses.viewDescription")}
                    </Button>
                  </CardContent>
                  {canSubmit && (
                    <CardFooter className="pt-0 border-t mt-auto pt-3">
                      <div className="flex items-center space-x-2 w-full">
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleCourseSelection(course.id)}
                          disabled={isDisabledByMax || !canSubmit}
                          aria-label={t(
                            isSelected ? "student.courses.deselectCourse" : "student.courses.selectCourse",
                            {
                              courseName:
                                language === "ru" && course.name_ru ? course.name_ru : course.name_en || course.name,
                            },
                          )}
                        />
                        <Label
                          htmlFor={`course-${course.id}`}
                          className={`text-sm font-medium leading-none ${isDisabledByMax || !canSubmit ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        >
                          {isSelected ? t("student.courses.selected") : t("student.courses.select")}
                        </Label>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("student.courses.noIndividualCourses")}</p>
            </CardContent>
          </Card>
        )}

        {canSubmit && (
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-8">
            {existingSelectionRecord && canSubmit && (
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm(t("student.courses.confirmCancelSelection"))) {
                    handleCancelSelection()
                  }
                }}
                disabled={isCancelling || submitting}
                className="w-full sm:w-auto"
              >
                {isCancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t("student.courses.cancelSelection")}
              </Button>
            )}
            <Button
              onClick={() => {
                if (!areCoursesSelected && (electiveCourseData?.max_selections || 0) > 0) {
                  toast({ title: t("student.courses.selectMinOneCourse"), variant: "destructive" })
                } else if (!isStatementHandled) {
                  toast({
                    title: t("student.statement.requiredTitle"),
                    description: t("student.statement.requiredDesc"),
                    variant: "destructive",
                  })
                } else {
                  setConfirmDialogOpen(true)
                }
              }}
              disabled={submitting || isUploadingStatement || !areCoursesSelected || !isStatementHandled}
              className="w-full sm:w-auto px-8 py-3 text-base"
              size="lg"
            >
              {submitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
              {existingSelectionRecord ? t("student.courses.updateSelection") : t("student.courses.confirmSelection")}
            </Button>
          </div>
        )}

        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("student.courses.confirmYourSelection")}</DialogTitle>
              <DialogDescription>{t("student.courses.reviewSelection")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-2">{t("student.courses.selectedCourses")}:</h4>
                {selectedIndividualCourseIds.length > 0 ? (
                  <ul className="space-y-1 list-disc list-inside pl-1">
                    {selectedIndividualCourseIds.map((id) => {
                      const course = individualCourses.find((c) => c.id === id)
                      return (
                        <li key={id} className="text-sm">
                          {language === "ru" && course?.name_ru ? course.name_ru : course?.name_en || course?.name}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("student.courses.noCoursesSelectedYet")}</p>
                )}
              </div>
              {statementRequiredForPack && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">{t("student.statement.title")}:</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>
                      {uploadedStatement
                        ? t("student.statement.fileReadyToSubmit", {
                            fileName: uploadedStatement.name,
                            fileSize: Math.round(uploadedStatement.size / 1024),
                          })
                        : t("student.statement.previouslyUploadedWillBeUsed")}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2 pt-4 border-t mt-4">
                <Label htmlFor="student-name">
                  {t("student.courses.yourFullName")} ({t("student.courses.toAuthorize")})
                </Label>
                <Input
                  id="student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={t("student.courses.enterFullName")}
                  aria-required="true"
                />
              </div>
            </div>
            <ShadDialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !studentName.trim() ||
                  submitting ||
                  isUploadingStatement ||
                  !areCoursesSelected ||
                  !isStatementHandled
                }
              >
                {submitting || isUploadingStatement ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t("student.courses.submitSelection")}
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewingCourse} onOpenChange={(open) => !open && setViewingCourse(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {language === "ru" && viewingCourse?.name_ru
                  ? viewingCourse.name_ru
                  : viewingCourse?.name_en || viewingCourse?.name}
              </DialogTitle>
              <DialogDescription>
                {language === "ru" && viewingCourse?.instructor_ru
                  ? viewingCourse.instructor_ru
                  : viewingCourse?.instructor_en || viewingCourse?.teacher}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto prose prose-sm dark:prose-invert">
              {viewingCourse && selectedIndividualCourseIds.includes(viewingCourse.id) && (
                <Alert variant="info" className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>{t("student.courses.currentlySelected")}</AlertDescription>
                </Alert>
              )}
              <p className="whitespace-pre-wrap">
                {language === "ru" && viewingCourse?.description_ru
                  ? viewingCourse.description_ru
                  : viewingCourse?.description_en ||
                    viewingCourse?.description ||
                    t("student.courses.noDescriptionAvailable")}
              </p>
            </div>
            <ShadDialogFooter>
              <Button variant="outline" onClick={() => setViewingCourse(null)}>
                {t("student.courses.close")}
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
