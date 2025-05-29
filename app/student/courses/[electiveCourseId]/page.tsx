"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Calendar, FileText, Check, X, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { useLanguage } from "@/lib/language-context"
import { useCachedElectiveCourseDetails } from "@/hooks/use-cached-student-selections"
import { selectElectiveCourse, uploadStatement } from "@/app/actions/student-selections"
import { useToast } from "@/hooks/use-toast"
import { DocumentUpload } from "@/components/document-upload"

export default function ElectiveCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const electiveCourseId = params.electiveCourseId as string
  const [studentId, setStudentId] = useState<string>()
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const { electiveCourse, studentSelection, isLoading, error, refreshData } = useCachedElectiveCourseDetails(
    electiveCourseId,
    studentId,
  )

  // Fetch authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/student/login")
          return
        }
        setStudentId(user.id)
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Failed to authenticate user",
          variant: "destructive",
        })
      } finally {
        setIsLoadingAuth(false)
      }
    }
    fetchUser()
  }, [supabase, router, toast])

  // Initialize selected courses from existing selection
  useEffect(() => {
    if (studentSelection?.courses) {
      setSelectedCourses(studentSelection.courses)
    }
  }, [studentSelection])

  const handleCourseToggle = (courseCode: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseCode)) {
        return prev.filter((c) => c !== courseCode)
      }
      // Check if we've reached the max selections
      if (electiveCourse && prev.length >= electiveCourse.max_selections) {
        toast({
          title: "Selection Limit",
          description: `You can only select up to ${electiveCourse.max_selections} courses`,
          variant: "destructive",
        })
        return prev
      }
      return [...prev, courseCode]
    })
  }

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one course",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const formData = new FormData()
    formData.append("electiveCourseId", electiveCourseId)
    selectedCourses.forEach((course) => formData.append("selectedCourses", course))

    const result = await selectElectiveCourse(formData)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Your selection has been saved",
      })
      refreshData()

      // Show upload section if syllabus template requires a statement
      if (electiveCourse?.syllabus_template_url) {
        setShowUpload(true)
      }
    }
    setIsSubmitting(false)
  }

  const handleStatementUpload = async (file: File) => {
    const formData = new FormData()
    formData.append("electiveCourseId", electiveCourseId)
    formData.append("statement", file)

    const result = await uploadStatement(formData)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      return false
    }

    toast({
      title: "Success",
      description: "Your statement has been uploaded",
    })
    refreshData()
    setShowUpload(false)
    return true
  }

  if (isLoadingAuth || isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !electiveCourse) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Elective course not found"}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/student/courses")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
      </div>
    )
  }

  const isDeadlinePassed = new Date(electiveCourse.deadline) < new Date()
  const canEdit = !isDeadlinePassed && (!studentSelection || studentSelection.status === "pending")
  const courses = electiveCourse.courses || []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <Check className="mr-1 h-3 w-3" />
            {t("approved")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive">
            <X className="mr-1 h-3 w-3" />
            {t("rejected")}
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            {t("pending")}
          </Badge>
        )
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => router.push("/student/courses")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("back")}
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">
                {language === "ru" && electiveCourse.name_ru ? electiveCourse.name_ru : electiveCourse.name}
              </CardTitle>
              <CardDescription className="mt-2">
                {language === "ru" && electiveCourse.description_ru
                  ? electiveCourse.description_ru
                  : electiveCourse.description}
              </CardDescription>
            </div>
            {studentSelection && getStatusBadge(studentSelection.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {t("deadline")}: {format(new Date(electiveCourse.deadline), "PPP")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {t("maxSelections")}: {selectedCourses.length} / {electiveCourse.max_selections}
              </span>
            </div>
          </div>

          {electiveCourse.syllabus_template_url && (
            <Alert className="mb-6">
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <a
                  href={electiveCourse.syllabus_template_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  {t("downloadSyllabusTemplate")}
                </a>
                {" - "}
                {t("statementRequired")}
              </AlertDescription>
            </Alert>
          )}

          {isDeadlinePassed && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t("deadlinePassed")}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("availableCourses")}</CardTitle>
          <CardDescription>
            {t("selectUpTo")} {electiveCourse.max_selections} {t("courses")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("noCoursesAvailable")}</p>
            ) : (
              courses.map((courseCode: string) => (
                <div
                  key={courseCode}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={courseCode}
                    checked={selectedCourses.includes(courseCode)}
                    onCheckedChange={() => handleCourseToggle(courseCode)}
                    disabled={!canEdit}
                  />
                  <Label htmlFor={courseCode} className="flex-1 cursor-pointer font-medium">
                    {courseCode}
                  </Label>
                </div>
              ))
            )}
          </div>

          {canEdit && courses.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={isSubmitting || selectedCourses.length === 0}>
                {isSubmitting ? t("saving") : t("saveSelection")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statement Upload Section */}
      {(showUpload ||
        (studentSelection && !studentSelection.statement_url && electiveCourse.syllabus_template_url)) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("uploadStatement")}</CardTitle>
            <CardDescription>{t("uploadStatementDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload
              onUpload={handleStatementUpload}
              acceptedFormats={[".pdf", ".doc", ".docx"]}
              maxSize={10 * 1024 * 1024} // 10MB
              label={t("selectStatementFile")}
            />
          </CardContent>
        </Card>
      )}

      {/* Display uploaded statement */}
      {studentSelection?.statement_url && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("uploadedStatement")}</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={studentSelection.statement_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <FileText className="h-4 w-4" />
              {t("viewStatement")}
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
