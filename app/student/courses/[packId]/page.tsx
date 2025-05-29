"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { Download, CheckCircle, Clock, Info, BookOpen, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"
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
import { useLanguage } from "@/lib/language-context" // Ensure this path is correct
import { useToast } from "@/hooks/use-toast"
import { uploadStatement } from "@/lib/file-utils"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { cancelCourseSelection } from "@/app/actions/student-selections"

interface IndividualCourseDisplayData {
  id: string
  name_en?: string
  name_ru?: string
  instructor_en?: string
  instructor_ru?: string
  description_en?: string
  description_ru?: string
  max_students?: number
  [key: string]: any // For other properties from the pack's JSON
}

interface ElectivePageProps {
  params: {
    packId: string
  }
}

export default function ElectivePage({ params }: ElectivePageProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { profile, isLoading: profileLoading, error: profileError } = useCachedStudentProfile()

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<IndividualCourseDisplayData | null>(null)
  const [uploadedStatement, setUploadedStatement] = useState<File | null>(null)
  const [isUploadingStatement, setIsUploadingStatement] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const [electiveCourseData, setElectiveCourseData] = useState<any>(null)
  const [individualCourses, setIndividualCourses] = useState<IndividualCourseDisplayData[]>([])
  const [existingSelectionRecord, setExistingSelectionRecord] = useState<any>(null)
  const [selectedIndividualCourseIds, setSelectedIndividualCourseIds] = useState<string[]>([])

  const packId = params.packId

  const loadData = useCallback(async () => {
    if (profileLoading) return
    if (profileError) {
      setFetchError(t("student.profileLoadError", `Failed to load profile: ${profileError}`))
      setIsLoadingPage(false)
      return
    }
    if (!profile?.id) {
      setFetchError(t("student.profileMissing", "Student profile not loaded or incomplete."))
      setIsLoadingPage(false)
      return
    }

    setIsLoadingPage(true)
    setFetchError(null)
    console.log(`[ElectivePage] Fetching data for packId: ${packId}, studentId: ${profile.id}`)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { data: ecData, error: ecError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .single()

      if (ecError) throw ecError
      if (!ecData) throw new Error(t("student.courses.packNotFound", "Elective course pack not found."))
      console.log("[ElectivePage] elective_courses data (pack):", ecData)
      setElectiveCourseData(ecData)

      let parsedPackCoursesDefinition: Array<{ id: string; [key: string]: any }> = []
      if (ecData.courses && typeof ecData.courses === "string") {
        try {
          parsedPackCoursesDefinition = JSON.parse(ecData.courses)
          if (!Array.isArray(parsedPackCoursesDefinition)) parsedPackCoursesDefinition = []
        } catch (e) {
          console.error("[ElectivePage] Error parsing elective_courses.courses JSON:", e)
          parsedPackCoursesDefinition = []
        }
      } else if (Array.isArray(ecData.courses)) {
        parsedPackCoursesDefinition = ecData.courses
      }
      console.log(
        "[ElectivePage] Parsed course definitions from elective_courses.courses:",
        parsedPackCoursesDefinition,
      )

      const courseIdsToFetch = parsedPackCoursesDefinition.map((pc) => pc.id).filter((id) => !!id)
      let detailedCoursesDataFromDB: IndividualCourseDisplayData[] = []

      if (courseIdsToFetch.length > 0) {
        console.log("[ElectivePage] Fetching details for course IDs:", courseIdsToFetch)
        const { data: coursesDetails, error: coursesDetailsError } = await supabase
          .from("courses")
          .select("id, name_en, name_ru, instructor_en, instructor_ru, description_en, description_ru, max_students")
          .in("id", courseIdsToFetch)

        if (coursesDetailsError) throw coursesDetailsError
        detailedCoursesDataFromDB = (coursesDetails || []) as IndividualCourseDisplayData[]
        console.log("[ElectivePage] Fetched detailed course data from 'courses' table:", detailedCoursesDataFromDB)
      }

      const mergedIndividualCourses = parsedPackCoursesDefinition.map((packCourseEntry) => {
        const detail = detailedCoursesDataFromDB.find((dc) => dc.id === packCourseEntry.id)
        const mergedCourse: IndividualCourseDisplayData = {
          ...packCourseEntry,
          id: packCourseEntry.id,
        }
        if (detail) {
          mergedCourse.name_en = detail.name_en
          mergedCourse.name_ru = detail.name_ru
          mergedCourse.instructor_en = detail.instructor_en
          mergedCourse.instructor_ru = detail.instructor_ru
          mergedCourse.description_en = detail.description_en
          mergedCourse.description_ru = detail.description_ru
          mergedCourse.max_students = detail.max_students
        } else {
          console.warn(`[ElectivePage] No details found in 'courses' table for course ID: ${packCourseEntry.id}`)
        }
        return mergedCourse
      })

      console.log("[ElectivePage] Merged individual courses with details:", mergedIndividualCourses)
      setIndividualCourses(mergedIndividualCourses)

      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("id, student_id, elective_courses_id, status, statement_url, selected_course_ids, authorized_by") // Fetch selected_course_ids and authorized_by
        .eq("student_id", profile.id)
        .eq("elective_courses_id", packId)
        .maybeSingle()

      if (selectionError) throw selectionError
      console.log("[ElectivePage] course_selections data (existing selection):", selectionData)
      setExistingSelectionRecord(selectionData)

      if (selectionData) {
        if (Array.isArray(selectionData.selected_course_ids)) {
          setSelectedIndividualCourseIds(selectionData.selected_course_ids)
          console.log(
            "[ElectivePage] Initial selected IDs from existing selection record:",
            selectionData.selected_course_ids,
          )
        } else {
          setSelectedIndividualCourseIds([]) // Ensure it's an array even if column is null/undefined
        }
        if (selectionData.authorized_by) {
          setStudentName(selectionData.authorized_by) // Pre-fill authorization name
        }
      } else {
        setSelectedIndividualCourseIds([])
        setStudentName("") // Clear if no existing selection
      }
    } catch (error: any) {
      console.error("[ElectivePage] Error fetching data:", error)
      setFetchError(error.message || t("student.courses.fetchError", "Failed to load elective course details."))
      toast({ title: t("error", "Error"), description: error.message, variant: "destructive" })
    } finally {
      setIsLoadingPage(false)
    }
  }, [profile?.id, profileLoading, profileError, packId, t]) // Added profile.id to dependencies

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
          title: t("student.courses.maxSelectionsReachedTitle", "Maximum Selections Reached"),
          description: t(
            "student.courses.maxSelectionsReachedDesc",
            `You can only select up to ${electiveCourseData?.max_selections || "N/A"} courses.`,
            { count: electiveCourseData?.max_selections || "N/A" },
          ),
          variant: "warning",
        })
        return prevSelected
      }
    })
  }

  const handleSubmit = async () => {
    // ... (validation logic as before)
    if (!profile?.id) {
      toast({
        title: t("error", "Error"),
        description: t("student.profileMissing", "Student profile is missing."),
        variant: "destructive",
      })
      return
    }
    if (!uploadedStatement && !existingSelectionRecord?.statement_url) {
      toast({
        title: t("student.statement.requiredTitle", "Statement Required"),
        description: t("student.statement.requiredDesc", "Please upload your signed statement."),
        variant: "destructive",
      })
      return
    }
    if (selectedIndividualCourseIds.length === 0 && (electiveCourseData?.max_selections || 0) > 0) {
      toast({
        title: t("student.courses.selectMinOneCourseTitle", "No Courses Selected"),
        description: t("student.courses.selectMinOneCourseDesc", "Please select at least one course."),
        variant: "destructive",
      })
      return
    }
    if (selectedIndividualCourseIds.length > (electiveCourseData?.max_selections || Number.POSITIVE_INFINITY)) {
      toast({
        title: t("student.courses.tooManyCoursesTitle", "Too Many Courses"),
        description: t(
          "student.courses.tooManyCoursesDesc",
          `You can select at most ${electiveCourseData?.max_selections} courses.`,
          { count: electiveCourseData?.max_selections },
        ),
        variant: "destructive",
      })
      return
    }
    if (!studentName.trim()) {
      toast({
        title: t("student.courses.authorizationRequiredTitle", "Authorization Required"),
        description: t("student.courses.enterFullNameDesc", "Please enter your full name to authorize."),
        variant: "destructive",
      })
      setConfirmDialogOpen(true) // Re-open dialog if name was missing
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

      if (!statementUrlToSave) {
        throw new Error(t("student.statement.uploadError", "Statement is required and was not uploaded or found."))
      }

      const selectionPayload = {
        student_id: profile.id,
        elective_courses_id: packId,
        status: SelectionStatus.PENDING,
        statement_url: statementUrlToSave,
        selected_course_ids: selectedIndividualCourseIds, // THIS IS THE CRUCIAL PART
        authorized_by: studentName.trim(),
        submitted_at: new Date().toISOString(),
      }

      if (existingSelectionRecord) {
        const { error } = await supabase
          .from("course_selections")
          .update(selectionPayload)
          .eq("id", existingSelectionRecord.id)
        if (error) throw error
      } else {
        const { data: newSelection, error } = await supabase
          .from("course_selections")
          .insert(selectionPayload)
          .select()
          .single()
        if (error) throw error
        setExistingSelectionRecord(newSelection)
      }

      toast({
        title: t("student.courses.selectionSubmittedTitle", "Selection Submitted"),
        description: t(
          "student.courses.selectionSubmittedDesc",
          "Your course selection has been submitted successfully.",
        ),
      })
      setConfirmDialogOpen(false)
      await loadData() // Refresh data to show updated status
    } catch (error: any) {
      console.error("[ElectivePage] Submission error:", error)
      toast({
        title: t("error", "Error"),
        description: error.message || t("student.courses.submissionError", "An error occurred during submission."),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setIsUploadingStatement(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... (file upload logic as before)
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: t("student.statement.invalidFileTypeTitle", "Invalid File Type"),
          description: t("student.statement.invalidFileTypeDesc", "Please upload a PDF file."),
          variant: "destructive",
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        toast({
          title: t("student.statement.fileTooLargeTitle", "File Too Large"),
          description: t("student.statement.fileTooLargeDesc", "Please upload a file smaller than 5MB."),
          variant: "destructive",
        })
        return
      }
      setUploadedStatement(file)
      toast({
        title: t("student.statement.fileSelectedTitle", "File Selected"),
        description: t("student.statement.fileSelectedDesc", `"${file.name}" ready for upload.`, {
          fileName: file.name,
        }),
      })
    }
  }

  const handleDownloadStatementTemplate = async () => {
    // ... (download logic as before)
    if (!electiveCourseData?.syllabus_template_url) {
      toast({
        title: t("student.statement.noTemplateTitle", "No Template"),
        description: t("student.statement.noTemplateDesc", "Statement template is not available."),
        variant: "destructive",
      })
      return
    }
    setDownloadingStatement(true)
    try {
      window.open(electiveCourseData.syllabus_template_url, "_blank")
    } catch (error) {
      toast({
        title: t("student.statement.downloadFailedTitle", "Download Failed"),
        description: t("student.statement.downloadFailedDesc", "Could not open the statement template."),
        variant: "destructive",
      })
    } finally {
      setDownloadingStatement(false)
    }
  }

  const formatDateDisplay = (dateString: string | null | undefined) => {
    // ... (format date logic as before)
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const selectionProgress = electiveCourseData?.max_selections
    ? (selectedIndividualCourseIds.length / electiveCourseData.max_selections) * 100
    : 0

  const isDeadlinePassed = electiveCourseData?.deadline ? new Date(electiveCourseData.deadline) < new Date() : false
  const currentSelectionStatus = existingSelectionRecord?.status as SelectionStatus | undefined

  const getStatusAlert = () => {
    // ... (status alert logic as before, ensure all t() calls are correct)
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
          <AlertTitle>{t("student.courses.selectionRejected", "Selection Rejected")}</AlertTitle>
          <AlertDescription>
            {t(
              "student.courses.selectionRejectedDesc",
              "Your course selection has been rejected. Please contact support.",
            )}
          </AlertDescription>
        </Alert>
      )
    }
    if (electiveCourseData?.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.comingSoonDesc", "This course selection is not yet open.")}
          </AlertDescription>
        </Alert>
      )
    }
    if (
      isDeadlinePassed &&
      currentSelectionStatus !== SelectionStatus.APPROVED &&
      currentSelectionStatus !== SelectionStatus.PENDING
    ) {
      return (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.deadlinePassed", "Deadline Passed")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.deadlinePassedDesc", "The deadline for this selection has passed.")}
          </AlertDescription>
        </Alert>
      )
    }
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
        <AlertDescription>
          {t("student.courses.selectionPeriodDesc")}{" "}
          {electiveCourseData?.max_selections || t("student.courses.unlimited", "unlimited")}{" "}
          {t("student.courses.courses", "courses")}.{" "}
          {electiveCourseData?.deadline &&
            `${t("student.courses.until", "until")} ${formatDateDisplay(electiveCourseData.deadline)}.`}
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
            <AlertTitle>{t("errorLoadingPageTitle", "Error Loading Page")}</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }
  if (!electiveCourseData) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="p-4 text-center">{t("student.courses.packNotFound", "Elective course pack not found.")}</div>
      </DashboardLayout>
    )
  }

  const electivePackName =
    language === "ru" && electiveCourseData.name_ru
      ? electiveCourseData.name_ru
      : electiveCourseData.name_en || electiveCourseData.name
  const canSubmit =
    !isDeadlinePassed && electiveCourseData.status !== "draft" && currentSelectionStatus !== SelectionStatus.APPROVED

  const handleCancelSelection = async () => {
    // ... (cancel selection logic as before)
    if (!profile?.id || !electiveCourseData?.id) {
      toast({
        title: t("error", "Error"),
        description: t("student.courses.cancelErrorMissingInfo", "Cannot cancel selection. Missing information."),
        variant: "destructive",
      })
      return
    }
    if (!existingSelectionRecord) {
      toast({
        title: t("student.courses.noSelectionToCancelTitle", "No Selection"),
        description: t("student.courses.noSelectionToCancelDesc", "There is no selection to cancel."),
        variant: "destructive",
      })
      return
    }

    setIsCancelling(true)
    const formData = new FormData()
    formData.append("studentId", profile.id)
    formData.append("electiveCoursesId", electiveCourseData.id)
    formData.append("selectionId", existingSelectionRecord.id) // Pass selectionId

    const result = await cancelCourseSelection(formData)

    if (result.success) {
      toast({ title: t("student.courses.selectionCancelledTitle", "Selection Cancelled"), description: result.message })
      setExistingSelectionRecord(null)
      setSelectedIndividualCourseIds([])
      setUploadedStatement(null)
      setStudentName("") // Clear authorization name
      await loadData() // Refresh data
    } else {
      toast({
        title: t("student.courses.cancellationFailedTitle", "Cancellation Failed"),
        description: result.error,
        variant: "destructive",
      })
    }
    setIsCancelling(false)
  }

  // --- JSX Rendering ---
  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Link href="/student/courses" className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{electivePackName}</h1>
            <p className="text-sm text-muted-foreground">
              {t(
                "student.courses.selectIndividualCoursesHelpText",
                "Select your preferred courses from the list below.",
              )}
            </p>
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
              {t("student.courses.selectedOutOf")} {selectedIndividualCourseIds.length} {t("student.courses.of", "of")}{" "}
              {electiveCourseData.max_selections || "N/A"} {t("student.courses.allowedCourses")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={selectionProgress}
              className={`h-2 ${currentSelectionStatus === SelectionStatus.APPROVED ? "bg-green-100 dark:bg-green-950" : currentSelectionStatus === SelectionStatus.PENDING ? "bg-yellow-100 dark:bg-yellow-950" : ""}`}
              color={
                currentSelectionStatus === SelectionStatus.APPROVED
                  ? "bg-green-600"
                  : currentSelectionStatus === SelectionStatus.PENDING
                    ? "bg-yellow-600"
                    : undefined
              }
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedIndividualCourseIds.length >= (electiveCourseData.max_selections || Number.POSITIVE_INFINITY)
                ? t("student.courses.maxSelections")
                : `${t("student.courses.canSelectMore")} ${(electiveCourseData.max_selections || 0) - selectedIndividualCourseIds.length} ${(electiveCourseData.max_selections || 0) - selectedIndividualCourseIds.length === 1 ? t("student.courses.moreCourse") : t("student.courses.moreCourses")}`}
            </p>
          </CardContent>
        </Card>

        {electiveCourseData.syllabus_template_url && (
          <Card>
            <CardHeader>
              <CardTitle>{t("student.statement.title")}</CardTitle>
              <CardDescription>{t("student.statement.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleDownloadStatementTemplate}
                  disabled={downloadingStatement || electiveCourseData.status === "draft"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingStatement
                    ? t("student.statement.downloading", "Downloading...")
                    : t("student.statement.downloadTemplate", "Download Template")}
                </Button>
                <div className="relative w-full">
                  <Input
                    id="statement-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isUploadingStatement || !canSubmit}
                    className="cursor-pointer"
                  />
                  {isUploadingStatement && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      {" "}
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      {t("student.statement.uploading", "Uploading...")}{" "}
                    </div>
                  )}
                </div>
              </div>
              {uploadedStatement && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                  {" "}
                  <CheckCircle className="h-4 w-4" />{" "}
                  <span className="text-sm">
                    {" "}
                    {t("student.statement.fileReady", "File ready:")}{" "}
                    <span className="font-medium">{uploadedStatement.name}</span>{" "}
                  </span>{" "}
                </div>
              )}
              {existingSelectionRecord?.statement_url && !uploadedStatement && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                  {" "}
                  <CheckCircle className="h-4 w-4" />{" "}
                  <span className="text-sm">
                    {t(
                      "student.statement.previouslyUploaded",
                      "Previously uploaded statement will be used unless a new one is provided.",
                    )}
                  </span>{" "}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {individualCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {individualCourses.map((course) => {
              const isSelected = selectedIndividualCourseIds.includes(course.id)
              const isDisabledByMax =
                !isSelected &&
                selectedIndividualCourseIds.length >= (electiveCourseData.max_selections || Number.POSITIVE_INFINITY)
              const courseName = language === "ru" && course.name_ru ? course.name_ru : course.name_en
              const instructorName =
                language === "ru" && course.instructor_ru ? course.instructor_ru : course.instructor_en

              return (
                <Card
                  key={course.id}
                  className={`h-full flex flex-col transition-all ${isSelected ? (currentSelectionStatus === SelectionStatus.APPROVED ? "border-green-500" : currentSelectionStatus === SelectionStatus.PENDING ? "border-yellow-500" : "border-primary") : isDisabledByMax ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {courseName || t("student.courses.unnamedCourse", "Unnamed Course")}
                    </CardTitle>
                    <CardDescription>
                      <p>{instructorName || t("student.courses.noInstructor", "Instructor N/A")}</p>
                      {typeof course.max_students === "number" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("student.courses.maxStudentsLabel", "Max Students")}: {course.max_students}
                        </p>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 flex-grow">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto text-primary hover:text-primary/80"
                      onClick={() => setViewingCourse(course)}
                    >
                      <BookOpen className="h-3.5 w-3.5 mr-1" />
                      {t("student.courses.viewDescription")}
                    </Button>
                  </CardContent>
                  {canSubmit && (
                    <CardFooter className="pt-0 mt-auto">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleCourseSelection(course.id)}
                          disabled={isDisabledByMax || !canSubmit}
                        />
                        <Label
                          htmlFor={`course-${course.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
            <CardContent className="py-8 text-center text-muted-foreground">
              {t("student.courses.noIndividualCoursesInPack", "No courses available in this pack.")}
            </CardContent>
          </Card>
        )}

        {canSubmit && (
          <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
            {existingSelectionRecord && canSubmit && (
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    window.confirm(
                      t(
                        "student.courses.cancelConfirm",
                        "Are you sure you want to cancel your current selection? This action cannot be undone.",
                      ),
                    )
                  ) {
                    handleCancelSelection()
                  }
                }}
                disabled={isCancelling || submitting}
              >
                {isCancelling && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("student.courses.cancelSelection", "Cancel Selection")}
              </Button>
            )}
            <Button
              onClick={() => {
                if (!uploadedStatement && !existingSelectionRecord?.statement_url) {
                  toast({
                    title: t("student.statement.requiredTitle", "Statement Required"),
                    description: t("student.statement.requiredDesc", "Please upload your signed statement."),
                    variant: "destructive",
                  })
                  return
                }
                if (selectedIndividualCourseIds.length === 0 && (electiveCourseData.max_selections || 0) > 0) {
                  toast({
                    title: t("student.courses.selectMinOneCourseTitle", "No Courses Selected"),
                    description: t("student.courses.selectMinOneCourseDesc", "Please select at least one course."),
                    variant: "destructive",
                  })
                  return
                }
                setConfirmDialogOpen(true)
              }}
              disabled={
                submitting ||
                isUploadingStatement ||
                (selectedIndividualCourseIds.length === 0 &&
                  (electiveCourseData.max_selections || 0) > 0 &&
                  !existingSelectionRecord) ||
                (!uploadedStatement && !existingSelectionRecord?.statement_url && !existingSelectionRecord)
              }
              className="px-8"
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {existingSelectionRecord ? t("student.courses.updateSelection") : t("student.courses.confirmSelection")}
            </Button>
          </div>
        )}

        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("student.courses.confirmYourSelection")}</DialogTitle>
              <DialogDescription>
                {t(
                  "student.courses.reviewSelectionAndAuthorize",
                  "Please review your selection and enter your full name to authorize this submission.",
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-2">{t("student.courses.selectedCourses")}:</h4>
                <ul className="space-y-1">
                  {selectedIndividualCourseIds.map((id) => {
                    const course = individualCourses.find((c) => c.id === id)
                    const courseName = language === "ru" && course?.name_ru ? course.name_ru : course?.name_en
                    return (
                      <li key={id} className="text-sm flex items-center gap-2">
                        {" "}
                        <CheckCircle className="h-4 w-4 text-green-600" />{" "}
                        {courseName || t("student.courses.unnamedCourse", "Unnamed Course")}{" "}
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">{t("student.statement.title")}:</h4>
                <div className="flex items-center gap-2 text-sm">
                  {" "}
                  <CheckCircle className="h-4 w-4 text-green-600" />{" "}
                  <span>
                    {" "}
                    {uploadedStatement
                      ? `${uploadedStatement.name} (${Math.round(uploadedStatement.size / 1024)} KB)`
                      : t(
                          "student.statement.previouslyUploadedWillBeUsed",
                          "Previously uploaded statement will be used.",
                        )}{" "}
                  </span>{" "}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-name-confirm">
                  {t("student.courses.yourFullName")} ({t("student.courses.toAuthorize")})
                </Label>
                <Input
                  id="student-name-confirm"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={t("student.courses.enterFullNamePlaceholder", "Enter your full name")}
                />
              </div>
            </div>
            <ShadDialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                {t("cancel", "Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={!studentName.trim() || submitting || isUploadingStatement}>
                {(submitting || isUploadingStatement) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("student.courses.submitSelection")}
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewingCourse} onOpenChange={(open) => !open && setViewingCourse(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {language === "ru" && viewingCourse?.name_ru
                  ? viewingCourse.name_ru
                  : viewingCourse?.name_en || t("student.courses.unnamedCourse", "Unnamed Course")}
              </DialogTitle>
              <DialogDescription>
                <p>
                  {language === "ru" && viewingCourse?.instructor_ru
                    ? viewingCourse.instructor_ru
                    : viewingCourse?.instructor_en || t("student.courses.noInstructor", "Instructor N/A")}
                </p>
                {typeof viewingCourse?.max_students === "number" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {" "}
                    {t("student.courses.maxStudentsLabel", "Max Students")}: {viewingCourse.max_students}{" "}
                  </p>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {language === "ru" && viewingCourse?.description_ru
                  ? viewingCourse.description_ru
                  : viewingCourse?.description_en ||
                    t("student.courses.noDescriptionAvailable", "No description available.")}
              </p>
            </div>
            <ShadDialogFooter>
              <Button variant="outline" onClick={() => setViewingCourse(null)}>
                {t("student.courses.close", "Close")}
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
