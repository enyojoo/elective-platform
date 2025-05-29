"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Download, CheckCircle, Clock, Info, Users, BookOpen, ArrowLeft, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus } from "@/lib/types"
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
  DialogFooter,
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

interface ElectivePageProps {
  params: {
    packId: string
  }
}

export default function ElectivePage({ params }: ElectivePageProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { profile, isLoading: profileLoading } = useCachedStudentProfile()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<any>(null)
  const [uploadedStatement, setUploadedStatement] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Data states
  const [electiveData, setElectiveData] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [existingSelection, setExistingSelection] = useState<any>(null)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  useEffect(() => {
    if (!profile?.id || !profile?.institution_id) return

    const fetchData = async () => {
      try {
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch elective course data
        const { data: electiveData, error: electiveError } = await supabase
          .from("elective_courses")
          .select("*")
          .eq("id", params.packId)
          .single()

        if (electiveError) throw electiveError

        // Parse courses from JSON
        let parsedCourses = []
        if (electiveData?.courses) {
          try {
            parsedCourses = JSON.parse(electiveData.courses)
          } catch (e) {
            console.error("Error parsing courses:", e)
          }
        }

        // Fetch existing selection
        const { data: selectionData, error: selectionError } = await supabase
          .from("course_selections")
          .select("*")
          .eq("student_id", profile.id)
          .eq("elective_courses_id", params.packId)
          .single()

        if (selectionError && selectionError.code !== "PGRST116") {
          console.error("Selection error:", selectionError)
        }

        setElectiveData(electiveData)
        setCourses(parsedCourses)
        setExistingSelection(selectionData)

        // Set selected courses from existing selection
        if (selectionData && parsedCourses.length > 0) {
          const selected = parsedCourses.filter((course: any) => course.selected).map((course: any) => course.id)
          setSelectedCourses(selected)
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load elective course data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [profile, params.packId, toast])

  // Handle course selection
  const toggleCourseSelection = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId))
    } else {
      if (selectedCourses.length < (electiveData?.max_selections || 0)) {
        setSelectedCourses([...selectedCourses, courseId])
      }
    }
  }

  // Handle submission
  const handleSubmit = async () => {
    if (!profile?.id || !uploadedStatement) return

    setSubmitting(true)
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      // Upload statement
      const statementUrl = await uploadStatement(uploadedStatement, profile.id, params.packId)

      // Update courses with selection
      const updatedCourses = courses.map((course: any) => ({
        ...course,
        selected: selectedCourses.includes(course.id),
      }))

      // Update elective_courses with selected courses
      const { error: updateError } = await supabase
        .from("elective_courses")
        .update({ courses: JSON.stringify(updatedCourses) })
        .eq("id", params.packId)

      if (updateError) throw updateError

      // Create or update course selection
      const selectionData = {
        student_id: profile.id,
        elective_courses_id: params.packId,
        status: "pending",
        statement_url: statementUrl,
      }

      if (existingSelection) {
        const { error } = await supabase.from("course_selections").update(selectionData).eq("id", existingSelection.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("course_selections").insert(selectionData)

        if (error) throw error
      }

      toast({
        title: "Selection submitted",
        description: "Your course selection has been submitted successfully.",
      })

      // Redirect back to courses page
      window.location.href = "/student/courses"
    } catch (error: any) {
      console.error("Submission error:", error)
      toast({
        title: "Submission failed",
        description: error.message || "An error occurred during submission",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setConfirmDialogOpen(false)
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      setUploadedStatement(file)
      toast({
        title: "File selected",
        description: `"${file.name}" ready for upload.`,
      })
    }
  }

  // Handle statement download
  const handleDownloadStatement = async () => {
    if (!electiveData?.syllabus_template_url) {
      toast({
        title: "No template available",
        description: "Statement template is not available for this course.",
        variant: "destructive",
      })
      return
    }

    setDownloadingStatement(true)
    try {
      window.open(electiveData.syllabus_template_url, "_blank")
      toast({
        title: "Download started",
        description: "The statement template is being downloaded.",
      })
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the statement template.",
        variant: "destructive",
      })
    } finally {
      setDownloadingStatement(false)
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Calculate selection progress
  const selectionProgress = electiveData?.max_selections
    ? (selectedCourses.length / electiveData.max_selections) * 100
    : 0

  // Check if deadline has passed
  const isDeadlinePassed = electiveData?.deadline ? new Date(electiveData.deadline) < new Date() : false

  // Get status alert
  const getStatusAlert = () => {
    if (existingSelection && existingSelection.status === SelectionStatus.APPROVED) {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    } else if (existingSelection && existingSelection.status === SelectionStatus.PENDING) {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    } else if (electiveData?.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>{t("student.courses.comingSoonDesc")}</AlertDescription>
        </Alert>
      )
    } else if (isDeadlinePassed) {
      return (
        <Alert className="bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Selection Period Closed</AlertTitle>
          <AlertDescription>The selection period for this elective has ended.</AlertDescription>
        </Alert>
      )
    } else {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.selectionPeriodDesc")} {electiveData?.max_selections} {t("student.courses.until")}{" "}
            {electiveData?.deadline && formatDate(electiveData.deadline)}.
          </AlertDescription>
        </Alert>
      )
    }
  }

  // Get card style based on selection status
  const getCardStyle = (courseId: string) => {
    const isSelected = selectedCourses.includes(courseId)
    const isDisabled = !isSelected && selectedCourses.length >= (electiveData?.max_selections || 0)

    if (isSelected) {
      if (existingSelection?.status === SelectionStatus.APPROVED) {
        return "border-green-500 bg-green-50/30 dark:bg-green-950/10"
      } else if (existingSelection?.status === SelectionStatus.PENDING) {
        return "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
      } else {
        return "border-primary"
      }
    } else if (isDisabled) {
      return "opacity-60"
    }
    return ""
  }

  if (profileLoading || isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <PageSkeleton />
      </DashboardLayout>
    )
  }

  if (!electiveData) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-semibold mb-2">Course not found</h2>
          <p className="text-muted-foreground mb-4">The elective course you're looking for doesn't exist.</p>
          <Link href="/student/courses">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const electiveName = language === "ru" && electiveData.name_ru ? electiveData.name_ru : electiveData.name

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/student/courses">
            <div className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </div>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{electiveName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{t("student.courses.selectCourses")}</p>
            </div>
          </div>
        </div>

        {getStatusAlert()}

        <Card
          className={
            existingSelection
              ? existingSelection.status === SelectionStatus.APPROVED
                ? "border-green-200 dark:border-green-800"
                : "border-yellow-200 dark:border-yellow-800"
              : ""
          }
        >
          <CardHeader>
            <CardTitle>{t("student.courses.selectionProgress")}</CardTitle>
            <CardDescription>
              {t("student.courses.selectedOutOf")} {selectedCourses.length} {t("student.courses.of")}{" "}
              {electiveData.max_selections} {t("student.courses.allowedCourses")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={selectionProgress}
              className={`h-2 ${
                existingSelection?.status === SelectionStatus.APPROVED
                  ? "bg-green-100 dark:bg-green-950"
                  : existingSelection?.status === SelectionStatus.PENDING
                    ? "bg-yellow-100 dark:bg-yellow-950"
                    : ""
              }`}
              color={
                existingSelection?.status === SelectionStatus.APPROVED
                  ? "bg-green-600"
                  : existingSelection?.status === SelectionStatus.PENDING
                    ? "bg-yellow-600"
                    : undefined
              }
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedCourses.length === electiveData.max_selections
                ? t("student.courses.maxSelections")
                : `${t("student.courses.canSelectMore")} ${electiveData.max_selections - selectedCourses.length} ${
                    electiveData.max_selections - selectedCourses.length === 1
                      ? t("student.courses.moreCourse")
                      : t("student.courses.moreCourses")
                  }`}
            </p>
          </CardContent>
        </Card>

        {/* Statement Download and Upload Section */}
        {electiveData.syllabus_template_url && (
          <Card>
            <CardHeader>
              <CardTitle>{t("student.statement.title")}</CardTitle>
              <CardDescription>{t("student.statement.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 w-full sm:w-[120px] h-10"
                    onClick={handleDownloadStatement}
                    disabled={downloadingStatement || electiveData.status === "draft"}
                  >
                    {downloadingStatement ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>{t("student.statement.download")}</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        <span>{t("student.statement.download")}</span>
                      </>
                    )}
                  </Button>

                  <div className="relative w-full">
                    <Input
                      id="statement-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      disabled={
                        isUploading ||
                        existingSelection?.status === SelectionStatus.APPROVED ||
                        electiveData.status === "draft" ||
                        isDeadlinePassed
                      }
                      className="cursor-pointer"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>{t("student.statement.uploading")}</span>
                      </div>
                    )}
                  </div>
                </div>
                {uploadedStatement && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {t("student.statement.fileUploaded")}{" "}
                      <span className="font-medium">{uploadedStatement.name}</span>
                    </span>
                  </div>
                )}
                {existingSelection?.statement_url && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Statement previously uploaded</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isSelected = selectedCourses.includes(course.id)
            const isDisabled = !isSelected && selectedCourses.length >= electiveData.max_selections
            const isApproved = existingSelection?.status === SelectionStatus.APPROVED

            return (
              <Card key={course.id} className={`h-full transition-all ${getCardStyle(course.id)}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    {course.maxStudents && (
                      <Badge variant="secondary" className="ml-2">
                        <Users className="h-3 w-3 mr-1" />
                        {course.currentStudents || 0}/{course.maxStudents}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{course.teacher}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 flex-grow flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent"
                    onClick={() => setViewingCourse(course)}
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-1" />
                    {t("student.courses.viewDescription")}
                  </Button>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center">
                  {!isApproved && !isDeadlinePassed && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleCourseSelection(course.id)}
                        disabled={isDisabled || isApproved || electiveData.status === "draft"}
                      />
                      <label
                        htmlFor={`course-${course.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {isSelected ? t("student.courses.selected") : t("student.courses.select")}
                      </label>
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {existingSelection?.status !== SelectionStatus.APPROVED && !isDeadlinePassed && (
          <div className="flex justify-end">
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <Button
                disabled={
                  selectedCourses.length === 0 ||
                  selectedCourses.length > electiveData.max_selections ||
                  electiveData.status === "draft" ||
                  (!uploadedStatement && !existingSelection?.statement_url)
                }
                className="px-8"
                onClick={() => {
                  if (selectedCourses.length > 0 && !uploadedStatement && !existingSelection?.statement_url) {
                    toast({
                      title: "Statement required",
                      description: "Please upload your signed statement before confirming your selection.",
                      variant: "destructive",
                    })
                  } else {
                    setConfirmDialogOpen(true)
                  }
                }}
              >
                {existingSelection ? t("student.courses.updateSelection") : t("student.courses.confirmSelection")}
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("student.courses.confirmYourSelection")}</DialogTitle>
                  <DialogDescription>{t("student.courses.reviewSelection")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("student.courses.selectedCourses")}:</h4>
                    <ul className="space-y-2">
                      {selectedCourses.map((courseId) => {
                        const course = courses.find((c) => c.id === courseId)
                        return (
                          <li key={courseId} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {course?.name}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  {/* Statement Information */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Statement:</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>
                        {uploadedStatement
                          ? `${uploadedStatement.name} (${Math.round(uploadedStatement.size / 1024)} KB)`
                          : "Previously uploaded statement will be used"}
                      </span>
                    </div>
                  </div>

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
                <DialogFooter>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !studentName.trim() || submitting || (!uploadedStatement && !existingSelection?.statement_url)
                    }
                  >
                    {submitting ? t("student.courses.submitting") : t("student.courses.submitSelection")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Course Description Dialog */}
        <Dialog open={!!viewingCourse} onOpenChange={(open) => !open && setViewingCourse(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingCourse?.name}</DialogTitle>
              <DialogDescription>{viewingCourse?.teacher}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("student.courses.courseDescription")}</h4>
                <p className="text-sm text-muted-foreground">{viewingCourse?.description}</p>
              </div>
              {selectedCourses.includes(viewingCourse?.id) && (
                <div className="flex justify-end">
                  <Badge
                    variant="outline"
                    className={
                      existingSelection?.status === SelectionStatus.APPROVED
                        ? "bg-green-100/50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                        : existingSelection?.status === SelectionStatus.PENDING
                          ? "bg-yellow-100/50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                          : "bg-primary/10"
                    }
                  >
                    {t("student.courses.selected")}
                  </Badge>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingCourse(null)}>
                {t("student.courses.close")}
              </Button>
              {!existingSelection?.status === SelectionStatus.APPROVED &&
                electiveData.status !== "draft" &&
                !isDeadlinePassed && (
                  <Button
                    onClick={() => {
                      toggleCourseSelection(viewingCourse.id)
                      setViewingCourse(null)
                    }}
                    disabled={
                      !viewingCourse ||
                      (!selectedCourses.includes(viewingCourse.id) &&
                        selectedCourses.length >= electiveData.max_selections)
                    }
                  >
                    {selectedCourses.includes(viewingCourse?.id)
                      ? t("student.courses.removeSelection")
                      : t("student.courses.selectCourse")}
                  </Button>
                )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
