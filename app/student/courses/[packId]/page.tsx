"use client"

import type React from "react"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { uploadStatement } from "@/lib/file-utils"

interface ElectivePageProps {
  params: {
    packId: string
  }
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
      //   .from('student_selections')
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

// Update the component to use the new handleFileUpload function
export default function ElectivePage({ params }: ElectivePageProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<any>(null)
  const [uploadedStatement, setUploadedStatement] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)

  // Mock user ID - in a real app, you would get this from authentication
  const userId = "mock-user-id"

  // Mock elective data
  const electiveData = {
    id: params.packId,
    name:
      params.packId === "fall-2023"
        ? "Fall 2023"
        : params.packId === "spring-2024"
          ? "Spring 2024"
          : params.packId === "fall-2024"
            ? "Fall 2024"
            : "Spring 2025",
    semester: params.packId.includes("fall") ? "Fall" : "Spring",
    year: params.packId.includes("2023") ? 2023 : params.packId.includes("2024") ? 2024 : 2025,
    maxSelections: params.packId === "spring-2024" ? 3 : 2,
    status: params.packId === "spring-2025" ? "draft" : "published",
    startDate: params.packId.includes("fall") ? "2023-08-01" : "2024-01-10",
    endDate: params.packId.includes("fall") ? "2023-08-15" : "2024-01-25",
  }

  // Mock elective courses data - adjust current students for draft status
  const electiveCourses = [
    {
      id: "1",
      name: "Business Ethics",
      description:
        "Explore ethical principles and moral challenges in business decision-making. This course examines the ethical dimensions of corporate behavior and the responsibilities of businesses to stakeholders. Students will analyze case studies of ethical dilemmas in various business contexts and develop frameworks for ethical decision-making. Topics include corporate social responsibility, whistleblowing, environmental ethics, and global business ethics.",
      maxStudents: 30,
      currentStudents: electiveData.status === "draft" ? 0 : 18,
      teacher: "Dr. Anna Ivanova",
    },
    {
      id: "2",
      name: "Digital Marketing",
      description:
        "Learn modern digital marketing strategies and tools for business growth. This comprehensive course covers social media marketing, search engine optimization, content marketing, email campaigns, and analytics. Students will develop practical skills in creating and implementing digital marketing plans, measuring campaign effectiveness, and optimizing online presence. The course includes hands-on projects with real-world applications and current industry tools.",
      maxStudents: 25,
      currentStudents: electiveData.status === "draft" ? 0 : 25,
      teacher: "Prof. Mikhail Petrov",
    },
    {
      id: "3",
      name: "Sustainable Business",
      description:
        "Study sustainable business practices and their impact on the environment and society. This course explores how businesses can integrate sustainability into their operations, strategy, and culture. Students will learn about circular economy principles, sustainable supply chain management, green marketing, and ESG (Environmental, Social, and Governance) reporting. Case studies of leading sustainable businesses will be analyzed to identify best practices and innovation opportunities.",
      maxStudents: 35,
      currentStudents: electiveData.status === "draft" ? 0 : 12,
      teacher: "Dr. Elena Smirnova",
    },
    {
      id: "4",
      name: "Project Management",
      description:
        "Master the principles and methodologies of effective project management. This course covers the entire project lifecycle from initiation to closure, including planning, scheduling, budgeting, risk management, and stakeholder communication. Students will learn both traditional and agile project management approaches, with emphasis on practical applications. The course includes team-based project simulations and preparation for professional certifications like PMP and CAPM.",
      maxStudents: 30,
      currentStudents: electiveData.status === "draft" ? 0 : 28,
      teacher: "Prof. Sergei Kuznetsov",
    },
    {
      id: "5",
      name: "International Business Law",
      description:
        "Understand legal frameworks governing international business operations. This course examines the legal aspects of conducting business across borders, including international contracts, dispute resolution, intellectual property protection, and trade regulations. Students will analyze the legal implications of global business strategies and learn how to navigate complex regulatory environments. Special attention is given to emerging legal issues in international e-commerce and digital business.",
      maxStudents: 25,
      currentStudents: electiveData.status === "draft" ? 0 : 15,
      teacher: "Dr. Olga Volkova",
    },
    {
      id: "6",
      name: "Financial Markets",
      description:
        "Analyze financial markets, instruments, and investment strategies. This course provides a comprehensive overview of equity markets, fixed income securities, derivatives, and alternative investments. Students will develop skills in portfolio construction, risk assessment, and financial analysis. The course combines theoretical frameworks with practical applications, including market simulations and case studies of investment decisions. Current trends in fintech and sustainable finance are also explored.",
      maxStudents: 30,
      currentStudents: electiveData.status === "draft" ? 0 : 22,
      teacher: "Prof. Dmitry Sokolov",
    },
  ]

  // Mock student selection data
  const existingSelection =
    params.packId === "fall-2023"
      ? {
          packId: params.packId,
          selectedCourseIds: ["1", "3"],
          status: SelectionStatus.APPROVED,
          authorizedBy: "Alex Johnson",
          createdAt: "2023-08-05",
        }
      : params.packId === "spring-2024"
        ? {
            packId: params.packId,
            selectedCourseIds: ["5"],
            status: SelectionStatus.PENDING,
            authorizedBy: "Alex Johnson",
            createdAt: "2024-01-12",
          }
        : null

  // State for selected courses
  const [selectedCourses, setSelectedCourses] = useState<string[]>(
    existingSelection ? existingSelection.selectedCourseIds : [],
  )

  // Handle course selection
  const toggleCourseSelection = (courseId: string) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId))
    } else {
      if (selectedCourses.length < electiveData.maxSelections) {
        setSelectedCourses([...selectedCourses, courseId])
      }
    }
  }

  // Handle submission
  const handleSubmit = () => {
    setSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false)
      setConfirmDialogOpen(false)
      toast({
        title: "Selection submitted",
        description: "Your course selection has been submitted successfully.",
      })
      // In a real app, you would redirect or show success message
      window.location.href = "/student/courses"
    }, 1500)
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  // Calculate selection progress
  const selectionProgress = (selectedCourses.length / electiveData.maxSelections) * 100

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
    } else if (electiveData.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.comingSoon")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.comingSoonDesc")} {formatDate(electiveData.startDate)}.
          </AlertDescription>
        </Alert>
      )
    } else {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.courses.selectionPeriodActive")}</AlertTitle>
          <AlertDescription>
            {t("student.courses.selectionPeriodDesc")} {electiveData.maxSelections} {t("student.courses.until")}{" "}
            {formatDate(electiveData.endDate)}.
          </AlertDescription>
        </Alert>
      )
    }
  }

  // Get card style based on selection status
  const getCardStyle = (courseId: string) => {
    const isSelected = selectedCourses.includes(courseId)
    const isFull =
      electiveCourses.find((c) => c.id === courseId)?.currentStudents >=
      electiveCourses.find((c) => c.id === courseId)?.maxStudents
    const isDisabled = !isSelected && (selectedCourses.length >= electiveData.maxSelections || isFull)

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

  // Handle file upload

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
            <h1 className="text-3xl font-bold tracking-tight">{electiveData.name}</h1>
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
              {electiveData.maxSelections} {t("student.courses.allowedCourses")}
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
              {selectedCourses.length === electiveData.maxSelections
                ? t("student.courses.maxSelections")
                : `${t("student.courses.canSelectMore")} ${electiveData.maxSelections - selectedCourses.length} ${
                    electiveData.maxSelections - selectedCourses.length === 1
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
                    onChange={(e) =>
                      handleFileUpload(e, userId, params.packId, setIsUploading, setUploadedStatement, toast)
                    }
                    disabled={
                      isUploading ||
                      existingSelection?.status === SelectionStatus.APPROVED ||
                      electiveData.status === "draft"
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
                    {t("student.statement.fileUploaded")} <span className="font-medium">{uploadedStatement.name}</span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {electiveCourses.map((course) => {
            const isSelected = selectedCourses.includes(course.id)
            const isFull = course.currentStudents >= course.maxStudents
            const isDisabled = !isSelected && (selectedCourses.length >= electiveData.maxSelections || isFull)
            const isApproved = existingSelection?.status === SelectionStatus.APPROVED

            return (
              <Card key={course.id} className={`h-full transition-all ${getCardStyle(course.id)}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                    <Badge variant={isFull ? "destructive" : "secondary"} className="ml-2">
                      <Users className="h-3 w-3 mr-1" />
                      {course.currentStudents}/{course.maxStudents}
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

        {existingSelection?.status !== SelectionStatus.APPROVED && (
          <div className="flex justify-end">
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={
                    selectedCourses.length === 0 ||
                    selectedCourses.length > electiveData.maxSelections ||
                    electiveData.status === "draft" ||
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
                  {existingSelection ? t("student.courses.updateSelection") : t("student.courses.confirmSelection")}
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
                        const course = electiveCourses.find((c) => c.id === courseId)
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
              {!existingSelection?.status === SelectionStatus.APPROVED && electiveData.status !== "draft" && (
                <Button
                  onClick={() => {
                    toggleCourseSelection(viewingCourse.id)
                    setViewingCourse(null)
                  }}
                  disabled={
                    !viewingCourse ||
                    (!selectedCourses.includes(viewingCourse.id) &&
                      selectedCourses.length >= electiveData.maxSelections)
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
