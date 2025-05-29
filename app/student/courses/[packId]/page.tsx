"use client"

import type React from "react"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Download, CheckCircle, Clock, Info, Users, BookOpen, ArrowLeft, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types" // Assuming UserRole is still relevant
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { uploadStatement, selectElectiveCourse } from "@/app/actions/student-selections"
import {
  useCachedSingleElectiveCourseSelection,
  type ElectiveCourseData,
  type CourseSelectionData,
} from "@/hooks/use-cached-student-selections" // Adjusted import

interface ElectivePageProps {
  params: {
    packId: string
  }
}

// Assumed structure for elective_courses.courses items
interface CourseItem {
  id: string
  name: string
  description: string
  teacher: string
  max_students: number
  current_students: number
}

export default function ElectivePage({ params }: ElectivePageProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const [studentId, setStudentId] = useState<string | undefined>(undefined)

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setStudentId(user.id)
      } else {
        // Handle user not authenticated, e.g., redirect or show error
        toast({ title: "Authentication Error", description: "User not found.", variant: "destructive" })
      }
    }
    fetchUser()
  }, [supabase, toast])

  const {
    data: pageData,
    isLoading: dataLoading,
    error: dataError,
    refreshData,
  } = useCachedSingleElectiveCourseSelection(params.packId, studentId)

  const electiveCourse: ElectiveCourseData | null = pageData.electiveCourse
  const courseSelection: CourseSelectionData | null = pageData.selection

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("") // For dialog confirmation input
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<CourseItem | null>(null)
  const [uploadedStatementFile, setUploadedStatementFile] = useState<File | null>(null) // For new upload UI
  const [isUploading, setIsUploading] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  useEffect(() => {
    if (courseSelection?.selected_course_ids) {
      setSelectedCourses(courseSelection.selected_course_ids)
    } else {
      setSelectedCourses([]) // Reset if no selection or selection cleared
    }
  }, [courseSelection])

  // Handle course selection
  const toggleCourseSelection = (courseId: string) => {
    if (!electiveCourse) return
    setSelectedCourses((prevSelected) => {
      if (prevSelected.includes(courseId)) {
        return prevSelected.filter((id) => id !== courseId)
      } else {
        if (prevSelected.length < electiveCourse.max_selections) {
          return [...prevSelected, courseId]
        }
        return prevSelected // Max selections reached
      }
    })
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && studentId && params.packId) {
      if (file.type !== "application/pdf") {
        toast({ title: "Invalid file type", description: "Please upload a PDF file", variant: "destructive" })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        toast({ title: "File too large", description: "Please upload a file smaller than 5MB", variant: "destructive" })
        return
      }

      setIsUploading(true)
      setUploadedStatementFile(file) // Show in UI immediately
      try {
        const formData = new FormData()
        formData.append("electiveCoursesId", params.packId)
        formData.append("statement", file)
        // studentId is handled by server action using cookies

        const result = await uploadStatement(formData)

        if (result.error) throw new Error(result.error)

        toast({ title: "Statement uploaded", description: `File "${file.name}" uploaded successfully.` })
        refreshData() // Refresh data from cache/server
      } catch (error) {
        console.error("Statement upload error:", error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "An error occurred during upload",
          variant: "destructive",
        })
        setUploadedStatementFile(null) // Clear on failure
      } finally {
        setIsUploading(false)
      }
    }
  }

  // Handle submission of selected courses
  const handleSubmit = async () => {
    if (!electiveCourse || !studentId || !courseSelection?.statement_url) {
      toast({
        title: "Cannot Submit",
        description: "Please ensure statement is uploaded and courses are selected.",
        variant: "warning",
      })
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("electiveCoursesId", params.packId)
      formData.append("selectedCourseIds", JSON.stringify(selectedCourses))
      // studentId is handled by server action

      const result = await selectElectiveCourse(formData)

      if (result.error) throw new Error(result.error)

      setConfirmDialogOpen(false)
      toast({ title: "Selection submitted", description: "Your course selection has been submitted successfully." })
      refreshData() // Refresh data
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "An error occurred during submission",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle statement download
  const handleDownloadStatement = () => {
    if (electiveCourse?.syllabus_template_url) {
      setDownloadingStatement(true)
      window.open(electiveCourse.syllabus_template_url, "_blank")
      // Simulate download finishing for UI state
      setTimeout(() => setDownloadingStatement(false), 1000)
    } else {
      toast({ title: "No Template", description: "Syllabus template is not available for download.", variant: "info" })
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  const selectionProgress = electiveCourse ? (selectedCourses.length / electiveCourse.max_selections) * 100 : 0

  if (dataLoading || !studentId) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (dataError || !electiveCourse) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="text-center p-4">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{dataError || "Elective course pack not found."}</AlertDescription>
          </Alert>
          <Link href="/student/courses" className="mt-4 inline-block">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const coursesToList: CourseItem[] = Array.isArray(electiveCourse.courses) ? electiveCourse.courses : []

  const getStatusAlert = () => {
    if (courseSelection?.status === "approved") {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    } else if (courseSelection?.status === "pending") {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    } else if (electiveCourse.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.comingSoonDesc")} {formatDate(electiveCourse.deadline)}.
          </AlertDescription>
        </Alert>
      )
    } else {
      // Selection is active or student hasn't submitted yet
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.selectionPeriodDesc")} {electiveCourse.max_selections} {t("student.courses.until")}{" "}
            {formatDate(electiveCourse.deadline)}.
          </AlertDescription>
        </Alert>
      )
    }
  }

  const isSelectionDisabled =
    courseSelection?.status === "approved" || courseSelection?.status === "pending" || electiveCourse.status === "draft"
  const canSubmitSelection =
    !isSelectionDisabled &&
    selectedCourses.length > 0 &&
    selectedCourses.length <= electiveCourse.max_selections &&
    !!courseSelection?.statement_url

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Link href="/student/courses" passHref>
            <Button variant="ghost" size="icon" aria-label="Back to courses">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{electiveCourse.name}</h1>
            <p className="text-sm text-muted-foreground">{t("student.courses.selectCourses")}</p>
          </div>
        </div>

        {getStatusAlert()}

        <Card>
          <CardHeader>
            <CardTitle>{t("student.courses.selectionProgress")}</CardTitle>
            <CardDescription>
              {t("student.courses.selectedOutOf")} {selectedCourses.length} {t("student.courses.of")}{" "}
              {electiveCourse.max_selections} {t("student.courses.allowedCourses")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={selectionProgress}
              className="h-2"
              indicatorClassName={
                courseSelection?.status === "approved"
                  ? "bg-green-600"
                  : courseSelection?.status === "pending"
                    ? "bg-yellow-500"
                    : "bg-primary"
              }
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedCourses.length === electiveCourse.max_selections
                ? t("student.courses.maxSelections")
                : `${t("student.courses.canSelectMore")} ${electiveCourse.max_selections - selectedCourses.length} ${
                    electiveCourse.max_selections - selectedCourses.length === 1
                      ? t("student.courses.moreCourse")
                      : t("student.courses.moreCourses")
                  }`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("student.statement.title")}</CardTitle>
            <CardDescription>{t("student.statement.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto h-10"
                onClick={handleDownloadStatement}
                disabled={downloadingStatement || !electiveCourse.syllabus_template_url}
              >
                {downloadingStatement ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span>{t("student.statement.downloadTemplate")}</span>
              </Button>

              <div className="relative w-full">
                <Label htmlFor="statement-upload" className="sr-only">
                  {t("student.statement.uploadSigned")}
                </Label>
                <Input
                  id="statement-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading || isSelectionDisabled}
                  className="cursor-pointer"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2">{t("student.statement.uploading")}</span>
                  </div>
                )}
              </div>
            </div>
            {(courseSelection?.statement_url || uploadedStatementFile) && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>
                  {t("student.statement.fileUploaded")}{" "}
                  <span className="font-medium">
                    {uploadedStatementFile
                      ? uploadedStatementFile.name
                      : courseSelection?.statement_url
                        ? "Previously Uploaded Statement"
                        : ""}
                  </span>
                  {courseSelection?.statement_url && !uploadedStatementFile && (
                    <a
                      href={courseSelection.statement_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-primary hover:underline"
                    >
                      ({t("student.statement.viewUploaded")})
                    </a>
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coursesToList.map((course) => {
            const isSelected = selectedCourses.includes(course.id)
            // Assuming current_students and max_students are part of CourseItem
            const isFull = course.current_students >= course.max_students
            const isDisabledForSelection =
              !isSelected && (selectedCourses.length >= electiveCourse.max_selections || isFull)

            return (
              <Card
                key={course.id}
                className={`h-full flex flex-col transition-all ${isSelected ? "border-primary" : ""} ${isDisabledForSelection || isSelectionDisabled ? "opacity-70" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <Badge variant={isFull ? "destructive" : "secondary"} className="ml-2 whitespace-nowrap">
                      <Users className="h-3 w-3 mr-1" />
                      {course.current_students}/{course.max_students}
                    </Badge>
                  </div>
                  <CardDescription>{course.teacher}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 flex-grow">
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                    onClick={() => setViewingCourse(course)}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" />
                    {t("student.courses.viewDescription")}
                  </Button>
                </CardContent>
                <CardFooter className="pt-0">
                  {!isSelectionDisabled && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleCourseSelection(course.id)}
                        disabled={isDisabledForSelection || isSelectionDisabled}
                      />
                      <Label
                        htmlFor={`course-${course.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed"
                      >
                        {isSelected ? t("student.courses.selected") : t("student.courses.select")}
                      </Label>
                    </div>
                  )}
                  {isSelectionDisabled && isSelected && (
                    <Badge
                      variant={courseSelection?.status === "approved" ? "default" : "outline"}
                      className={courseSelection?.status === "approved" ? "bg-green-600 text-white" : ""}
                    >
                      {t("student.courses.selected")}
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {!isSelectionDisabled && (
          <div className="flex justify-end mt-6">
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!canSubmitSelection || submitting} className="px-8" size="lg">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {courseSelection?.selected_course_ids
                    ? t("student.courses.updateSelection")
                    : t("student.courses.confirmSelection")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("student.courses.confirmYourSelection")}</DialogTitle>
                  <DialogDescription>{t("student.courses.reviewSelection")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("student.courses.selectedCourses")}:</h4>
                    <ul className="space-y-1">
                      {selectedCourses.map((courseId) => {
                        const course = coursesToList.find((c) => c.id === courseId)
                        return (
                          <li key={courseId} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {course?.name || "Unknown Course"}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-1">{t("student.statement.title")}:</h4>
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {uploadedStatementFile?.name ||
                          (courseSelection?.statement_url ? "Uploaded Statement" : "Statement Pending")}
                      </span>
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
                      placeholder={t("student.courses.enterFullName")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                    {t("student.courses.cancel")}
                  </Button>
                  <Button onClick={handleSubmit} disabled={!studentName.trim() || submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {t("student.courses.submitSelection")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {isSelectionDisabled && (courseSelection?.status === "pending" || courseSelection?.status === "approved") && (
          <div className="mt-6 p-4 bg-muted rounded-md text-center">
            <p className="text-sm text-muted-foreground">
              {courseSelection?.status === "pending"
                ? t("student.courses.selectionSubmittedPending")
                : t("student.courses.selectionFinalized")}
            </p>
          </div>
        )}

        <Dialog open={!!viewingCourse} onOpenChange={(open) => !open && setViewingCourse(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingCourse?.name}</DialogTitle>
              <DialogDescription>{viewingCourse?.teacher}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">{t("student.courses.courseDescription")}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewingCourse?.description}</p>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button variant="outline" onClick={() => setViewingCourse(null)}>
                {t("student.courses.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
