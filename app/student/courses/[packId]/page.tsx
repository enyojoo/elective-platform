"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState } from "react"
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
import { ArrowLeft, CheckCircle, Clock, Info, Users, BookOpen } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

interface ElectivePageProps {
  params: {
    packId: string
  }
}

export default function ElectivePage({ params }: ElectivePageProps) {
  const { t } = useLanguage()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingCourse, setViewingCourse] = useState<any>(null)

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
      credits: 3,
      maxStudents: 30,
      currentStudents: electiveData.status === "draft" ? 0 : 18,
      teacher: "Dr. Anna Ivanova",
    },
    {
      id: "2",
      name: "Digital Marketing",
      description:
        "Learn modern digital marketing strategies and tools for business growth. This comprehensive course covers social media marketing, search engine optimization, content marketing, email campaigns, and analytics. Students will develop practical skills in creating and implementing digital marketing plans, measuring campaign effectiveness, and optimizing online presence. The course includes hands-on projects with real-world applications and current industry tools.",
      credits: 4,
      maxStudents: 25,
      currentStudents: electiveData.status === "draft" ? 0 : 25,
      teacher: "Prof. Mikhail Petrov",
    },
    {
      id: "3",
      name: "Sustainable Business",
      description:
        "Study sustainable business practices and their impact on the environment and society. This course explores how businesses can integrate sustainability into their operations, strategy, and culture. Students will learn about circular economy principles, sustainable supply chain management, green marketing, and ESG (Environmental, Social, and Governance) reporting. Case studies of leading sustainable businesses will be analyzed to identify best practices and innovation opportunities.",
      credits: 3,
      maxStudents: 35,
      currentStudents: electiveData.status === "draft" ? 0 : 12,
      teacher: "Dr. Elena Smirnova",
    },
    {
      id: "4",
      name: "Project Management",
      description:
        "Master the principles and methodologies of effective project management. This course covers the entire project lifecycle from initiation to closure, including planning, scheduling, budgeting, risk management, and stakeholder communication. Students will learn both traditional and agile project management approaches, with emphasis on practical applications. The course includes team-based project simulations and preparation for professional certifications like PMP and CAPM.",
      credits: 4,
      maxStudents: 30,
      currentStudents: electiveData.status === "draft" ? 0 : 28,
      teacher: "Prof. Sergei Kuznetsov",
    },
    {
      id: "5",
      name: "International Business Law",
      description:
        "Understand legal frameworks governing international business operations. This course examines the legal aspects of conducting business across borders, including international contracts, dispute resolution, intellectual property protection, and trade regulations. Students will analyze the legal implications of global business strategies and learn how to navigate complex regulatory environments. Special attention is given to emerging legal issues in international e-commerce and digital business.",
      credits: 3,
      maxStudents: 25,
      currentStudents: electiveData.status === "draft" ? 0 : 15,
      teacher: "Dr. Olga Volkova",
    },
    {
      id: "6",
      name: "Financial Markets",
      description:
        "Analyze financial markets, instruments, and investment strategies. This course provides a comprehensive overview of equity markets, fixed income securities, derivatives, and alternative investments. Students will develop skills in portfolio construction, risk assessment, and financial analysis. The course combines theoretical frameworks with practical applications, including market simulations and case studies of investment decisions. Current trends in fintech and sustainable finance are also explored.",
      credits: 4,
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
      // In a real app, you would redirect or show success message
      window.location.href = "/student/electives"
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
          <AlertTitle>{t("Selection Approved")}</AlertTitle>
          <AlertDescription>
            {t(
              "Your selection for these elective courses has been approved. You can view your selected courses below.",
            )}
          </AlertDescription>
        </Alert>
      )
    } else if (existingSelection && existingSelection.status === SelectionStatus.PENDING) {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("Selection Pending")}</AlertTitle>
          <AlertDescription>
            {t(
              "Your selection for these elective courses is pending approval. You can still modify your selection until the deadline.",
            )}
          </AlertDescription>
        </Alert>
      )
    } else if (electiveData.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("Coming Soon")}</AlertTitle>
          <AlertDescription>
            {t(
              "Elective selection is not open yet. You can preview the available courses, but selection will be available starting",
            )}{" "}
            {formatDate(electiveData.startDate)}.
          </AlertDescription>
        </Alert>
      )
    } else {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("Selection Period Active")}</AlertTitle>
          <AlertDescription>
            {t("You can select up to")} {electiveData.maxSelections} {t("courses until")}{" "}
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
              <p className="text-sm text-muted-foreground">{t("Select your elective courses for this semester")}</p>
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
            <CardTitle>{t("Selection Progress")}</CardTitle>
            <CardDescription>
              {t("You have selected")} {selectedCourses.length} {t("out of")} {electiveData.maxSelections}{" "}
              {t("allowed courses")}
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
                ? t("You've reached the maximum number of selections")
                : `${t("You can select")} ${electiveData.maxSelections - selectedCourses.length} ${t("more course")}${
                    electiveData.maxSelections - selectedCourses.length !== 1 ? "s" : ""
                  }`}
            </p>
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
                    {t("View Description")}
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
                        {isSelected ? t("Selected") : t("Select")}
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
                    electiveData.status === "draft"
                  }
                  className="px-8"
                >
                  {existingSelection ? t("Update Selection") : t("Confirm Selection")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("Confirm Your Selection")}</DialogTitle>
                  <DialogDescription>
                    {t("Please review your selection and enter your full name to authorize this submission.")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("Selected Courses")}:</h4>
                    <ul className="space-y-2">
                      {selectedCourses.map((courseId) => {
                        const course = electiveCourses.find((c) => c.id === courseId)
                        return (
                          <li key={courseId} className="text-sm flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            {course?.name} ({course?.credits} {t("credits")})
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-name">
                      {t("Your Full Name")} ({t("to authorize")})
                    </Label>
                    <Input
                      id="student-name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder={t("Enter your full name")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={!studentName.trim() || submitting}>
                    {submitting ? t("Submitting...") : t("Submit Selection")}
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
                <h4 className="text-sm font-medium">{t("Course Description")}</h4>
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
                    {t("Selected")}
                  </Badge>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingCourse(null)}>
                {t("Close")}
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
                  {selectedCourses.includes(viewingCourse?.id) ? t("Remove Selection") : t("Select Course")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
