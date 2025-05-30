"use client"

import { useEffect, useState, useTransition, useActionState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, AlertCircle, CheckCircle2, FileText, Loader2, ExternalLink } from "lucide-react"
import { submitCourseSelection, uploadStatementForm, type ActionResponse } from "./actions"
import Link from "next/link"

interface ElectiveCourse {
  id: string
  name: string
  description: string | null
  credits: number | null
  semester: string | null
  department: string | null
  max_students: number | null
  current_students: number | null
  // Add other relevant fields
}

interface ElectivePack {
  id: string
  name: string
  description: string | null
  course_limit: number
  deadline: string | null
  // Add other relevant fields
}

interface Profile {
  id: string
  full_name: string | null
  group_id: string | null // Assuming group_id is on profile
  // Add other relevant fields
}

interface CourseSelection {
  id: string
  selected_course_ids: string[]
  status: "draft" | "submitted" | "approved" | "rejected"
  statement_form_url: string | null
  statement_form_filename: string | null
  statement_form_uploaded_at: string | null
  // Add other relevant fields
}

// Placeholder for statement form template URL - replace with actual URL or fetch from DB
const STATEMENT_FORM_TEMPLATE_URL = "/statement-form-template.pdf"

export default function ElectivePackPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const packId = params.packId as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [electivePack, setElectivePack] = useState<ElectivePack | null>(null)
  const [courses, setCourses] = useState<ElectiveCourse[]>([])
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [currentSelection, setCurrentSelection] = useState<CourseSelection | null>(null)

  const [statementFile, setStatementFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isUploading, startUploadingTransition] = useTransition()
  const [isSubmitting, startSubmittingTransition] = useTransition()

  const [uploadState, uploadAction, isUploadPending] = useActionState(
    async (_prevState: ActionResponse | null, formData: FormData) => {
      if (!packId || !profile?.id || !statementFile) {
        return { success: false, message: "Missing required information for upload." }
      }
      return uploadStatementForm(packId, profile.id, formData)
    },
    null,
  )

  const [submitState, submitAction, isSubmitPending] = useActionState(async (_prevState: ActionResponse | null) => {
    if (!packId || !profile?.id) {
      return { success: false, message: "Missing required information for submission." }
    }
    return submitCourseSelection(packId, profile.id, Array.from(selectedCourses))
  }, null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        setError("You must be logged in to view this page.")
        setIsLoading(false)
        router.push("/login") // Redirect to login if not authenticated
        return
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, group_id")
        .eq("id", user.id)
        .single()

      if (profileError || !profileData) {
        setError("Failed to load student profile. Ensure your profile is set up.")
        setIsLoading(false)
        return
      }
      setProfile(profileData)

      if (!profileData.group_id) {
        setError("You are not assigned to a student group. Please contact administration.")
        // Potentially disable course selection or show a specific message
      }

      // Fetch elective pack details
      const { data: packData, error: packError } = await supabase
        .from("elective_packs")
        .select("*")
        .eq("id", packId)
        .single()

      if (packError || !packData) {
        setError("Failed to load elective pack details.")
        setIsLoading(false)
        return
      }
      setElectivePack(packData)

      // Fetch courses for the pack, filtered by group_id if applicable
      let query = supabase.from("elective_courses").select("*").eq("elective_pack_id", packId)
      if (profileData.group_id) {
        query = query.eq("group_id", profileData.group_id)
      } else {
        // If no group_id, perhaps no courses should be shown or a different logic applies
        // For now, this will fetch courses associated with the pack but not specific to a group if group_id is null
        // You might want to explicitly show no courses if group_id is required for filtering
        setCourses([]) // Or handle as an error/specific message
      }
      const { data: coursesData, error: coursesError } = await query

      if (coursesError) {
        setError("Failed to load courses for this pack.")
        setIsLoading(false)
        return
      }
      setCourses(coursesData || [])

      // Fetch existing course selection
      const { data: selectionData, error: selectionError } = await supabase
        .from("course_selections")
        .select("*")
        .eq("user_id", user.id)
        .eq("elective_pack_id", packId)
        .maybeSingle()

      if (selectionError) {
        setError("Failed to load your current selection.")
      } else if (selectionData) {
        setCurrentSelection(selectionData as CourseSelection)
        setSelectedCourses(new Set(selectionData.selected_course_ids || []))
      }

      setIsLoading(false)
    }
    fetchData()
  }, [packId, supabase, router])

  const handleCourseSelect = (courseId: string, isSelected: boolean) => {
    if (currentSelection?.status === "submitted" || currentSelection?.status === "approved") {
      // Optionally show a toast message
      return
    }
    setSelectedCourses((prev) => {
      const newSelection = new Set(prev)
      if (isSelected) {
        newSelection.add(courseId)
      } else {
        newSelection.delete(courseId)
      }
      return newSelection
    })
  }

  const handleStatementFileUpload = async () => {
    if (!statementFile) {
      // This should ideally be handled by form validation or button disable state
      alert("Please select a file to upload.")
      return
    }
    const formData = new FormData()
    formData.append("statementForm", statementFile)
    uploadAction(formData)
  }

  const handleSubmitSelection = async () => {
    submitAction()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading course selection...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!electivePack || !profile) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Elective pack or profile data could not be loaded.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const isDeadlinePassed = electivePack.deadline && new Date(electivePack.deadline) < new Date()
  const canSubmitOrUpload =
    !isDeadlinePassed && currentSelection?.status !== "submitted" && currentSelection?.status !== "approved"
  const coursesToSelect = electivePack.course_limit
  const selectionComplete = selectedCourses.size === coursesToSelect
  const statementUploaded = !!currentSelection?.statement_form_url

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{electivePack.name}</CardTitle>
          {electivePack.description && <CardDescription>{electivePack.description}</CardDescription>}
          {electivePack.deadline && (
            <CardDescription className={isDeadlinePassed ? "text-red-500 font-semibold" : "text-muted-foreground"}>
              Deadline: {new Date(electivePack.deadline).toLocaleDateString()}{" "}
              {new Date(electivePack.deadline).toLocaleTimeString()}
              {isDeadlinePassed && " (Deadline Passed)"}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Selection Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Selection Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              You have selected {selectedCourses.size} out of {coursesToSelect} required courses.
            </p>
            <Progress value={(selectedCourses.size / coursesToSelect) * 100} className="w-full" />
            {!selectionComplete && (
              <p className="text-sm text-orange-600">
                Please select {coursesToSelect - selectedCourses.size} more course(s).
              </p>
            )}
            {selectionComplete && (
              <p className="text-sm text-green-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-1" /> All required courses selected.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statement Form */}
      <Card>
        <CardHeader>
          <CardTitle>Statement Form</CardTitle>
          <CardDescription>Download the statement, sign it, and upload the completed form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button variant="outline" asChild>
              <a href={STATEMENT_FORM_TEMPLATE_URL} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download Statement Template
              </a>
            </Button>
          </div>

          {currentSelection?.statement_form_url ? (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <FileText className="h-4 w-4 text-green-700" />
              <AlertTitle className="text-green-800">Statement Uploaded</AlertTitle>
              <AlertDescription className="text-green-700">
                File: {currentSelection.statement_form_filename || "Statement Form"}
                <Button variant="link" size="sm" asChild className="ml-2 p-0 h-auto">
                  <Link
                    href={
                      supabase.storage
                        .from("course_selection_documents")
                        .getPublicUrl(currentSelection.statement_form_url).data.publicUrl || "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Uploaded Form <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">No statement form uploaded yet.</p>
          )}

          {canSubmitOrUpload && (
            <div className="space-y-2">
              <Label htmlFor="statementFormFile">Upload Signed Statement</Label>
              <Input
                id="statementFormFile"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.png"
                onChange={(e) => setStatementFile(e.target.files ? e.target.files[0] : null)}
                disabled={isUploadPending || isUploading}
              />
              <Button
                onClick={handleStatementFileUpload}
                disabled={!statementFile || isUploadPending || isUploading || !canSubmitOrUpload}
              >
                {isUploadPending || isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {currentSelection?.statement_form_url ? "Replace Statement" : "Upload Statement"}
              </Button>
            </div>
          )}
          {uploadState && (
            <Alert
              variant={uploadState.success ? "default" : "destructive"}
              className={uploadState.success ? "bg-green-50 border-green-200" : ""}
            >
              {uploadState.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{uploadState.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{uploadState.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Elective Courses</CardTitle>
          {!profile.group_id && (
            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Group Information Missing</AlertTitle>
              <AlertDescription>
                You are not currently assigned to a student group. Course availability may be affected. Please contact
                administration if you believe this is an error.
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {courses.length === 0 && !isLoading ? (
            <p>No elective courses available for your group in this pack, or an error occurred.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => {
                  const isSelected = selectedCourses.has(course.id)
                  const isFull = course.max_students !== null && (course.current_students || 0) >= course.max_students
                  const canSelectCourse = !isFull || isSelected // Can unselect if full but was already selected
                  return (
                    <TableRow key={course.id} className={isSelected ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          id={`course-${course.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleCourseSelect(course.id, !!checked)}
                          disabled={!canSelectCourse || !canSubmitOrUpload}
                          aria-label={`Select ${course.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{course.name}</TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course.department}</TableCell>
                      <TableCell>
                        {course.max_students !== null
                          ? `${course.current_students || 0} / ${course.max_students}`
                          : "N/A"}
                        {isFull && !isSelected && <span className="ml-2 text-xs text-red-500">(Full)</span>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Submission Area */}
      <Card>
        <CardFooter className="flex flex-col items-start gap-4 pt-6">
          {currentSelection?.status === "submitted" && (
            <Alert variant="default" className="bg-blue-50 border-blue-200 w-full">
              <CheckCircle2 className="h-4 w-4 text-blue-700" />
              <AlertTitle className="text-blue-800">Selection Submitted</AlertTitle>
              <AlertDescription className="text-blue-700">
                Your course selection has been submitted and is pending review.
              </AlertDescription>
            </Alert>
          )}
          {currentSelection?.status === "approved" && (
            <Alert variant="default" className="bg-green-50 border-green-200 w-full">
              <CheckCircle2 className="h-4 w-4 text-green-700" />
              <AlertTitle className="text-green-800">Selection Approved</AlertTitle>
              <AlertDescription className="text-green-700">Your course selection has been approved.</AlertDescription>
            </Alert>
          )}
          {currentSelection?.status === "rejected" && (
            <Alert variant="destructive" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Selection Rejected</AlertTitle>
              <AlertDescription>
                Your course selection has been rejected. Please review any feedback and resubmit if applicable.
                {/* You might want to add a field for rejection_reason to display here */}
              </AlertDescription>
            </Alert>
          )}

          {canSubmitOrUpload && (
            <Button
              size="lg"
              onClick={handleSubmitSelection}
              disabled={
                !selectionComplete || !statementUploaded || isSubmitPending || isSubmitting || !canSubmitOrUpload
              }
            >
              {isSubmitPending || isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Selection
            </Button>
          )}

          {submitState && (
            <Alert
              variant={submitState.success ? "default" : "destructive"}
              className={`w-full ${submitState.success ? "bg-green-50 border-green-200" : ""}`}
            >
              {submitState.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{submitState.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{submitState.message}</AlertDescription>
            </Alert>
          )}
          {!canSubmitOrUpload &&
            !isDeadlinePassed &&
            (currentSelection?.status === "submitted" || currentSelection?.status === "approved") && (
              <p className="text-sm text-muted-foreground">
                Your selection is {currentSelection.status} and cannot be modified at this time.
              </p>
            )}
          {isDeadlinePassed && (
            <Alert variant="warning" className="w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Deadline Passed</AlertTitle>
              <AlertDescription>
                The deadline for submitting selections for this pack has passed. You can no longer make changes.
              </AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
