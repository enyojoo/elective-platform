"use client"

import type React from "react"
import { DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Download, CheckCircle, Clock, Info, Users, BookOpen, ArrowLeft, Loader2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
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
import { selectElectiveCourse, uploadStatement } from "@/app/actions/student-selections"

interface ElectivePageProps {
  params: {
    packId: string
  }
}

interface ElectiveCourse {
  id: string
  name: string
  name_ru: string | null
  status: string
  deadline: string
  max_selections: number
  syllabus_template_url: string | null
  courses: any[]
  institution_id: string
  created_at: string
  updated_at: string
}

interface CourseSelection {
  id: string
  student_id: string
  elective_courses_id: string
  status: string
  statement_url: string | null
  created_at: string
  updated_at: string
}

export default function ElectivePage({ params }: ElectivePageProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const [electiveCourse, setElectiveCourse] = useState<ElectiveCourse | null>(null)
  const [courseSelection, setCourseSelection] = useState<CourseSelection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<any>(null)
  const [uploadedStatement, setUploadedStatement] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [params.packId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("User not authenticated")
        return
      }

      // Fetch elective course
      const { data: electiveCourseData, error: electiveCourseError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", params.packId)
        .single()

      if (electiveCourseError) {
        setError(electiveCourseError.message)
        return
      }

      // Fetch user's selection for this elective course
      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("student_id", user.id)
        .eq("elective_courses_id", params.packId)
        .maybeSingle()

      if (selectionError && selectionError.code !== "PGRST116") {
        setError(selectionError.message)
        return
      }

      setElectiveCourse(electiveCourseData)
      setCourseSelection(selectionData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Handle course selection
  const toggleCourseSelection = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId))
    } else {
      if (selectedCourses.length < (electiveCourse?.max_selections || 1)) {
        setSelectedCourses([...selectedCourses, courseId])
      }
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

      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append("electiveCoursesId", params.packId)
        formData.append("statement", file)

        const result = await uploadStatement(formData)

        if (result.error) {
          throw new Error(result.error)
        }

        setUploadedStatement(file)
        toast({
          title: "Statement uploaded",
          description: `File "${file.name}" uploaded successfully.`,
        })

        // Refresh data to get updated selection
        await fetchData()
      } catch (error) {
        console.error("Statement upload error:", error)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "An error occurred during upload",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    }
  }

  // Handle submission
  const handleSubmit = async () => {
    if (!electiveCourse) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("electiveCoursesId", params.packId)
      formData.append("selectedCourseIds", JSON.stringify(selectedCourses))

      const result = await selectElectiveCourse(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      setConfirmDialogOpen(false)
      toast({
        title: "Selection submitted",
        description: "Your course selection has been submitted successfully.",
      })

      // Refresh data
      await fetchData()
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
      setTimeout(() => setDownloadingStatement(false), 1000)
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Calculate selection progress
  const selectionProgress = electiveCourse ? (selectedCourses.length / electiveCourse.max_selections) * 100 : 0

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !electiveCourse) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="text-center text-red-600">
          <p>Error: {error || "Elective course not found"}</p>
          <Link href="/student/courses">
            <Button className="mt-4">Back to Courses</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const courses = Array.isArray(electiveCourse.courses) ? electiveCourse.courses : []

  // Get status alert
  const getStatusAlert = () => {
    if (courseSelection && courseSelection.status === "approved") {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    } else if (courseSelection && courseSelection.status === "pending") {
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
            <h1 className="text-3xl font-bold tracking-tight">{electiveCourse.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{t("student.courses.selectCourses")}</p>
            </div>
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
            <Progress value={selectionProgress} className="h-2" />
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

        {/* Statement Download and Upload Section */}
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
                  disabled={downloadingStatement || !electiveCourse.syllabus_template_url}
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
                      isUploading || courseSelection?.status === "approved" || electiveCourse.status === "draft"
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
              {(uploadedStatement || courseSelection?.statement_url) && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {t("student.statement.fileUploaded")}{" "}
                    <span className="font-medium">{uploadedStatement?.name || "Statement uploaded"}</span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, index) => {
            const courseId = course.id || `course-${index}`
            const isSelected = selectedCourses.includes(courseId)
            const isDisabled = !isSelected && selectedCourses.length >= electiveCourse.max_selections
            const isApproved = courseSelection?.status === "approved"

            return (
              <Card key={courseId} className="h-full transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      <Users className="h-3 w-3 mr-1" />
                      {course.current_students || 0}/{course.max_students || 30}
                    </Badge>
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
                  {!isApproved && !courseSelection && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${courseId}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleCourseSelection(courseId)}
                        disabled={isDisabled || electiveCourse.status === "draft"}
                      />
                      <label
                        htmlFor={`course-${courseId}`}
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

        {!courseSelection && (
          <div className="flex justify-end">
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={
                    selectedCourses.length === 0 ||
                    selectedCourses.length > electiveCourse.max_selections ||
                    electiveCourse.status === "draft" ||
                    !courseSelection?.statement_url
                  }
                  className="px-8"
                >
                  {t("student.courses.confirmSelection")}
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
                    <ul className="space-y-2">
                      {selectedCourses.map((courseId) => {
                        const course = courses.find((c) => (c.id || `course-${courses.indexOf(c)}`) === courseId)
                        return (
                          <li key={courseId} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {course?.name}
                          </li>
                        )
                      })}
                    </ul>
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
                  <Button onClick={handleSubmit} disabled={!studentName.trim() || submitting}>
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
            </div>
            <DialogFooter>
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
