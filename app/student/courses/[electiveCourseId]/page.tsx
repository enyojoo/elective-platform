"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Download, CheckCircle, Clock, Info, BookOpen, ArrowLeft, Loader2, AlertCircle, FileText } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types" // Assuming SelectionStatus might be here or defined locally
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { uploadStatement, downloadStatement } from "@/lib/file-utils" // Assuming downloadStatement exists
import { useCachedElectiveCourseDetails } from "@/hooks/use-cached-student-selections"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

// Local SelectionStatus if not from lib/types
enum LocalSelectionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

interface ElectiveCourseSubItem {
  // Structure of items within elective_courses.courses JSONB
  id: string // Unique within the pack
  name: string
  name_ru?: string
  description?: string
  description_ru?: string
  credits?: number
  // Add other relevant fields like teacher, prerequisites etc.
}

interface ElectiveCoursePageProps {
  params: {
    // Ensure this matches the folder name [electiveCourseId]
    electiveCourseId: string
  }
}

export default function ElectiveCourseDetailPage({ params }: ElectiveCoursePageProps) {
  const { electiveCourseId } = params
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [studentId, setStudentId] = useState<string | undefined>(undefined)
  const [studentFullName, setStudentFullName] = useState("") // For confirmation dialog

  const {
    electiveCourse, // This is the elective_courses record (the "pack")
    studentSelection, // This is the course_selections record for this student and pack
    isLoading: dataLoading,
    error: dataError,
    refreshData,
    updateStudentSelection,
  } = useCachedElectiveCourseDetails(electiveCourseId, studentId)

  const [selectedSubCourseIds, setSelectedSubCourseIds] = useState<string[]>([])
  const [uploadedStatementFile, setUploadedStatementFile] = useState<File | null>(null)
  const [currentStatementUrl, setCurrentStatementUrl] = useState<string | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [viewingSubCourse, setViewingSubCourse] = useState<ElectiveCourseSubItem | null>(null)

  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      setAuthLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setStudentId(session.user.id)
        // Fetch profile to get full name if needed for dialog, or assume it's entered
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single()
        if (profile?.full_name) setStudentFullName(profile.full_name)
      } else {
        router.push(`/${language}/student/login`)
      }
      setAuthLoading(false)
    }
    fetchUser()
  }, [supabase, router, language])

  useEffect(() => {
    if (studentSelection) {
      setSelectedSubCourseIds(
        Array.isArray(studentSelection.selected_courses)
          ? studentSelection.selected_courses.map((c) => (typeof c === "string" ? c : c.id))
          : [],
      ) // Assuming selected_courses stores IDs or objects with id
      setCurrentStatementUrl(studentSelection.statement_url || null)
    } else {
      setSelectedSubCourseIds([])
      setCurrentStatementUrl(null)
    }
  }, [studentSelection])

  const handleSubCourseSelectionToggle = (subCourseId: string) => {
    if (!electiveCourse || !isSelectionPeriodActive() || studentSelection?.status === LocalSelectionStatus.APPROVED)
      return

    setSelectedSubCourseIds((prev) => {
      if (prev.includes(subCourseId)) {
        return prev.filter((id) => id !== subCourseId)
      } else {
        if (prev.length < electiveCourse.max_selections) {
          return [...prev, subCourseId]
        }
        toast({
          title: t("student.courses.maxSelectionsReached"),
          description: t("student.courses.maxSelectionsReachedDesc", { max: electiveCourse.max_selections }),
          variant: "warning",
        })
        return prev
      }
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!studentId || !electiveCourseId) return
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: t("student.courses.invalidFileType"),
          description: t("student.courses.pdfOnly"),
          variant: "destructive",
        })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: t("student.courses.fileTooLarge"),
          description: t("student.courses.max5mb"),
          variant: "destructive",
        })
        return
      }
      setUploadedStatementFile(file) // Store the file object for submission
      setCurrentStatementUrl(null) // Clear existing URL if new file is chosen
      toast({ title: t("student.courses.fileReadyForUpload"), description: file.name })
    }
  }

  const submitSelection = async () => {
    if (!studentId || !electiveCourseId || !electiveCourse || !studentFullName.trim()) {
      toast({
        title: t("student.courses.error"),
        description: t("student.courses.missingInfoForSubmit"),
        variant: "destructive",
      })
      return
    }
    if (selectedSubCourseIds.length === 0) {
      toast({
        title: t("student.courses.error"),
        description: t("student.courses.selectAtLeastOne"),
        variant: "destructive",
      })
      return
    }
    if (!uploadedStatementFile && !currentStatementUrl) {
      toast({
        title: t("student.courses.statementRequired"),
        description: t("student.courses.uploadStatementBeforeSubmit"),
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    let statementUrlToSave = currentStatementUrl

    if (uploadedStatementFile) {
      setIsUploading(true) // Show uploading state for file
      try {
        statementUrlToSave = await uploadStatement(uploadedStatementFile, studentId, electiveCourseId)
        setUploadedStatementFile(null) // Clear after successful upload
        setCurrentStatementUrl(statementUrlToSave)
      } catch (error: any) {
        toast({
          title: t("student.courses.uploadFailed"),
          description: error.message || t("student.courses.errorOccurred"),
          variant: "destructive",
        })
        setIsUploading(false)
        setIsSubmitting(false)
        return
      }
      setIsUploading(false)
    }

    if (!statementUrlToSave) {
      // Should not happen if logic is correct, but as a safeguard
      toast({
        title: t("student.courses.statementRequired"),
        description: t("student.courses.statementMissingAfterAttempt"),
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    const selectionPayload = {
      selected_courses: selectedSubCourseIds.map((id) =>
        electiveCourse.courses.find((c: ElectiveCourseSubItem) => c.id === id),
      ), // Store full sub-course objects or just IDs
      statement_url: statementUrlToSave,
      status: LocalSelectionStatus.PENDING, // Selections are initially pending
      // student_id and elective_courses_id are handled by updateStudentSelection
    }

    const result = await updateStudentSelection(selectionPayload)
    setIsSubmitting(false)
    if (result) {
      setConfirmDialogOpen(false)
      toast({
        title: t("student.courses.selectionSubmitted"),
        description: t("student.courses.selectionSubmittedDesc"),
      })
      refreshData() // Refresh to get the latest studentSelection status
      // Optionally redirect: router.push(`/${language}/student/courses`);
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  const isSelectionPeriodActive = () => {
    if (!electiveCourse) return false
    const now = new Date()
    const deadline = new Date(electiveCourse.deadline)
    return electiveCourse.status === "published" && now <= deadline
  }

  const getOverallStatusAlert = () => {
    if (!electiveCourse) return null

    if (studentSelection?.status === LocalSelectionStatus.APPROVED) {
      return (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (studentSelection?.status === LocalSelectionStatus.PENDING) {
      return (
        <Alert variant="warning">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (studentSelection?.status === LocalSelectionStatus.REJECTED) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionRejected")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionRejectedDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (electiveCourse.status === "draft") {
      return (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.comingSoonDesc", { date: formatDate(electiveCourse.deadline) })}
          </AlertDescription>
        </Alert>
      )
    }
    if (electiveCourse.status === "closed" || new Date() > new Date(electiveCourse.deadline)) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionClosed")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionClosedDesc")}</AlertDescription>
        </Alert>
      )
    }
    if (isSelectionPeriodActive()) {
      return (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.selectionPeriodDesc", {
              count: electiveCourse.max_selections,
              date: formatDate(electiveCourse.deadline),
            })}
          </AlertDescription>
        </Alert>
      )
    }
    return null // Default or unknown state
  }

  const isLoading = authLoading || dataLoading

  if (isLoading)
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  if (dataError)
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.error")}</AlertTitle>
          <AlertDescription>{dataError}</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  if (!electiveCourse)
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.coursePackNotFound")}</AlertTitle>
        </Alert>
      </DashboardLayout>
    )

  const selectionProgress =
    electiveCourse.max_selections > 0 ? (selectedSubCourseIds.length / electiveCourse.max_selections) * 100 : 0
  const canSubmit =
    isSelectionPeriodActive() &&
    studentSelection?.status !== LocalSelectionStatus.APPROVED &&
    studentSelection?.status !== LocalSelectionStatus.REJECTED

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10">
            <Link href={`/${language}/student/courses`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "ru" && electiveCourse.name_ru ? electiveCourse.name_ru : electiveCourse.name}
            </h1>
            <p className="text-sm text-muted-foreground">{t("student.courses.selectYourCoursesFromPack")}</p>
          </div>
        </div>

        {getOverallStatusAlert()}

        <Card>
          <CardHeader>
            <CardTitle>{t("student.courses.selectionProgress")}</CardTitle>
            <CardDescription>
              {t("student.courses.selectedOutOf", {
                count: selectedSubCourseIds.length,
                max: electiveCourse.max_selections,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={selectionProgress} className="h-2" />
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedSubCourseIds.length === electiveCourse.max_selections
                ? t("student.courses.maxSelectionsReachedShort")
                : t("student.courses.canSelectMoreShort", {
                    count: electiveCourse.max_selections - selectedSubCourseIds.length,
                  })}
            </p>
          </CardContent>
        </Card>

        {/* Statement Upload/Download Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("student.statement.title")}</CardTitle>
            <CardDescription>{t("student.statement.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {electiveCourse.syllabus_template_url && (
              <Button
                variant="outline"
                onClick={() => window.open(electiveCourse.syllabus_template_url, "_blank")}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" /> {t("student.statement.downloadTemplate")}
              </Button>
            )}
            {currentStatementUrl && !uploadedStatementFile && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm font-medium">{t("student.statement.currentStatementUploaded")}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadStatement(currentStatementUrl, `statement_${electiveCourseId}.pdf`, toast, t)}
                >
                  <Download className="h-4 w-4 mr-1" /> {t("student.statement.download")}
                </Button>
              </div>
            )}
            <Label htmlFor="statement-upload" className="text-sm font-medium">
              {uploadedStatementFile ? t("student.statement.changeFile") : t("student.statement.uploadSigned")}
            </Label>
            <Input
              id="statement-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={
                isUploading || !isSelectionPeriodActive() || studentSelection?.status === LocalSelectionStatus.APPROVED
              }
              className="cursor-pointer"
            />
            {uploadedStatementFile && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  {t("student.statement.fileSelected")}:{" "}
                  <span className="font-medium">{uploadedStatementFile.name}</span>
                </span>
              </div>
            )}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> {t("student.statement.uploading")}...
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(electiveCourse.courses || []).map((subCourse: ElectiveCourseSubItem) => {
            const isSelected = selectedSubCourseIds.includes(subCourse.id)
            const isDisabledByMax = !isSelected && selectedSubCourseIds.length >= electiveCourse.max_selections
            const isActionDisabled =
              !isSelectionPeriodActive() ||
              studentSelection?.status === LocalSelectionStatus.APPROVED ||
              isDisabledByMax

            return (
              <Card
                key={subCourse.id}
                className={`h-full transition-all ${isSelected ? "border-primary" : ""} ${isActionDisabled && !isSelected ? "opacity-60" : ""}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {language === "ru" && subCourse.name_ru ? subCourse.name_ru : subCourse.name}
                  </CardTitle>
                  {subCourse.credits && (
                    <CardDescription>{t("student.courses.credits", { count: subCourse.credits })}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-4 flex-grow">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto"
                    onClick={() => setViewingSubCourse(subCourse)}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" /> {t("student.courses.viewDescription")}
                  </Button>
                </CardContent>
                <CardFooter className="pt-0">
                  {canSubmit && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`subcourse-${subCourse.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleSubCourseSelectionToggle(subCourse.id)}
                        disabled={isActionDisabled}
                      />
                      <Label
                        htmlFor={`subcourse-${subCourse.id}`}
                        className={`text-sm font-medium ${isActionDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      >
                        {isSelected ? t("student.courses.selected") : t("student.courses.select")}
                      </Label>
                    </div>
                  )}
                  {studentSelection?.status === LocalSelectionStatus.APPROVED && isSelected && (
                    <Badge variant="success" className="font-medium">
                      {t("student.courses.approved")}
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {canSubmit && (
          <div className="flex justify-end mt-6">
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="px-8"
                  disabled={
                    selectedSubCourseIds.length === 0 ||
                    (!uploadedStatementFile && !currentStatementUrl) ||
                    isSubmitting ||
                    isUploading
                  }
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {studentSelection ? t("student.courses.updateSelection") : t("student.courses.confirmSelection")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("student.courses.confirmYourSelection")}</DialogTitle>
                  <DialogDescription>{t("student.courses.reviewSelectionBeforeSubmit")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("student.courses.selectedCourses")}:</h4>
                    <ul className="space-y-1 list-disc list-inside">
                      {selectedSubCourseIds.map((id) => {
                        const sc = electiveCourse.courses.find((c: ElectiveCourseSubItem) => c.id === id)
                        return (
                          <li key={id} className="text-sm">
                            {language === "ru" && sc?.name_ru ? sc.name_ru : sc?.name}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">{t("student.statement.title")}:</h4>
                    {uploadedStatementFile ? (
                      <p className="text-sm text-green-600">
                        {t("student.statement.newFileSelected")}: {uploadedStatementFile.name}
                      </p>
                    ) : currentStatementUrl ? (
                      <p className="text-sm text-blue-600">{t("student.statement.usingCurrentStatement")}</p>
                    ) : (
                      <p className="text-sm text-red-600">{t("student.statement.noStatementFile")}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-full-name">
                      {t("student.courses.yourFullName")} ({t("student.courses.toAuthorize")})
                    </Label>
                    <Input
                      id="student-full-name"
                      value={studentFullName}
                      onChange={(e) => setStudentFullName(e.target.value)}
                      placeholder={t("student.courses.enterFullName")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                    {t("student.courses.cancel")}
                  </Button>
                  <Button
                    onClick={submitSelection}
                    disabled={
                      !studentFullName.trim() ||
                      isSubmitting ||
                      isUploading ||
                      (!uploadedStatementFile && !currentStatementUrl) ||
                      selectedSubCourseIds.length === 0
                    }
                  >
                    {isSubmitting || isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t("student.courses.submitSelection")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Sub-Course Description Dialog */}
        <Dialog open={!!viewingSubCourse} onOpenChange={(open) => !open && setViewingSubCourse(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {language === "ru" && viewingSubCourse?.name_ru ? viewingSubCourse.name_ru : viewingSubCourse?.name}
              </DialogTitle>
              {viewingSubCourse?.credits && (
                <DialogDescription>
                  {t("student.courses.credits", { count: viewingSubCourse.credits })}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                {language === "ru" && viewingSubCourse?.description_ru
                  ? viewingSubCourse.description_ru
                  : viewingSubCourse?.description || t("student.courses.noDescription")}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingSubCourse(null)}>
                {t("student.courses.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
