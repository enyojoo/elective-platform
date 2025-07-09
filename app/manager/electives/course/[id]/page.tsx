"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Edit,
  Eye,
  MoreVertical,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileDown,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  getCourseProgram,
  getCourseProgramCourses,
  getCourseSelections,
  getCourseEnrollmentCounts,
  downloadStatementFile,
} from "@/actions/course-program-details"

interface ElectiveCourseDetailPageProps {
  params: {
    id: string
  }
}

export default function ElectiveCourseDetailPage({ params }: ElectiveCourseDetailPageProps) {
  const [electiveCourse, setElectiveCourse] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [studentSelections, setStudentSelections] = useState<any[]>([])
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get translation function
  const { t, language } = useLanguage()
  const { toast } = useToast()

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        console.log("Loading course program data for ID:", params.id)

        // Get course program details
        const programData = await getCourseProgram(params.id)
        setElectiveCourse(programData)

        // Get courses if available
        if (programData.courses && programData.courses.length > 0) {
          const coursesData = await getCourseProgramCourses(programData.courses)
          setCourses(coursesData)

          // Get enrollment counts
          const counts = await getCourseEnrollmentCounts(programData.courses, params.id)
          setEnrollmentCounts(counts)
        }

        // Get student selections
        const selectionsData = await getCourseSelections(params.id)
        setStudentSelections(selectionsData)

        console.log("Data loaded successfully")
      } catch (err) {
        console.error("Error loading data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
        toast({
          title: "Error",
          description: "Failed to load course program data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, toast])

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">{t("manager.status.draft")}</Badge>
      case "published":
        return <Badge variant="secondary">{t("manager.status.published")}</Badge>
      case "closed":
        return <Badge variant="destructive">{t("manager.status.closed")}</Badge>
      case "archived":
        return <Badge variant="default">{t("manager.status.archived")}</Badge>
      default:
        return null
    }
  }

  // Helper function to get selection status badge
  const getSelectionStatusBadge = (status: SelectionStatus) => {
    switch (status) {
      case SelectionStatus.APPROVED:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.approved")}
          </Badge>
        )
      case SelectionStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.pending")}
          </Badge>
        )
      case SelectionStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.rejected")}
          </Badge>
        )
      default:
        return null
    }
  }

  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Function to open dialog with student details
  const openStudentDialog = (student: any) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  // Function to download student statement
  const downloadStudentStatement = async (studentName: string, statementUrl: string | null) => {
    if (!statementUrl) {
      toast({
        title: t("toast.statement.notAvailable"),
        description: t("toast.statement.notAvailable.description").replace("{0}", studentName),
      })
      return
    }

    try {
      const url = await downloadStatementFile(statementUrl)
      // Create a temporary link to download the file
      const link = document.createElement("a")
      link.href = url
      link.download = `${studentName.replace(/\s+/g, "_")}_statement.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t("toast.statement.download.success"),
        description: t("toast.statement.download.success.description"),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download statement",
        variant: "destructive",
      })
    }
  }

  // Function to export all student selections to CSV
  const exportAllSelectionsToCSV = () => {
    if (!studentSelections.length) {
      toast({
        title: "No Data",
        description: "No student selections to export",
        variant: "destructive",
      })
      return
    }

    // Create CSV header with translated column names
    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "ID студента" : "Student ID"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Выбранные курсы" : "Selected Courses"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}","${language === "ru" ? "Заявление" : "Statement"}"\n`

    // Create CSV content with translated status
    const allSelectionsContent = studentSelections
      .map((selection) => {
        const student = selection.profiles
        const group = student?.student_profiles?.[0]?.groups
        const program = group?.programs

        // Get course names for selected course IDs
        const selectedCourseNames =
          selection.selected_courses
            ?.map((courseId: string) => {
              const course = courses.find((c) => c.id === courseId)
              return course ? course.name : courseId
            })
            .join("; ") || ""

        // Translate status based on current language
        const translatedStatus =
          language === "ru"
            ? selection.status === "approved"
              ? "Утверждено"
              : selection.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : selection.status

        const statementLink = selection.statement_url || (language === "ru" ? "Не загружено" : "Not uploaded")

        return `"${student?.full_name || ""}","${selection.student_id}","${group?.display_name || ""}","${program?.name || ""}","${student?.email || ""}","${selectedCourseNames}","${formatDate(selection.created_at)}","${translatedStatus}","${statementLink}"`
      })
      .join("\n")

    // Combine header and content
    const csv = csvHeader + allSelectionsContent

    // Create a blob and download
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${electiveCourse?.name?.replace(/\s+/g, "_") || "course_program"}_${language === "ru" ? "все_выборы" : "all_selections"}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to export course enrollments to CSV
  const exportCourseEnrollmentsToCSV = (courseName: string, courseId: string) => {
    // Find students who selected this course
    const studentsInCourse = studentSelections.filter((selection) => selection.selected_courses?.includes(courseId))

    if (!studentsInCourse.length) {
      toast({
        title: "No Data",
        description: `No students enrolled in ${courseName}`,
        variant: "destructive",
      })
      return
    }

    // Create CSV header with translated column names
    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "ID студента" : "Student ID"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}"\n`

    // Create CSV content with translated status
    const courseContent = studentsInCourse
      .map((selection) => {
        const student = selection.profiles
        const group = student?.student_profiles?.[0]?.groups
        const program = group?.programs

        // Translate status based on current language
        const translatedStatus =
          language === "ru"
            ? selection.status === "approved"
              ? "Утверждено"
              : selection.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : selection.status

        return `"${student?.full_name || ""}","${selection.student_id}","${group?.display_name || ""}","${program?.name || ""}","${student?.email || ""}","${formatDate(selection.created_at)}","${translatedStatus}"`
      })
      .join("\n")

    // Combine header and content
    const csv = csvHeader + courseContent

    // Create a blob and download
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${courseName.replace(/\s+/g, "_")}_${language === "ru" ? "зачисления" : "enrollments"}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Clean up function to ensure dialogs are properly closed
  useEffect(() => {
    return () => {
      setDialogOpen(false)
    }
  }, [])

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives?tab=courses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="h-8 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="h-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-96 bg-gray-200 animate-pulse rounded" />
        </div>
      </DashboardLayout>
    )
  }

  if (error || !electiveCourse) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives?tab=courses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Course Program Not Found</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{error || "The requested course program could not be found."}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives?tab=courses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === "ru" && electiveCourse.name_ru ? electiveCourse.name_ru : electiveCourse.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(electiveCourse.status)}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/manager/electives/course/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t("manager.courseDetails.edit")}
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("manager.courseDetails.programDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.deadline")}:</dt>
                <dd>{electiveCourse.deadline ? formatDate(electiveCourse.deadline) : "Not set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.maxSelections")}:</dt>
                <dd>
                  {electiveCourse.max_selections} {t("manager.courseDetails.courses")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.courses")}:</dt>
                <dd>{courses.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.studentsEnrolled")}:</dt>
                <dd>{studentSelections.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.created")}:</dt>
                <dd>{formatDate(electiveCourse.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.status")}:</dt>
                <dd>{t(`manager.status.${electiveCourse.status.toLowerCase()}`)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses">{t("manager.courseDetails.coursesTab")}</TabsTrigger>
            <TabsTrigger value="students">{t("manager.courseDetails.studentsTab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>{t("manager.courseDetails.coursesInProgram")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No courses available</p>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.name")}</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.courseDetails.professor")}
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.courseDetails.enrollment")}
                          </th>
                          <th className="py-3 px-4 text-center text-sm font-medium">
                            {t("manager.courseDetails.export")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((course) => {
                          const currentEnrollment = enrollmentCounts[course.id] || 0
                          return (
                            <tr key={course.id} className="border-b">
                              <td className="py-3 px-4 text-sm">
                                {language === "ru" && course.name_ru ? course.name_ru : course.name}
                              </td>
                              <td className="py-3 px-4 text-sm">{course.professor || "TBA"}</td>
                              <td className="py-3 px-4 text-sm">
                                <Badge variant={currentEnrollment >= course.max_students ? "destructive" : "secondary"}>
                                  {currentEnrollment}/{course.max_students}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => exportCourseEnrollmentsToCSV(course.name, course.id)}
                                  className="flex items-center gap-1 mx-auto"
                                >
                                  <FileDown className="h-4 w-4" />
                                  {t("manager.courseDetails.download")}
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("manager.courseDetails.studentSelections")}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder={t("manager.courseDetails.searchStudents")}
                      className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[200px]"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={exportAllSelectionsToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("manager.courseDetails.exportAll")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {studentSelections.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No student selections yet</p>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.name")}</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.courseDetails.group")}
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.courseDetails.selectionDate")}
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.courseDetails.status")}
                          </th>
                          <th className="py-3 px-4 text-center text-sm font-medium">{t("statement")}</th>
                          <th className="py-3 px-4 text-center text-sm font-medium">
                            {t("manager.courseDetails.view")}
                          </th>
                          <th className="py-3 px-4 text-center text-sm font-medium">
                            {t("manager.courseDetails.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSelections.map((selection) => {
                          const student = selection.profiles
                          const group = student?.student_profiles?.[0]?.groups

                          return (
                            <tr key={selection.id} className="border-b">
                              <td className="py-3 px-4 text-sm">{student?.full_name || "Unknown"}</td>
                              <td className="py-3 px-4 text-sm">{group?.display_name || "Unknown"}</td>
                              <td className="py-3 px-4 text-sm">{formatDate(selection.created_at)}</td>
                              <td className="py-3 px-4 text-sm">{getSelectionStatusBadge(selection.status)}</td>
                              <td className="py-3 px-4 text-sm text-center">
                                {selection.statement_url ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      downloadStudentStatement(student?.full_name || "student", selection.statement_url)
                                    }
                                  >
                                    <FileDown className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-center">
                                <Button variant="ghost" size="icon" onClick={() => openStudentDialog(selection)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                              <td className="py-3 px-4 text-sm text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {selection.status === "pending" && (
                                      <>
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() => {
                                            toast({
                                              title: t("toast.selection.approved"),
                                              description: t("toast.selection.approved.description").replace(
                                                "{0}",
                                                student?.full_name || "student",
                                              ),
                                            })
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.approve")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => {
                                            toast({
                                              title: t("toast.selection.rejected"),
                                              description: t("toast.selection.rejected.description").replace(
                                                "{0}",
                                                student?.full_name || "student",
                                              ),
                                            })
                                          }}
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.reject")}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {selection.status === "approved" && (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          toast({
                                            title: t("toast.selection.withdrawn"),
                                            description: t("toast.selection.withdrawn.description").replace(
                                              "{0}",
                                              student?.full_name || "student",
                                            ),
                                          })
                                        }}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {t("manager.courseDetails.withdraw")}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Student Details Dialog */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setTimeout(() => {
                setSelectedStudent(null)
              }, 300)
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            {selectedStudent && (
              <>
                <DialogHeader>
                  <DialogTitle>{t("manager.courseDetails.studentDetails")}</DialogTitle>
                  <DialogDescription>
                    {t("manager.courseDetails.viewDetailsFor")} {selectedStudent.profiles?.full_name}
                    {t("manager.courseDetails.courseSelection")}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.studentInformation")}</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.name")}:</span>
                          <span>{selectedStudent.profiles?.full_name || "Unknown"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.id")}:</span>
                          <span>{selectedStudent.student_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.email")}:</span>
                          <span>{selectedStudent.profiles?.email || "Unknown"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.group")}:</span>
                          <span>
                            {selectedStudent.profiles?.student_profiles?.[0]?.groups?.display_name || "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.program")}:</span>
                          <span>
                            {selectedStudent.profiles?.student_profiles?.[0]?.groups?.programs?.name || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.selectedCourses")}</h3>
                      <div className="mt-2 space-y-2">
                        {selectedStudent.selected_courses?.map((courseId: string, index: number) => {
                          const course = courses.find((c) => c.id === courseId)
                          return (
                            <div key={index} className="rounded-md border p-2">
                              <p className="font-medium">
                                {course
                                  ? language === "ru" && course.name_ru
                                    ? course.name_ru
                                    : course.name
                                  : courseId}
                              </p>
                            </div>
                          )
                        }) || <p className="text-muted-foreground">No courses selected</p>}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.selectionInformation")}</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.date")}:</span>
                          <span>{formatDate(selectedStudent.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.status")}:</span>
                          <span>{getSelectionStatusBadge(selectedStudent.status)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Statement File Section */}
                    <div>
                      <h3 className="text-sm font-medium">{t("statementFile")}</h3>
                      <div className="mt-2">
                        {selectedStudent.statement_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center gap-2 bg-transparent"
                            onClick={() =>
                              downloadStudentStatement(
                                selectedStudent.profiles?.full_name || "student",
                                selectedStudent.statement_url,
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                            {t("downloadStatement")}
                          </Button>
                        ) : (
                          <p className="text-sm text-muted-foreground">No statement file uploaded yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  {selectedStudent.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="mr-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() => {
                          toast({
                            title: t("toast.selection.approved"),
                            description: t("toast.selection.approved.description").replace(
                              "{0}",
                              selectedStudent.profiles?.full_name || "student",
                            ),
                          })
                          setDialogOpen(false)
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {t("manager.exchangeDetails.approve")}
                      </Button>
                      <Button
                        variant="outline"
                        className="mr-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                        onClick={() => {
                          toast({
                            title: t("toast.selection.rejected"),
                            description: t("toast.selection.rejected.description").replace(
                              "{0}",
                              selectedStudent.profiles?.full_name || "student",
                            ),
                          })
                          setDialogOpen(false)
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {t("manager.exchangeDetails.reject")}
                      </Button>
                    </>
                  )}
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      {t("manager.courseDetails.close")}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Toaster />
    </DashboardLayout>
  )
}
