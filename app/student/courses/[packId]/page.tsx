"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Download, CheckCircle, Clock, Info, Users, BookOpen, ArrowLeft, Loader2, AlertTriangle } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus, type Database } from "@/lib/types" // Assuming Database types are generated
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"

// Define interfaces for fetched data
interface ElectivePack {
  id: string
  name: string
  semester: string | null
  year: number | null
  max_selections: number
  status: "draft" | "published" | "archived"
  start_date: string
  end_date: string
  syllabus_template_url: string | null
  group_id?: string | null // For group-specific packs
}

interface Course {
  id: string
  name: string
  description: string | null
  max_students: number
  current_students: number
  teacher: string | null
  // elective_pack_id: string // if courses are linked to packs
}

interface StudentSelection {
  id?: string // if updating
  user_id: string
  elective_pack_id: string
  selected_course_ids: string[]
  status: SelectionStatus
  statement_url: string | null
  authorized_by?: string | null
  created_at?: string
  updated_at?: string
}

interface UserProfile {
  id: string
  full_name: string | null
  group_id?: string | null // For filtering packs by student group
}

interface ElectivePageProps {
  params: {
    packId: string
  }
}

export default function ElectivePage({ params }: ElectivePageProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  const [electivePackData, setElectivePackData] = useState<ElectivePack | null>(null)
  const [coursesForPack, setCoursesForPack] = useState<Course[]>([])
  const [studentSelection, setStudentSelection] = useState<StudentSelection | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentFullName, setStudentFullName] = useState("") // For confirmation dialog
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null)

  const [uploadedStatementFile, setUploadedStatementFile] = useState<File | null>(null)
  const [uploadedStatementUrl, setUploadedStatementUrl] = useState<string | null>(null)
  const [isUploadingStatement, setIsUploadingStatement] = useState(false)
  const [isDownloadingStatement, setIsDownloadingStatement] = useState(false)

  const fetchPageData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("ElectivePage: Attempting to get Supabase session...")
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("ElectivePage: Supabase getSession error:", sessionError)
        throw new Error(`Failed to retrieve session: ${sessionError.message}`)
      }

      if (!session) {
        console.warn("ElectivePage: No active Supabase session found by getSession().")
        throw new Error("Auth session missing! No active session available to the client.")
      }
      console.log("ElectivePage: Active session found. User ID:", session.user.id)
      const user = session.user // Use user from the validated session

      // Fetch User Profile (including group_id)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, group_id")
        .eq("id", user.id) // Use user.id from the session
        .single()

      if (profileError) throw new Error(`Failed to fetch profile: ${profileError.message}`)
      if (!profileData) throw new Error("Profile not found.")
      setUserProfile(profileData)
      setStudentFullName(profileData.full_name || "")

      // Fetch Elective Pack Data (elective_courses table)
      // Ensure this query also considers student's group_id if packs are group-specific
      const { data: packData, error: packError } = await supabase
        .from("elective_courses") // This is the "pack" table
        .select("*")
        .eq("id", params.packId)
        // .eq("group_id", profileData.group_id) // Uncomment if packs are filtered by student group
        .single()

      if (packError) throw new Error(`Failed to fetch elective pack: ${packError.message}`)
      if (!packData) {
        setError("Elective pack not found or you do not have access to it.")
        setIsLoading(false)
        return
      }
      setElectivePackData(packData as ElectivePack)

      // Fetch Courses for the Pack (assuming a 'courses' table linked to 'elective_courses')
      // This might need adjustment based on your actual schema (e.g., a join table or direct link)
      const { data: packCourses, error: coursesError } = await supabase
        .from("courses") // This is the actual courses table
        .select("*") // Adjust columns as needed
        .eq("elective_course_id", params.packId) // Assuming 'elective_course_id' links courses to the pack
      // Add .order() if needed

      if (coursesError) throw new Error(`Failed to fetch courses for pack: ${coursesError.message}`)
      setCoursesForPack((packCourses as Course[]) || [])

      // Fetch Existing Student Selection
      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("user_id", user.id)
        .eq("elective_pack_id", params.packId)
        .maybeSingle() // Use maybeSingle as selection might not exist

      if (selectionError) throw new Error(`Failed to fetch student selection: ${selectionError.message}`)
      if (selectionData) {
        setStudentSelection(selectionData as StudentSelection)
        setSelectedCourses(selectionData.selected_course_ids || [])
        setUploadedStatementUrl(selectionData.statement_url || null)
      }
    } catch (err: any) {
      console.error("ElectivePage: Error fetching page data:", err)
      setError(err.message || "An unexpected error occurred while fetching page data.")
      toast({
        title: "Error Loading Page",
        description: err.message || "Could not load page data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [params.packId, supabase, toast])

  useEffect(() => {
    fetchPageData()
  }, [fetchPageData])

  const toggleCourseSelection = (courseId: string) => {
    if (!electivePackData) return

    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId))
    } else {
      if (selectedCourses.length < electivePackData.max_selections) {
        setSelectedCourses([...selectedCourses, courseId])
      } else {
        toast({
          title: t("student.courses.maxSelectionsReachedTitle"),
          description: t("student.courses.maxSelectionsReachedDesc", { max: electivePackData.max_selections }),
          variant: "warning",
        })
      }
    }
  }

  const handleDownloadStatementTemplate = async () => {
    if (!electivePackData?.syllabus_template_url) {
      toast({
        title: "No Statement Template",
        description: "A statement template has not been provided for this elective pack.",
        variant: "warning",
      })
      return
    }
    setIsDownloadingStatement(true)
    try {
      // Assuming syllabus_template_url is a direct public URL from Supabase storage
      // If it's a path, you might need to construct the public URL or use supabase.storage.from().download()
      window.open(electivePackData.syllabus_template_url, "_blank")
      toast({ title: "Statement Downloading", description: "The statement template should begin downloading shortly." })
    } catch (error: any) {
      toast({
        title: "Download Error",
        description: error.message || "Failed to download statement.",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingStatement(false)
    }
  }

  const handleStatementFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!userProfile || !electivePackData) {
      toast({ title: "Error", description: "User or pack data missing.", variant: "destructive" })
      return
    }

    if (file.type !== "application/pdf") {
      toast({ title: "Invalid File Type", description: "Please upload a PDF file.", variant: "destructive" })
      return
    }

    setIsUploadingStatement(true)
    setUploadedStatementFile(file) // For displaying name, even if upload fails initially

    try {
      const filePath = `statements/${userProfile.id}/${electivePackData.id}/${Date.now()}_${file.name}`
      const { data, error: uploadError } = await supabase.storage
        .from("student_documents") // Ensure this bucket exists and has correct policies
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("student_documents").getPublicUrl(data.path)
      setUploadedStatementUrl(publicUrl)
      toast({ title: "Statement Uploaded", description: `File "${file.name}" uploaded successfully.` })
    } catch (error: any) {
      console.error("Statement upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload statement.",
        variant: "destructive",
      })
      setUploadedStatementUrl(null) // Clear URL on failure
    } finally {
      setIsUploadingStatement(false)
    }
  }

  const handleSubmitSelection = async () => {
    if (!userProfile || !electivePackData || !studentFullName.trim() || !uploadedStatementUrl) {
      if (!uploadedStatementUrl) {
        toast({
          title: "Statement Required",
          description: "Please upload your signed statement.",
          variant: "destructive",
        })
      }
      if (!studentFullName.trim()) {
        toast({
          title: "Full Name Required",
          description: "Please enter your full name to confirm.",
          variant: "destructive",
        })
      }
      return
    }

    setSubmitting(true)
    try {
      const selectionPayload: Omit<StudentSelection, "id" | "created_at" | "updated_at"> & { id?: string } = {
        user_id: userProfile.id,
        elective_pack_id: electivePackData.id,
        selected_course_ids: selectedCourses,
        status: SelectionStatus.PENDING, // Default to pending, admin approves
        statement_url: uploadedStatementUrl,
        authorized_by: studentFullName.trim(), // Or null if admin authorizes
      }

      if (studentSelection?.id) {
        // Update existing selection
        selectionPayload.id = studentSelection.id
        const { error } = await supabase
          .from("course_selections")
          .update(selectionPayload)
          .eq("id", studentSelection.id)
        if (error) throw error
        toast({ title: "Selection Updated", description: "Your course selection has been updated." })
      } else {
        // Insert new selection
        const { error } = await supabase.from("course_selections").insert(selectionPayload)
        if (error) throw error
        toast({ title: "Selection Submitted", description: "Your course selection has been submitted." })
      }
      setConfirmDialogOpen(false)
      fetchPageData() // Refresh data to show new status
      // Optionally redirect: window.location.href = "/student/courses"
    } catch (error: any) {
      console.error("Submission error:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Could not submit selection.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  if (!electivePackData) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>The requested elective pack could not be found or is not accessible.</AlertDescription>
        </Alert>
      </DashboardLayout>
    )
  }

  const selectionProgress =
    electivePackData.max_selections > 0 ? (selectedCourses.length / electivePackData.max_selections) * 100 : 0
  const isSelectionApproved = studentSelection?.status === SelectionStatus.APPROVED
  const isSelectionPending = studentSelection?.status === SelectionStatus.PENDING
  const isPackDraft = electivePackData.status === "draft"

  const getStatusAlert = () => {
    if (isSelectionApproved) {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    } else if (isSelectionPending) {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.courses.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    } else if (isPackDraft) {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.comingSoonDesc")} {formatDate(electivePackData.start_date)}.
          </AlertDescription>
        </Alert>
      )
    } else {
      // Pack is published, no selection or selection rejected/cancelled
      const now = new Date()
      const endDate = new Date(electivePackData.end_date)
      if (now > endDate) {
        return (
          <Alert variant="warning">
            <Info className="h-4 w-4" />
            <AlertTitle>{t("student.courses.selectionPeriodEnded")}</AlertTitle>
            <AlertDescription>
              {t("student.courses.selectionPeriodEndedDesc", { endDate: formatDate(electivePackData.end_date) })}
            </AlertDescription>
          </Alert>
        )
      }
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.selectionPeriodDesc", {
              maxSelections: electivePackData.max_selections,
              endDate: formatDate(electivePackData.end_date),
            })}
          </AlertDescription>
        </Alert>
      )
    }
  }

  const getCardStyle = (courseId: string) => {
    const isSelected = selectedCourses.includes(courseId)
    if (isSelected) {
      if (isSelectionApproved) return "border-green-500 bg-green-50/30 dark:bg-green-950/10"
      if (isSelectionPending) return "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
      return "border-primary"
    }
    // Check if course is full or max selections reached for disabling non-selected cards
    const course = coursesForPack.find((c) => c.id === courseId)
    const isFull = course && course.current_students >= course.max_students
    if (!isSelected && (selectedCourses.length >= electivePackData.max_selections || isFull)) {
      return "opacity-60 cursor-not-allowed"
    }
    return ""
  }

  const canSubmit =
    selectedCourses.length > 0 &&
    selectedCourses.length <= electivePackData.max_selections &&
    !isPackDraft &&
    !isSelectionApproved && // Cannot submit if already approved
    !!uploadedStatementUrl // Statement must be uploaded

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="h-10 w-10">
            <Link href="/student/courses">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{electivePackData.name}</h1>
            <p className="text-sm text-muted-foreground">
              {t("student.courses.selectCoursesFor")} {electivePackData.semester} {electivePackData.year}
            </p>
          </div>
        </div>

        {getStatusAlert()}

        <Card
          className={
            isSelectionApproved
              ? "border-green-200 dark:border-green-800"
              : isSelectionPending
                ? "border-yellow-200 dark:border-yellow-800"
                : ""
          }
        >
          <CardHeader>
            <CardTitle>{t("student.courses.selectionProgress")}</CardTitle>
            <CardDescription>
              {t("student.courses.selectedOutOf")} {selectedCourses.length} {t("student.courses.of")}{" "}
              {electivePackData.max_selections} {t("student.courses.allowedCourses")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={selectionProgress}
              className={`h-2 ${isSelectionApproved ? "bg-green-100 dark:bg-green-950" : isSelectionPending ? "bg-yellow-100 dark:bg-yellow-950" : ""}`}
              indicatorClassName={
                isSelectionApproved ? "bg-green-600" : isSelectionPending ? "bg-yellow-600" : "bg-primary"
              }
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedCourses.length === electivePackData.max_selections
                ? t("student.courses.maxSelections")
                : `${t("student.courses.canSelectMore")} ${electivePackData.max_selections - selectedCourses.length} ${
                    electivePackData.max_selections - selectedCourses.length === 1
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
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto h-10"
                onClick={handleDownloadStatementTemplate}
                disabled={isDownloadingStatement || isPackDraft || !electivePackData.syllabus_template_url}
              >
                {isDownloadingStatement ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
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
                  onChange={handleStatementFileUpload}
                  disabled={isUploadingStatement || isSelectionApproved || isPackDraft}
                  className="cursor-pointer"
                />
                {isUploadingStatement && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span>{t("student.statement.uploading")}</span>
                  </div>
                )}
              </div>
            </div>
            {(uploadedStatementUrl || uploadedStatementFile) && (
              <div
                className={`flex items-center gap-2 p-2 rounded-md text-sm ${uploadedStatementUrl ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"}`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>
                  {uploadedStatementUrl ? t("student.statement.fileUploaded") : t("student.statement.fileSelected")}
                  <span className="font-medium"> {uploadedStatementFile?.name}</span>
                  {uploadedStatementUrl && (
                    <a href={uploadedStatementUrl} target="_blank" rel="noopener noreferrer" className="ml-2 underline">
                      ({t("student.statement.viewUploaded")})
                    </a>
                  )}
                </span>
              </div>
            )}
            {!electivePackData.syllabus_template_url && !isPackDraft && (
              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertTitle>{t("student.statement.noTemplateTitle")}</AlertTitle>
                <AlertDescription>{t("student.statement.noTemplateDescription")}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coursesForPack.map((course) => {
            const isSelected = selectedCourses.includes(course.id)
            const isFull = course.current_students >= course.max_students
            const isDisabledByMaxSelection = !isSelected && selectedCourses.length >= electivePackData.max_selections
            const isDisabled = isDisabledByMaxSelection || (isFull && !isSelected) || isSelectionApproved || isPackDraft

            return (
              <Card
                key={course.id}
                className={`h-full flex flex-col transition-all ${getCardStyle(course.id)} ${isDisabled && !isSelected ? "opacity-60" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <Badge variant={isFull ? "destructive" : "secondary"} className="ml-2 shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      {course.current_students}/{course.max_students}
                    </Badge>
                  </div>
                  <CardDescription>{course.teacher || "N/A"}</CardDescription>
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
                  {!isSelectionApproved && !isPackDraft && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`course-${course.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleCourseSelection(course.id)}
                        disabled={isDisabled}
                        aria-label={`Select course ${course.name}`}
                      />
                      <Label
                        htmlFor={`course-${course.id}`}
                        className={`text-sm font-medium leading-none ${isDisabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                      >
                        {isSelected ? t("student.courses.selected") : t("student.courses.select")}
                      </Label>
                    </div>
                  )}
                  {isSelectionApproved && isSelected && (
                    <Badge variant="success" className="text-xs">
                      {t("student.courses.approved")}
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {!isSelectionApproved && !isPackDraft && (
          <div className="flex justify-end mt-6">
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={!canSubmit || submitting}
                  className="px-8"
                  onClick={() => {
                    if (!uploadedStatementUrl) {
                      toast({
                        title: "Statement Required",
                        description: "Please upload your signed statement before confirming.",
                        variant: "warning",
                      })
                      return
                    }
                    if (selectedCourses.length === 0) {
                      toast({
                        title: "No Courses Selected",
                        description: "Please select at least one course.",
                        variant: "warning",
                      })
                      return
                    }
                    setConfirmDialogOpen(true)
                  }}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {studentSelection ? t("student.courses.updateSelection") : t("student.courses.confirmSelection")}
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
                        const course = coursesForPack.find((c) => c.id === courseId)
                        return (
                          <li key={courseId} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                            {course?.name || "Unknown Course"}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">{t("student.statement.uploadedStatement")}:</h4>
                    {uploadedStatementUrl && uploadedStatementFile ? (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        <span>
                          {uploadedStatementFile.name} ({Math.round(uploadedStatementFile.size / 1024)} KB)
                        </span>
                        <a
                          href={uploadedStatementUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 underline text-xs"
                        >
                          ({t("student.statement.view")})
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("student.statement.notUploadedYet")}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="student-full-name">
                      {t("student.courses.yourFullName")} ({t("student.courses.toAuthorize")})
                    </Label>
                    <Input
                      id="student-full-name"
                      value={studentFullName}
                      onChange={(e) => setStudentFullName(e.target.value)}
                      placeholder={t("student.courses.enterFullName")}
                      disabled={submitting}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={submitting}>
                    {t("student.courses.cancel")}
                  </Button>
                  <Button
                    onClick={handleSubmitSelection}
                    disabled={!studentFullName.trim() || submitting || !uploadedStatementUrl}
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("student.courses.submitSelection")}
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
              <DialogDescription>{viewingCourse?.teacher || "N/A"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("student.courses.courseDescription")}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {viewingCourse?.description || t("student.courses.noDescription")}
                </p>
              </div>
              {selectedCourses.includes(viewingCourse?.id || "") && (
                <div className="flex justify-end">
                  <Badge
                    variant="outline"
                    className={
                      isSelectionApproved
                        ? "bg-green-100/50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                        : isSelectionPending
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
              {!isSelectionApproved && !isPackDraft && viewingCourse && (
                <Button
                  onClick={() => {
                    toggleCourseSelection(viewingCourse.id)
                    setViewingCourse(null)
                  }}
                  disabled={
                    !selectedCourses.includes(viewingCourse.id) &&
                    selectedCourses.length >= electivePackData.max_selections
                  }
                >
                  {selectedCourses.includes(viewingCourse.id)
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
