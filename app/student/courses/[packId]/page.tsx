"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useDataCache } from "@/lib/data-cache-context"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, Clock, Info, ArrowLeft, Loader2, Users, BookOpen, Download } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useLanguage } from "@/lib/language-context"
import { uploadStatement } from "@/lib/file-utils"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Define the SelectionStatus enum
enum SelectionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

interface CourseDetailData {
  id: string
  name: string
  formatted_name: string
  semester: string
  year: number
  max_selections: number
  status: string
  start_date: string
  end_date: string
  description: string
  courses: Array<{
    id: string
    name: string
    code: string
    description: string
    credits: number
    max_students: number
    current_students?: number
    selected: boolean
    selection_status: string | null
    teacher?: string
  }>
  selected_courses: Array<{
    course_id: string
    status: string
  }>
  selected_count: number
}

// Update the handleFileUpload function to use real file uploads
const handleFileUpload = async (
  e: React.ChangeEvent<HTMLInputElement>,
  userId: string,
  packId: string,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  setUploadedStatement: React.Dispatch<React.SetStateAction<File | null>>,
  toast: any,
) => {
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

    // Check file size (max 5MB)
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
      // Upload the file to Supabase storage
      const statementUrl = await uploadStatement(file, userId, packId)

      // In a real app, you would save this URL to the database
      // For example:
      // await supabase
      //   .from('course_selections')
      //   .update({ statement_url: statementUrl })
      //   .eq('user_id', userId)
      //   .eq('pack_id', packId)

      setUploadedStatement(file)
      toast({
        title: "Statement uploaded",
        description: `File "${file.name}" uploaded successfully.`,
      })
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

export default function ElectiveCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.packId as string
  const [isLoading, setIsLoading] = useState(true)
  const [courseData, setCourseData] = useState<CourseDetailData | null>(null)
  const { toast } = useToast()
  const { getCachedData, setCachedData } = useDataCache()
  const supabase = getSupabaseBrowserClient()
  const { t } = useLanguage()

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<any>(null)
  const [uploadedStatement, setUploadedStatement] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // State for selected courses
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])

  useEffect(() => {
    // Get the current user
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
      } else {
        // Redirect to login if not authenticated
        router.push("/student/login")
      }
    }

    getCurrentUser()
  }, [supabase, router])

  // Handle course selection
  const toggleCourseSelection = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId))
    } else {
      if (courseData && selectedCourses.length < courseData.max_selections) {
        setSelectedCourses([...selectedCourses, courseId])
      }
    }
  }

  // Handle submission
  const handleSubmit = async () => {
    if (!userId || !courseData) return

    setSubmitting(true)

    try {
      // First, delete any existing selections for this elective course
      const { error: deleteError } = await supabase
        .from("course_selections")
        .delete()
        .eq("student_id", userId)
        .eq("elective_course_id", courseData.id)

      if (deleteError) throw deleteError

      // Then insert the new selections
      const selectionsToInsert = selectedCourses.map((courseId) => ({
        student_id: userId,
        course_id: courseId,
        elective_course_id: courseData.id,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase.from("course_selections").insert(selectionsToInsert)

      if (insertError) throw insertError

      toast({
        title: "Selection submitted",
        description: "Your course selection has been submitted successfully.",
      })

      // Invalidate cache
      setCachedData(`electiveCourseDetail-${packId}`, "current", null)
      setCachedData("studentElectiveCourses", "current", null)

      // Redirect back to courses page
      router.push("/student/courses")
    } catch (error) {
      console.error("Error submitting selections:", error)
      toast({
        title: "Submission failed",
        description: "There was an error submitting your selections. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      setConfirmDialogOpen(false)
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Handle statement download
  const handleDownloadStatement = () => {
    setDownloadingStatement(true)
    // Simulate download delay
    setTimeout(() => {
      // In a real app, this would download the actual statement
      console.log("Downloading statement")
      toast({
        title: "Statement downloaded",
        description: "The statement has been downloaded successfully.",
      })
      setDownloadingStatement(false)
    }, 1000)
  }

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!userId) return

      setIsLoading(true)

      try {
        // Try to get data from cache first
        const cacheKey = `electiveCourseDetail-${packId}`
        const cachedData = getCachedData<CourseDetailData>(cacheKey, "current")

        if (cachedData) {
          console.log("Using cached elective course detail data")
          setCourseData(cachedData)

          // Set selected courses from cached data
          const selectedCourseIds = cachedData.selected_courses.map((sc) => sc.course_id)
          setSelectedCourses(selectedCourseIds)

          setIsLoading(false)
          return
        }

        // Fetch the elective course details
        const { data: courseDetails, error: courseError } = await supabase
          .from("elective_courses")
          .select(`
            id, 
            name, 
            semester,
            year,
            max_selections,
            status,
            start_date,
            end_date,
            courses,
            description,
            institution_id
          `)
          .eq("id", packId)
          .single()

        if (courseError) {
          throw courseError
        }

        // Get student selections for this course from course_selections table
        const { data: studentSelections, error: selectionsError } = await supabase
          .from("course_selections")
          .select("course_id, status")
          .eq("student_id", userId)
          .eq("elective_course_id", packId)

        if (selectionsError) {
          throw selectionsError
        }

        // Get course details for the courses in this elective
        let coursesList = []
        if (Array.isArray(courseDetails.courses) && courseDetails.courses.length > 0) {
          const { data: coursesData, error: coursesError } = await supabase
            .from("courses")
            .select("id, name, code, description, credits, max_students")
            .in("id", courseDetails.courses)

          if (coursesError) {
            throw coursesError
          }

          // Add selection status to each course
          coursesList = coursesData.map((course) => {
            const selection = studentSelections?.find((s) => s.course_id === course.id)
            return {
              ...course,
              selected: !!selection,
              selection_status: selection?.status || null,
              // Mock current students for now - in a real app you would get this from the database
              current_students: Math.floor(Math.random() * course.max_students),
              teacher: `Dr. ${["Smith", "Johnson", "Williams", "Brown", "Jones"][Math.floor(Math.random() * 5)]}`,
            }
          })
        }

        // Combine all data
        const formattedData = {
          ...courseDetails,
          formatted_name: `${courseDetails.semester.charAt(0).toUpperCase() + courseDetails.semester.slice(1)} ${courseDetails.year}`,
          courses: coursesList,
          selected_courses: studentSelections || [],
          selected_count: studentSelections?.length || 0,
        }

        // Save to cache
        setCachedData(cacheKey, "current", formattedData)

        setCourseData(formattedData)

        // Set selected courses
        const selectedCourseIds = studentSelections?.map((sc) => sc.course_id) || []
        setSelectedCourses(selectedCourseIds)
      } catch (error: any) {
        console.error("Error fetching course details:", error)
        toast({
          title: "Error",
          description: "Failed to load course details. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (packId && userId) {
      fetchCourseDetails()
    }
  }, [packId, userId, supabase, toast, getCachedData, setCachedData])

  // Calculate selection progress
  const selectionProgress = courseData ? (selectedCourses.length / courseData.max_selections) * 100 : 0

  // Get status alert
  const getStatusAlert = () => {
    if (!courseData) return null

    // Check if any selections are approved
    const hasApprovedSelections = courseData.selected_courses.some((sc) => sc.status === SelectionStatus.APPROVED)

    // Check if any selections are pending
    const hasPendingSelections = courseData.selected_courses.some((sc) => sc.status === SelectionStatus.PENDING)

    if (hasApprovedSelections) {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    } else if (hasPendingSelections) {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    } else if (courseData.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.comingSoonDesc")} {formatDate(courseData.start_date)}.
          </AlertDescription>
        </Alert>
      )
    } else {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.selectionPeriodDesc")} {courseData.max_selections} {t("student.courses.until")}{" "}
            {formatDate(courseData.end_date)}.
          </AlertDescription>
        </Alert>
      )
    }
  }

  // Get card style based on selection status
  const getCardStyle = (course: any) => {
    const isSelected = selectedCourses.includes(course.id)
    const isFull = course.current_students >= course.max_students
    const isDisabled = !isSelected && (selectedCourses.length >= (courseData?.max_selections || 0) || isFull)

    if (isSelected) {
      if (course.selection_status === SelectionStatus.APPROVED) {
        return "border-green-500 bg-green-50/30 dark:bg-green-950/10"
      } else if (course.selection_status === SelectionStatus.PENDING) {
        return "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
      } else {
        return "border-primary"
      }
    } else if (isDisabled) {
      return "opacity-60"
    }
    return ""
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div>
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        ) : courseData ? (
          <>
            <div className="flex items-center gap-2">
              <Link href="/student/courses">
                <div className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted">
                  <ArrowLeft className="h-5 w-5" />
                </div>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{courseData.formatted_name}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">{t("student.courses.selectCourses")}</p>
                </div>
              </div>
            </div>

            {getStatusAlert()}

            <Card
              className={
                courseData.selected_courses.length > 0
                  ? courseData.selected_courses.some((sc) => sc.status === SelectionStatus.APPROVED)
                    ? "border-green-200 dark:border-green-800"
                    : "border-yellow-200 dark:border-yellow-800"
                  : ""
              }
            >
              <CardHeader>
                <CardTitle>{t("student.courses.selectionProgress")}</CardTitle>
                <CardDescription>
                  {t("student.courses.selectedOutOf")} {selectedCourses.length} {t("student.courses.of")}{" "}
                  {courseData.max_selections} {t("student.courses.allowedCourses")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  value={selectionProgress}
                  className={`h-2 ${
                    courseData.selected_courses.some((sc) => sc.status === SelectionStatus.APPROVED)
                      ? "bg-green-100 dark:bg-green-950"
                      : courseData.selected_courses.some((sc) => sc.status === SelectionStatus.PENDING)
                        ? "bg-yellow-100 dark:bg-yellow-950"
                        : ""
                  }`}
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedCourses.length === courseData.max_selections
                    ? t("student.courses.maxSelections")
                    : `${t("student.courses.canSelectMore")} ${courseData.max_selections - selectedCourses.length} ${
                        courseData.max_selections - selectedCourses.length === 1
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
                      disabled={downloadingStatement || courseData.status === "draft"}
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
                        onChange={(e) =>
                          handleFileUpload(e, userId || "", packId, setIsUploading, setUploadedStatement, toast)
                        }
                        disabled={
                          isUploading ||
                          courseData.selected_courses.some((sc) => sc.status === SelectionStatus.APPROVED) ||
                          courseData.status === "draft"
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
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courseData.courses.map((course) => {
                const isSelected = selectedCourses.includes(course.id)
                const isFull = course.current_students >= course.max_students
                const isDisabled = !isSelected && (selectedCourses.length >= courseData.max_selections || isFull)
                const isApproved = course.selection_status === SelectionStatus.APPROVED

                return (
                  <Card key={course.id} className={`h-full transition-all ${getCardStyle(course)}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <Badge variant={isFull ? "destructive" : "secondary"} className="ml-2">
                          <Users className="h-3 w-3 mr-1" />
                          {course.current_students}/{course.max_students}
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
                      {!isApproved && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`course-${course.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleCourseSelection(course.id)}
                            disabled={isDisabled || isApproved || courseData.status === "draft"}
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

            {!courseData.selected_courses.some((sc) => sc.status === SelectionStatus.APPROVED) && (
              <div className="flex justify-end">
                <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      disabled={
                        selectedCourses.length === 0 ||
                        selectedCourses.length > courseData.max_selections ||
                        courseData.status === "draft" ||
                        !uploadedStatement
                      }
                      className="px-8"
                      onClick={() => {
                        if (selectedCourses.length > 0 && !uploadedStatement) {
                          toast({
                            title: "Statement required",
                            description: "Please upload your signed statement before confirming your selection.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      {courseData.selected_courses.length > 0
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
                        <ul className="space-y-2">
                          {selectedCourses.map((courseId) => {
                            const course = courseData.courses.find((c) => c.id === courseId)
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
                            {uploadedStatement?.name} ({Math.round(uploadedStatement?.size / 1024)} KB)
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
                      <Button onClick={handleSubmit} disabled={!studentName.trim() || submitting || !uploadedStatement}>
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
                          viewingCourse?.selection_status === SelectionStatus.APPROVED
                            ? "bg-green-100/50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                            : viewingCourse?.selection_status === SelectionStatus.PENDING
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
                  {!courseData.selected_courses.some((sc) => sc.status === SelectionStatus.APPROVED) &&
                    courseData.status !== "draft" && (
                      <Button
                        onClick={() => {
                          toggleCourseSelection(viewingCourse.id)
                          setViewingCourse(null)
                        }}
                        disabled={
                          !viewingCourse ||
                          (!selectedCourses.includes(viewingCourse.id) &&
                            selectedCourses.length >= courseData.max_selections)
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
          </>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-lg font-medium">Course not found</h3>
            <p className="text-muted-foreground mt-2">The requested elective course could not be found.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
