"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import type { Database } from "@/lib/database.types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Download, AlertCircle, CheckCircle, Info } from "lucide-react"
import { submitStudentCourseSelectionAction, getPublicUrlForPath } from "@/app/actions/student-actions"
import Link from "next/link"

type ElectivePack = Database["public"]["Tables"]["elective_courses"]["Row"]
type Course = Database["public"]["Tables"]["courses"]["Row"]
type CourseSelection = Database["public"]["Tables"]["course_selections"]["Row"]

interface CourseSelectionClientProps {
  electivePack: ElectivePack & { syllabus_template_public_url: string | null }
  courses: Course[]
  initialSelection: (CourseSelection & { statement_public_url: string | null }) | null
  userId: string
}

export function CourseSelectionClient({ electivePack, courses, initialSelection, userId }: CourseSelectionClientProps) {
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set(initialSelection?.selected_course_ids || []),
  )
  const [statementFileToUpload, setStatementFileToUpload] = useState<File | null>(null)
  const [currentStatementUrlPath, setCurrentStatementUrlPath] = useState<string | null>(
    initialSelection?.statement_url || null,
  )
  const [currentStatementPublicUrl, setCurrentStatementPublicUrl] = useState<string | null>(
    initialSelection?.statement_public_url || null,
  )

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const expectedCourseLimit = electivePack.expected_course_limit || 0

  useEffect(() => {
    // If initial selection changes (e.g. after submit), update local state for statement URL
    if (initialSelection?.statement_url !== currentStatementUrlPath) {
      setCurrentStatementUrlPath(initialSelection?.statement_url || null)
      setCurrentStatementPublicUrl(initialSelection?.statement_public_url || null)
    }
    if (initialSelection?.selected_course_ids) {
      setSelectedCourses(new Set(initialSelection.selected_course_ids))
    }
  }, [initialSelection])

  const handleCourseSelect = (courseId: string, isSelected: boolean) => {
    setSelectedCourses((prev) => {
      const newSelected = new Set(prev)
      if (isSelected) {
        if (newSelected.size < expectedCourseLimit) {
          newSelected.add(courseId)
        }
      } else {
        newSelected.delete(courseId)
      }
      return newSelected
    })
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setStatementFileToUpload(event.target.files[0])
      setSuccessMessage(null) // Clear previous success message
      setError(null) // Clear previous error
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    if (selectedCourses.size !== expectedCourseLimit) {
      setError(`Please select exactly ${expectedCourseLimit} courses.`)
      setIsSubmitting(false)
      return
    }

    if (!statementFileToUpload && !currentStatementUrlPath) {
      setError("Please upload the signed statement form.")
      setIsSubmitting(false)
      return
    }

    const formData = new FormData()
    formData.append("userId", userId)
    formData.append("packId", electivePack.id)
    formData.append("selectedCourseIds", JSON.stringify(Array.from(selectedCourses)))
    if (initialSelection?.id) {
      formData.append("selectionId", initialSelection.id)
    }
    if (statementFileToUpload) {
      formData.append("statementFile", statementFileToUpload)
    } else if (currentStatementUrlPath) {
      formData.append("existingStatementUrl", currentStatementUrlPath)
    }

    const result = await submitStudentCourseSelectionAction(formData)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setSuccessMessage("Selection submitted successfully!")
      if (result.data.statement_url) {
        setCurrentStatementUrlPath(result.data.statement_url)
        // Fetch and set the new public URL
        getPublicUrlForPath(result.data.statement_url).then((url) => setCurrentStatementPublicUrl(url))
      }
      setStatementFileToUpload(null)
      // Update initialSelection if needed, or rely on page revalidation
      // For example, if status changes, it should be reflected.
      // The page will re-fetch data due to revalidatePath.
    }
    setIsSubmitting(false)
  }

  const selectionProgress = expectedCourseLimit > 0 ? (selectedCourses.size / expectedCourseLimit) * 100 : 0

  const isSelectionDisabled = initialSelection?.status === "approved"

  const canSubmit = useMemo(() => {
    if (isSelectionDisabled) return false
    return selectedCourses.size === expectedCourseLimit && (!!statementFileToUpload || !!currentStatementUrlPath)
  }, [selectedCourses.size, expectedCourseLimit, statementFileToUpload, currentStatementUrlPath, isSelectionDisabled])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Course Selection: {electivePack.name}</CardTitle>
          <CardDescription>{electivePack.description || "Select your elective courses for this pack."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Selection Progress</Label>
            <div className="flex items-center gap-2">
              <Progress value={selectionProgress} className="w-full" />
              <span>
                {selectedCourses.size} / {expectedCourseLimit}
              </span>
            </div>
            {selectedCourses.size !== expectedCourseLimit && !isSelectionDisabled && (
              <p className="text-sm text-muted-foreground mt-1">
                You must select exactly {expectedCourseLimit} courses.
              </p>
            )}
          </div>

          {isSelectionDisabled && (
            <Alert variant="default">
              <Info className="h-4 w-4" />
              <AlertTitle>Selection Approved</AlertTitle>
              <AlertDescription>Your course selection has been approved and cannot be changed.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statement Form</CardTitle>
          <CardDescription>Download the statement template, sign it, and upload the completed form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {electivePack.syllabus_template_public_url && (
            <div>
              <Button variant="outline" asChild>
                <Link href={electivePack.syllabus_template_public_url} target="_blank" download>
                  <Download className="mr-2 h-4 w-4" /> Download Statement Template
                </Link>
              </Button>
            </div>
          )}
          {!electivePack.syllabus_template_public_url && (
            <p className="text-sm text-muted-foreground">Statement template not available for this pack.</p>
          )}

          {!isSelectionDisabled && (
            <div className="space-y-2">
              <Label htmlFor="statement-upload">Upload Signed Statement</Label>
              <Input
                id="statement-upload"
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg"
                onChange={handleFileChange}
                disabled={isSubmitting || isSelectionDisabled}
              />
              {statementFileToUpload && (
                <p className="text-sm text-muted-foreground">Selected file: {statementFileToUpload.name}</p>
              )}
            </div>
          )}

          {currentStatementPublicUrl && (
            <div>
              <p className="text-sm font-medium">Current Uploaded Statement:</p>
              <Link href={currentStatementPublicUrl} target="_blank" className="text-sm text-blue-600 hover:underline">
                View Uploaded Statement
              </Link>
            </div>
          )}
          {!currentStatementPublicUrl && !statementFileToUpload && (
            <p className="text-sm text-muted-foreground">No statement uploaded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Courses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses.length === 0 && <p>No courses available for this pack.</p>}
          {courses.map((course) => {
            const isSelected = selectedCourses.has(course.id)
            const isFull = course.max_students !== null && (course.current_students || 0) >= course.max_students
            const isDisabledByLimit = !isSelected && selectedCourses.size >= expectedCourseLimit
            const finalDisabled = isFull || isDisabledByLimit || isSubmitting || isSelectionDisabled

            return (
              <div
                key={course.id}
                className={`flex items-center space-x-3 p-3 border rounded-md ${
                  finalDisabled && !isSelected ? "bg-muted/50 opacity-70" : ""
                } ${isSelected ? "border-primary" : ""}`}
              >
                <Checkbox
                  id={`course-${course.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleCourseSelect(course.id, !!checked)}
                  disabled={finalDisabled}
                  aria-label={`Select course ${course.name}`}
                />
                <div className="flex-1">
                  <Label htmlFor={`course-${course.id}`} className="font-medium cursor-pointer">
                    {course.name} ({course.course_code})
                  </Label>
                  <p className="text-sm text-muted-foreground">{course.description || "No description available."}</p>
                  <p className="text-xs text-muted-foreground">
                    ECTS: {course.ects_credits || "N/A"} | Seats: {course.current_students || 0} /{" "}
                    {course.max_students || "Unlimited"}
                    {isFull && <span className="text-red-500 font-semibold ml-2"> (Full)</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert variant="default" className="bg-green-50 border-green-300 text-green-700">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-700">Success</AlertTitle>
          <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
        </Alert>
      )}

      {!isSelectionDisabled && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} size="lg">
            {isSubmitting ? "Submitting..." : "Submit Selection"}
          </Button>
        </div>
      )}
    </div>
  )
}
