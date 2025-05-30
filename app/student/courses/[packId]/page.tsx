"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Download, CheckCircle, Info, ArrowLeft, Loader2, AlertTriangle, FileText, Check } from "lucide-react"
import { UserRole, SelectionStatus } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

import type { Database } from "@/lib/database.types" // Adjust if your path is different
// Assuming you have these types defined, potentially generated from your Supabase schema
type ElectiveCourse = Database["public"]["Tables"]["elective_courses"]["Row"]
type Course = Database["public"]["Tables"]["courses"]["Row"]
type CourseSelection = Database["public"]["Tables"]["course_selections"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]
// enum SelectionStatus {
//   DRAFT = "draft",
//   PENDING = "pending",
//   APPROVED = "approved",
//   REJECTED = "rejected",
// }
// enum UserRole { // Assuming UserRole enum exists
//   STUDENT = "student",
//   ADMIN = "admin",
//   PROGRAM_MANAGER = "program_manager",
// }

// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Progress } from "@/components/ui/progress"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { useToast } from "@/components/ui/use-toast"
// import { DashboardLayout } from "@/components/dashboard-layout" // Assuming this component exists
// import { useTranslation } from 'react-i18next'; // Assuming you use i18n

// Mock t function if not using i18next, or replace with your actual translation hook
const t_mock = (key: string, options?: any) => {
  const translations: Record<string, string> = {
    "student.courses.selectCourses": "Select your courses for this elective pack.",
    "student.courses.selectionProgress": "Selection Progress",
    "student.courses.selectedOutOf": "You have selected",
    "student.courses.of": "of",
    "student.courses.allowedCourses": "allowed courses.",
    "student.courses.maxSelections": "You have reached the maximum number of selections.",
    "student.courses.canSelectMore": "You can select",
    "student.courses.moreCourse": "more course.",
    "student.courses.moreCourses": "more courses.",
    "student.statement.title": "Statement Form",
    "student.statement.description": "Download the statement, sign it, and upload the completed form (PDF only).",
    "student.statement.download": "Download",
    "student.statement.uploading": "Uploading...",
    "student.statement.fileUploaded": "File uploaded:",
    "student.statement.error.templateMissingTitle": "Template Missing",
    "student.statement.error.templateMissingDescription": "The statement template is not available for download.",
    "student.statement.downloadSuccessTitle": "Download Started",
    "student.statement.downloadSuccessDescription": "The statement template is downloading.",
    "student.statement.error.downloadFailedTitle": "Download Failed",
    "student.statement.error.downloadFailedDescription": "Could not download the statement template.",
    "student.statement.error.invalidFileTypeTitle": "Invalid File Type",
    "student.statement.error.invalidFileTypeDescription": "Please upload a PDF file.",
    "student.statement.uploadSuccessTitle": "Statement Uploaded",
    "student.statement.uploadSuccessDescription": `File "{{fileName}}" uploaded successfully.`,
    "student.statement.error.uploadFailedTitle": "Upload Failed",
    "student.statement.error.uploadFailedDescription": "Could not upload the statement.",
    "student.courses.statusAlert.pending.title": "Selection Submitted",
    "student.courses.statusAlert.pending.description":
      "Your course selection is pending approval. You can still modify your selection until it's approved or the deadline passes.",
    "student.courses.statusAlert.approved.title": "Selection Approved!",
    "student.courses.statusAlert.approved.description":
      "Your course selection has been approved. No further changes can be made.",
    "student.courses.statusAlert.rejected.title": "Selection Needs Revision",
    "student.courses.statusAlert.rejected.description":
      "Your course selection needs revision. Please review the comments and update your selection.",
    "student.courses.statusAlert.draft.title": "Draft Selection",
    "student.courses.statusAlert.draft.description":
      "Your course selection is currently a draft. Don't forget to submit it before the deadline.",
    "student.courses.noCoursesAvailable": "No courses are currently available for this elective pack or your group.",
    "student.courses.loading": "Loading courses...",
    "student.courses.error": "Failed to load course data. Please try again.",
    "student.courses.saveSelection": "Save Selection",
    "student.courses.submitSelection": "Submit Selection",
    "student.courses.saving": "Saving...",
    "student.courses.submitting": "Submitting...",
    "student.courses.selectionSaved": "Selection saved successfully!",
    "student.courses.selectionSubmitted": "Selection submitted for approval!",
    "student.courses.errorSaving": "Failed to save selection.",
    "student.courses.errorSubmitting": "Failed to submit selection.",
    "student.courses.confirmLeave": "You have unsaved changes. Are you sure you want to leave?",
    "student.courses.maxCapacityReached": "Max capacity reached",
  }
  let translation = translations[key] || key
  if (options && typeof options === "object") {
    Object.keys(options).forEach((optionKey) => {
      translation = translation.replace(`{{${optionKey}}}`, options[optionKey])
    })
  }
  return translation
}

// interface ElectivePageProps {
//   params: {
//     packId: string
//   }
// }

// export default function ElectivePage({ params }: ElectivePageProps) {
export default function ElectivePackPage() {
  const params = useParams()
  const packId = params.packId as string
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()
  const { toast } = useToast()
  const t = t_mock // Replace with actual useTranslation hook if available

  const [electiveData, setElectiveData] = useState<ElectiveCourse | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [existingSelection, setExistingSelection] = useState<CourseSelection | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Statement-related state
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [persistedStatementFileName, setPersistedStatementFileName] = useState<string | null>(null)
  const [newlySelectedFileForUpload, setNewlySelectedFileForUpload] = useState<File | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push("/auth/login") // Redirect if not logged in
        return
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      if (profileError || !profileData) {
        setError(t("student.courses.error") + (profileError?.message || ""))
        setIsLoading(false)
        return
      }
      setProfile(profileData)

      // Fetch elective pack data
      const { data: pack, error: packError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .single()

      if (packError || !pack) {
        setError(t("student.courses.error") + (packError?.message || ""))
        setIsLoading(false)
        return
      }
      setElectiveData(pack)

      // Fetch existing selection
      const { data: selection, error: selectionError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("student_id", session.user.id)
        .eq("elective_course_id", packId)
        .single()

      if (selection) {
        setExistingSelection(selection)
        setSelectedCourses(selection.selected_course_ids || [])
      }
      if (selectionError && selectionError.code !== "PGRST116") {
        // Ignore 'single row not found'
        setError(t("student.courses.error") + (selectionError?.message || ""))
      }

      // Fetch courses for the pack, filtered by student's group if applicable
      const query = supabase.from("courses").select("*").eq("elective_course_id", packId)
      if (pack.group_id && profileData.group_id && pack.group_id !== profileData.group_id) {
        // This pack is for a specific group, and student is not in it or in a different one.
        // This logic might be too simple, depends on how group_id on elective_courses is used.
        // For now, if pack.group_id is set, we assume courses are also implicitly filtered or this check is sufficient.
        // The prompt mentioned filtering elective_courses by group_id on the listing page.
        // Here, we assume courses under this packId are relevant if the student can see the pack.
        // If courses themselves have group_id, that would be a more direct filter.
      } else if (profileData.group_id) {
        // If courses have a group_id field and should be filtered:
        // query = query.eq('group_id', profileData.group_id);
        // For now, assuming courses under packId are generally available or filtered by pack's group_id access.
      }

      const { data: courseData, error: courseError } = await query

      if (courseError) {
        setError(t("student.courses.error") + (courseError?.message || ""))
      } else {
        setCourses(courseData || [])
      }
      setIsLoading(false)
    }
    fetchData()
  }, [packId, supabase, router])

  useEffect(() => {
    if (existingSelection?.statement_url) {
      try {
        const urlPath = new URL(existingSelection.statement_url).pathname
        const segments = urlPath.split("/")
        const fileName = decodeURIComponent(segments[segments.length - 1])
        setPersistedStatementFileName(fileName)
        setNewlySelectedFileForUpload(null)
      } catch (e) {
        console.error("Failed to parse statement URL:", e)
        setPersistedStatementFileName("File uploaded")
      }
    } else {
      setPersistedStatementFileName(null)
    }
  }, [existingSelection?.statement_url])

  const handleDownloadStatement = async () => {
    if (!electiveData?.syllabus_template_url) {
      toast({
        title: t("student.statement.error.templateMissingTitle"),
        description: t("student.statement.error.templateMissingDescription"),
        variant: "destructive",
      })
      return
    }

    setDownloadingStatement(true)
    try {
      window.open(electiveData.syllabus_template_url, "_blank")
      toast({
        title: t("student.statement.downloadSuccessTitle"),
        description: t("student.statement.downloadSuccessDescription"),
      })
    } catch (error) {
      console.error("Error downloading statement:", error)
      toast({
        title: t("student.statement.error.downloadFailedTitle"),
        description: (error as Error).message || t("student.statement.error.downloadFailedDescription"),
        variant: "destructive",
      })
    } finally {
      setDownloadingStatement(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: t("student.statement.error.invalidFileTypeTitle"),
        description: t("student.statement.error.invalidFileTypeDescription"),
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    if (!profile?.id) {
      toast({ title: "Error", description: "User profile not loaded.", variant: "destructive" })
      e.target.value = ""
      return
    }
    if (!existingSelection?.id) {
      // A selection record must exist to attach the statement
      toast({
        title: "Error",
        description: "Please save your course selection before uploading a statement.",
        variant: "destructive",
      })
      e.target.value = ""
      return
    }

    setIsUploading(true)
    setNewlySelectedFileForUpload(file)

    try {
      const filePath = `student_statements/${profile.id}/${packId}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage.from("student-statements").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from("student-statements").getPublicUrl(filePath)

      if (!publicUrlData?.publicUrl) {
        throw new Error("Failed to get public URL for the uploaded statement.")
      }

      const { error: dbError } = await supabase
        .from("course_selections")
        .update({ statement_url: publicUrlData.publicUrl })
        .eq("id", existingSelection.id)

      if (dbError) throw dbError

      setExistingSelection((prev) => (prev ? { ...prev, statement_url: publicUrlData.publicUrl } : null))
      // The useEffect for persistedStatementFileName will update the display via existingSelection update.
      setNewlySelectedFileForUpload(null)

      toast({
        title: t("student.statement.uploadSuccessTitle"),
        description: t("student.statement.uploadSuccessDescription", { fileName: file.name }),
      })
    } catch (error) {
      console.error("Error uploading statement:", error)
      toast({
        title: t("student.statement.error.uploadFailedTitle"),
        description: (error as Error).message || t("student.statement.error.uploadFailedDescription"),
        variant: "destructive",
      })
      setNewlySelectedFileForUpload(null)
      // Restore persisted file name if it was cleared optimistically by newlySelectedFileForUpload
      if (existingSelection?.statement_url && !newlySelectedFileForUpload) {
        try {
          const urlPath = new URL(existingSelection.statement_url).pathname
          const segments = urlPath.split("/")
          setPersistedStatementFileName(decodeURIComponent(segments[segments.length - 1]))
        } catch (err) {
          /* already handled */
        }
      } else if (!existingSelection?.statement_url) {
        setPersistedStatementFileName(null)
      }
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  // Placeholder for getStatusAlert, assuming it's defined elsewhere or similar to below
  const getStatusAlert = () => {
    if (!existingSelection || !existingSelection.status) return null
    switch (existingSelection.status) {
      case SelectionStatus.PENDING:
        return (
          <Alert
            variant="default"
            className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700"
          >
            <Info className="h-4 w-4 !text-yellow-600 dark:!text-yellow-400" />
            <AlertTitle>{t("student.courses.statusAlert.pending.title")}</AlertTitle>
            <AlertDescription>{t("student.courses.statusAlert.pending.description")}</AlertDescription>
          </Alert>
        )
      case SelectionStatus.APPROVED:
        return (
          <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700">
            <Check className="h-4 w-4 !text-green-600 dark:!text-green-400" />
            <AlertTitle>{t("student.courses.statusAlert.approved.title")}</AlertTitle>
            <AlertDescription>{t("student.courses.statusAlert.approved.description")}</AlertDescription>
          </Alert>
        )
      case SelectionStatus.REJECTED:
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("student.courses.statusAlert.rejected.title")}</AlertTitle>
            <AlertDescription>{t("student.courses.statusAlert.rejected.description")}</AlertDescription>
          </Alert>
        )
      default: // DRAFT or other
        return (
          <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700">
            <Info className="h-4 w-4 !text-blue-600 dark:!text-blue-400" />
            <AlertTitle>{t("student.courses.statusAlert.draft.title")}</AlertTitle>
            <AlertDescription>{t("student.courses.statusAlert.draft.description")}</AlertDescription>
          </Alert>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" /> <span className="ml-2">{t("student.courses.loading")}</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("student.courses.error")}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!electiveData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("student.courses.error")}</AlertTitle>
        <AlertDescription>Elective pack not found.</AlertDescription>
      </Alert>
    )
  }

  const selectionProgress =
    electiveData.max_selections > 0 ? (selectedCourses.length / electiveData.max_selections) * 100 : 0

  // Mock DashboardLayout if not available
  const MockDashboardLayout = ({ children }: { children: React.ReactNode; userRole: UserRole }) => (
    <div className="p-4 md:p-8 mx-auto max-w-4xl">{children}</div>
  )
  const DashboardLayout = MockDashboardLayout // Replace with actual import if available

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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{electiveData.name}</h1>
            <p className="text-sm text-muted-foreground">{t("student.courses.selectIndividualCourses")}</p>
          </div>
        </div>

        {getStatusAlert()}

        <Card
          className={
            existingSelection
              ? existingSelection.status === SelectionStatus.APPROVED
                ? "border-green-200 dark:border-green-800"
                : existingSelection.status === SelectionStatus.PENDING || existingSelection.status === SelectionStatus.REJECTED
                ? "border-yellow-200 dark:border-yellow-800"
                : ""
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
              className={`h-3 ${
                existingSelection?.status === SelectionStatus.APPROVED
                  ? "bg-green-100 dark:bg-green-950 [&>*]:bg-green-600"
                  : existingSelection?.status === SelectionStatus.PENDING || existingSelection?.status === SelectionStatus.REJECTED
                    ? "bg-yellow-100 dark:bg-yellow-950 [&>*]:bg-yellow-500"
                    : "[&>*]:bg-primary"
              }`}
            />
            {(electiveData.max_selections || 0) > 0 && (
              <p className="mt-2.5 text-sm text-muted-foreground">
                {selectedCourses.length === electiveData.max_selections
                  ? t("student.courses.maxSelections")
                  : `${t("student.courses.canSelectMore")} ${electiveData.max_selections - selectedCourses.length} ${electiveData.max_selections - selectedCourses.length === 1 ? t("student.courses.moreCourse") : t("student.courses.moreCourses")}`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Statement Download and Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t("student.statement.title")}
            </CardTitle>
            <CardDescription>{t("student.statement.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto" // Adjusted width
                  onClick={handleDownloadStatement}
                  disabled={downloadingStatement || electiveData.status === "draft" || !electiveData.syllabus_template_url}
                >
                  {downloadingStatement ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  <span>{t("student.statement.download")}</span>
                </Button>

                <div className="relative w-full">
                  <Input
                    id="statement-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={
                      isUploading ||
                      !existingSelection?.id || // Disable if no selection record exists
                      existingSelection?.status === SelectionStatus.APPROVED ||
                      electiveData.status === "draft"
                    }
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                   {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>{t("student.statement.uploading")}</span>
                    </div>
                  )}
                </div>
              </div>
              {(newlySelectedFileForUpload || persistedStatementFileName) && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md text-sm">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>
                    {t("student.statement.fileUploaded")}{" "}
                    <span className="font-medium break-all">
                      {newlySelectedFileForUpload ? newlySelectedFileForUpload.name : persistedStatementFileName}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course List and selection logic would go here - This part is not in the scope of current request */}
        {/* ... */}
         <div className="mt-6 flex gap-2">
            <Button 
                onClick={() => {/* handleSaveSelection logic */}} 
                disabled={isSaving || isSubmitting || existingSelection?.status === SelectionStatus.APPROVED}
            >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("student.courses.saveSelection")}
            </Button>
            <Button 
                onClick={() => {/* handleSubmitSelection logic */}}
                disabled={isSaving || isSubmitting || selectedCourses.length === 0 || selectedCourses.length > electiveData.max_selections || !persistedStatementFileName && !newlySelectedFileForUpload && electiveData.is_statement_required || existingSelection?.status === SelectionStatus.APPROVED}
                variant="default"
            >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {t("student.courses.submitSelection")}
            </Button>
        </div>

        {/* {individualCourses.length > 0 ? (
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
                {selectedCourses.length > 0 ? (
                  <ul className="space-y-1 list-disc list-inside pl-1">
                    {courses.filter(course => selectedCourses.includes(course.id)).map((course) => (
                      <li key={course.id} className="text-sm">
                        {course.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t("student.courses.noCoursesSelectedYet")}</p>
                )}
              </div>
              {electiveData.is_statement_required && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">{t("student.statement.title")}:</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>
                      {newlySelectedFileForUpload
                        ? t("student.statement.fileReadyToSubmit", {
                            fileName: newlySelectedFileForUpload.name,
                            fileSize: Math.round(newlySelectedFileForUpload.size / 1024),
                          })
                        : t("student.statement.previouslyUploadedWillBeUsed")}
                    </span>
                  </div>
                </div>
              )}
              {/* <div className="space-y-2 pt-4 border-t mt-4">
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
              </div> */}
            </div>
            {/* <ShadDialogFooter>
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
            </ShadDialogFooter> */}
          {/* </DialogContent>
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
        </Dialog> */}
      </div>
  </DashboardLayout>
  )
}
