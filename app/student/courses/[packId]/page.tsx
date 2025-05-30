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
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { uploadStatement } from "@/lib/file-utils"
import { createClient } from "@supabase/supabase-js"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { cancelCourseSelection } from "@/app/actions/student-selections"

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
    console.log(`[packIdPage] Fetching data for packId: ${packId}, studentId: ${profile.id}`)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { data: ecData, error: ecError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .single()

      if (ecError) throw ecError
      if (!ecData) throw new Error("Elective course pack not found.")
      console.log("[packIdPage] elective_courses data (ecData):", ecData)
      setElectiveCourseData(ecData)

      let packCourseObjects: any[] = []
      if (ecData.courses && typeof ecData.courses === "string") {
        try {
          packCourseObjects = JSON.parse(ecData.courses)
          if (!Array.isArray(packCourseObjects)) packCourseObjects = []
        } catch (e) {
          console.error("Error parsing elective_courses.courses JSON:", e)
          packCourseObjects = []
        }
      } else if (Array.isArray(ecData.courses)) {
        packCourseObjects = ecData.courses
      }
      console.log("[packIdPage] Parsed packCourseObjects from elective_courses.courses:", packCourseObjects)

      if (packCourseObjects.length > 0) {
        const courseIdsToFetch = packCourseObjects.map((c) => c.id).filter((id) => !!id)
        console.log("[packIdPage] courseIdsToFetch from packCourseObjects:", courseIdsToFetch)

        if (courseIdsToFetch.length > 0) {
          const { data: detailedCoursesData, error: detailedCoursesError } = await supabase
            .from("courses")
            .select("id, name_en, name_ru, description_en, description_ru, max_students, instructor_en, instructor_ru")
            .in("id", courseIdsToFetch)

          if (detailedCoursesError) throw detailedCoursesError
          console.log("[packIdPage] Fetched detailedCoursesData from 'courses' table:", detailedCoursesData)

          const detailedCoursesMap = new Map((detailedCoursesData || []).map((dc) => [dc.id, dc]))

          const enrichedCourses = packCourseObjects.map((pco) => {
            const details = detailedCoursesMap.get(pco.id) || {} // Details from 'courses' table
            return {
              id: pco.id, // ID from the pack's JSON object for this course

              // Name: Prioritize 'courses' table, then pack's JSON, then empty
              name: details.name_en || pco.name || "",
              name_ru: details.name_ru || pco.name_ru || details.name_en || pco.name || "",

              // Description: Prioritize 'courses' table, then pack's JSON, then empty
              description: details.description_en || pco.description || "",
              description_ru:
                details.description_ru || pco.description_ru || details.description_en || pco.description || "",

              // Teacher/Instructor: Prioritize 'courses' table, then pack's JSON, then empty
              teacher: details.instructor_en || pco.teacher || "",
              teacher_ru: details.instructor_ru || pco.teacher_ru || details.instructor_en || pco.teacher || "",

              // Max Students: From 'courses' table primarily, fallback to pack's JSON if present
              max_students: details.max_students !== undefined ? details.max_students : pco.max_students,
            }
          })
          console.log("[packIdPage] Enriched individual courses (final for state):", enrichedCourses)
          setIndividualCourses(enrichedCourses)
        } else {
          console.log("[packIdPage] No valid course IDs to fetch details for.")
          setIndividualCourses([])
        }
      } else {
        console.log("[packIdPage] packCourseObjects is empty, no individual courses to process.")
        setIndividualCourses([])
      }

      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("*, selected_course_ids")
        .eq("student_id", profile.id)
        .eq("elective_courses_id", packId)
        .maybeSingle()

      if (selectionError) throw selectionError
      console.log("[packIdPage] course_selections data:", selectionData)
      setExistingSelectionRecord(selectionData)

      if (selectionData && selectionData.selected_course_ids && Array.isArray(selectionData.selected_course_ids)) {
        setSelectedIndividualCourseIds(selectionData.selected_course_ids)
        console.log("[packIdPage] Initial selected IDs from existing selection:", selectionData.selected_course_ids)
      } else {
        setSelectedIndividualCourseIds([])
      }
    } catch (error: any) {
      console.error("[packIdPage] Error fetching data:", error)
      setFetchError(error.message || "Failed to load elective course details.")
      toast({ title: "Error", description: error.message, variant: "destructive" })
      setIndividualCourses([]) // Ensure courses are cleared on error
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
        if (prevSelected.length < (electiveCourseData?.max_selections || 0)) {
          return [...prevSelected, individualCourseId]
        }
        return prevSelected
      }
    })
  }

  const handleSubmit = async () => {
    if (!profile?.id || (!uploadedStatement && !existingSelectionRecord?.statement_url)) {
      toast({ title: "Missing Information", description: "Profile or statement is missing.", variant: "destructive" })
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

      if (!statementUrlToSave && electiveCourseData?.syllabus_template_url) {
        // Check if statement is mandatory
        throw new Error("Statement is required and was not uploaded.")
      }

      const selectionPayload = {
        student_id: profile.id,
        elective_courses_id: packId,
        status: SelectionStatus.PENDING,
        statement_url: statementUrlToSave,
        selected_course_ids: selectedIndividualCourseIds,
      }

      if (existingSelectionRecord) {
        const { error } = await supabase
          .from("course_selections")
          .update({
            status: SelectionStatus.PENDING,
            statement_url: statementUrlToSave,
            selected_course_ids: selectedIndividualCourseIds,
          })
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

  const selectionProgress = electiveCourseData?.max_selections
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
    } else {
      toast({ title: "Cancellation Failed", description: result.error, variant: "destructive" })
    }
    setIsCancelling(false)
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Link href="/student/courses" className="p-2 rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
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
              {electiveCourseData.max_selections} {t("student.courses.allowedCourses")}
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
              {selectedIndividualCourseIds.length === electiveCourseData.max_selections
                ? t("student.courses.maxSelections")
                : `${t("student.courses.canSelectMore")} ${electiveCourseData.max_selections - selectedIndividualCourseIds.length} ${electiveCourseData.max_selections - selectedIndividualCourseIds.length === 1 ? t("student.courses.moreCourse") : t("student.courses.moreCourses")}`}
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
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleDownloadStatementTemplate}
                  disabled={downloadingStatement || electiveCourseData.status === "draft"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingStatement ? t("student.statement.downloading") : t("student.statement.downloadTemplate")}
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("student.statement.uploading")}
                    </div>
                  )}
                </div>
              </div>
              {uploadedStatement && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {t("student.statement.fileReady")} <span className="font-medium">{uploadedStatement.name}</span>
                  </span>
                </div>
              )}
              {existingSelectionRecord?.statement_url && !uploadedStatement && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{t("student.statement.previouslyUploaded")}</span>
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
              return (
                <Card
                  key={course.id}
                  className={`h-full transition-all ${isSelected ? (currentSelectionStatus === SelectionStatus.APPROVED ? "border-green-500" : currentSelectionStatus === SelectionStatus.PENDING ? "border-yellow-500" : "border-primary") : isDisabledByMax ? "opacity-60" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        {language === "ru" && course.name_ru ? course.name_ru : course.name}
                      </CardTitle>
                    </div>
                    <CardDescription>
                      <p>{language === "ru" && course.teacher_ru ? course.teacher_ru : course.teacher}</p>
                      {course.max_students !== undefined && ( // Check if max_students is defined
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("student.courses.maxStudentsLabel") || "Limit:"} {course.max_students}
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
                    <CardFooter className="pt-0">
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
              {t("student.courses.noIndividualCourses")}
            </CardContent>
          </Card>
        )}

        {canSubmit && (
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => {
                if (
                  electiveCourseData?.syllabus_template_url &&
                  !uploadedStatement &&
                  !existingSelectionRecord?.statement_url
                ) {
                  toast({
                    title: t("student.statement.requiredTitle"),
                    description: t("student.statement.requiredDesc"),
                    variant: "destructive",
                  })
                } else if (selectedIndividualCourseIds.length === 0 && (electiveCourseData?.max_selections || 0) > 0) {
                  toast({ title: t("student.courses.selectMinOneCourse"), variant: "destructive" })
                } else {
                  setConfirmDialogOpen(true)
                }
              }}
              disabled={
                submitting ||
                isUploadingStatement ||
                (selectedIndividualCourseIds.length === 0 &&
                  (electiveCourseData?.max_selections || 0) > 0 &&
                  electiveCourseData.status !== "draft") || // only disable if max_selections > 0 and not draft
                (electiveCourseData?.syllabus_template_url &&
                  !uploadedStatement &&
                  !existingSelectionRecord?.statement_url)
              }
              className="px-8"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {existingSelectionRecord ? t("student.courses.updateSelection") : t("student.courses.confirmSelection")}
            </Button>
            {existingSelectionRecord && canSubmit && (
              <Button
                variant="outline"
                onClick={() => {
                  if (
                    window.confirm(
                      t("student.courses.confirmCancelSelection") ||
                        "Are you sure you want to cancel your current selection? This action cannot be undone.",
                    )
                  ) {
                    handleCancelSelection()
                  }
                }}
                disabled={isCancelling || submitting}
                className="ml-2"
              >
                {isCancelling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t("student.courses.cancelSelection")}
              </Button>
            )}
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
                  <ul className="space-y-1">
                    {selectedIndividualCourseIds.map((id) => {
                      const course = individualCourses.find((c) => c.id === id)
                      return (
                        <li key={id} className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {language === "ru" && course?.name_ru ? course.name_ru : course?.name}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("student.courses.noCoursesSelectedYet")}</p>
                )}
              </div>
              {electiveCourseData?.syllabus_template_url && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">{t("student.statement.title")}:</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>
                      {uploadedStatement
                        ? `${uploadedStatement.name} (${Math.round(uploadedStatement.size / 1024)} KB)`
                        : t("student.statement.previouslyUploadedWillBeUsed")}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="student-name">
                  {t("student.courses.yourFullName")} ({t("student.courses.toAuthorize")})
                </Label>
                <Input
                  id="student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={t("student.courses.enterFullName")}
                />
              </div>
            </div>
            <ShadDialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={
                  !studentName.trim() ||
                  submitting ||
                  isUploadingStatement ||
                  (electiveCourseData?.syllabus_template_url &&
                    !uploadedStatement &&
                    !existingSelectionRecord?.statement_url)
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
              <DialogTitle>
                {language === "ru" && viewingCourse?.name_ru ? viewingCourse.name_ru : viewingCourse?.name}
              </DialogTitle>
              <DialogDescription>
                {language === "ru" && viewingCourse?.teacher_ru ? viewingCourse.teacher_ru : viewingCourse?.teacher}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {language === "ru" && viewingCourse?.description_ru
                  ? viewingCourse.description_ru
                  : viewingCourse?.description}
              </p>
              {viewingCourse?.max_students !== undefined && (
                <p className="text-sm mt-2">
                  <strong>{t("student.courses.maxStudentsLabel") || "Max Students:"}</strong>{" "}
                  {viewingCourse.max_students}
                </p>
              )}
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
