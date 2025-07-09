"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
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
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import {
  getCourseProgram,
  getCoursesFromIds,
  getCourseSelections,
  downloadCourseStatementFile,
  updateCourseSelectionStatus,
  updateStudentCourseSelection,
} from "@/actions/course-program-details"

interface ElectiveCourseDetailPageProps {
  params: {
    id: string
  }
}

interface CourseProgram {
  id: string
  name: string
  name_ru?: string
  description?: string
  status: string
  deadline?: string
  max_selections: number
  courses: string[]
  created_at: string
}

interface Course {
  id: string
  name: string
  name_ru?: string
  description?: string
  credits: number
  max_students?: number
  professor?: string
  semester?: string
  year?: number
}

interface StudentSelection {
  id: string
  student_id: string
  selected_course_ids: string[]
  status: string
  statement_url?: string
  created_at: string
  profiles?: {
    id: string
    full_name: string
    email: string
    group_name?: string
    degree_name?: string
    academic_year?: string
  }
}

export default function ElectiveCourseDetailPage({ params }: ElectiveCourseDetailPageProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const { institution } = useInstitution()

  // State management
  const [courseProgram, setCourseProgram] = useState<CourseProgram | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [studentSelections, setStudentSelections] = useState<StudentSelection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSelections, setIsLoadingSelections] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Dialog states
  const [selectedStudent, setSelectedStudent] = useState<StudentSelection | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState<any>(null)

  // Fetch course program data
  useEffect(() => {
    const fetchCourseProgram = async () => {
      try {
        setIsLoading(true)
        const program = await getCourseProgram(params.id)

        if (program) {
          setCourseProgram(program)

          // Fetch courses if program has course IDs
          if (program.courses && program.courses.length > 0) {
            const coursesData = await getCoursesFromIds(program.courses)
            setCourses(coursesData)
          }
        }
      } catch (error) {
        console.error("Error fetching course program:", error)
        toast({
          title: "Error",
          description: "Failed to fetch course program details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourseProgram()
  }, [params.id, toast])

  // Fetch student selections
  useEffect(() => {
    const fetchSelections = async () => {
      try {
        setIsLoadingSelections(true)
        const selections = await getCourseSelections(params.id)
        setStudentSelections(selections)
      } catch (error) {
        console.error("Error fetching student selections:", error)
        toast({
          title: "Error",
          description: "Failed to fetch student selections",
          variant: "destructive",
        })
      } finally {
        setIsLoadingSelections(false)
      }
    }

    fetchSelections()
  }, [params.id, toast])

  // Get localized name
  const getLocalizedName = (item: { name: string; name_ru?: string }) => {
    if (language === "ru" && item.name_ru) {
      return item.name_ru
    }
    return item.name
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
  const getSelectionStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.approved")}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.pending")}
          </Badge>
        )
      case "rejected":
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

  // Get course enrollment count
  const getCourseEnrollmentCount = (courseId: string) => {
    return studentSelections.filter(
      (selection) =>
        selection.selected_course_ids &&
        Array.isArray(selection.selected_course_ids) &&
        selection.selected_course_ids.includes(courseId),
    ).length
  }

  // Function to open dialog with student details
  const openStudentDialog = (student: StudentSelection) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  // Function to open edit dialog for a student selection
  const openEditDialog = (student: StudentSelection) => {
    setStudentToEdit({
      ...student,
      editedCourses: [...(student.selected_course_ids || [])],
    })
    setEditDialogOpen(true)
  }

  // Function to handle saving edited student selection
  const saveStudentSelection = async () => {
    if (!studentToEdit) return

    try {
      await updateStudentCourseSelection(studentToEdit.id, studentToEdit.editedCourses, studentToEdit.status)

      // Update local state
      setStudentSelections((prev) =>
        prev.map((student) =>
          student.id === studentToEdit.id ? { ...student, selected_course_ids: studentToEdit.editedCourses } : student,
        ),
      )

      setEditDialogOpen(false)
      toast({
        title: t("toast.selection.updated"),
        description: t("toast.selection.updated.course.description").replace(
          "{0}",
          studentToEdit.profiles?.full_name || "",
        ),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student selection",
        variant: "destructive",
      })
    }
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
      await downloadCourseStatementFile(statementUrl)
      toast({
        title: t("toast.statement.download.success"),
        description: t("toast.statement.download.success.description"),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download statement file",
        variant: "destructive",
      })
    }
  }

  // Function to export all student selections to CSV
  const exportAllSelectionsToCSV = () => {
    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "ID студента" : "Student ID"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Выбранные курсы" : "Selected Courses"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}","${language === "ru" ? "Заявление" : "Statement"}"\n`

    const allSelectionsContent = studentSelections
      .map((student) => {
        const translatedStatus =
          language === "ru"
            ? student.status === "approved"
              ? "Утверждено"
              : student.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : student.status

        const selectedCourseNames = (student.selected_course_ids || [])
          .map((courseId) => {
            const course = courses.find((c) => c.id === courseId)
            return course ? getLocalizedName(course) : courseId
          })
          .join("; ")

        const statementLink = student.statement_url
          ? `${window.location.origin}/api/statements/${student.statement_url}`
          : language === "ru"
            ? "Не загружено"
            : "Not uploaded"

        return `"${student.profiles?.full_name || ""}","${student.student_id}","${student.profiles?.group_name || ""}","${student.profiles?.degree_name || ""}","${student.profiles?.email || ""}","${selectedCourseNames}","${formatDate(student.created_at)}","${translatedStatus}","${statementLink}"`
      })
      .join("\n")

    const csv = csvHeader + allSelectionsContent
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${courseProgram?.name.replace(/\s+/g, "_")}_${language === "ru" ? "все_выборы" : "all_selections"}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to export course enrollments to CSV
  const exportCourseEnrollmentsToCSV = (courseId: string, courseName: string) => {
    const studentsInCourse = studentSelections.filter(
      (student) => student.selected_course_ids && student.selected_course_ids.includes(courseId),
    )

    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "ID студента" : "Student ID"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}"\n`

    const courseContent = studentsInCourse
      .map((student) => {
        const translatedStatus =
          language === "ru"
            ? student.status === "approved"
              ? "Утверждено"
              : student.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : student.status

        return `"${student.profiles?.full_name || ""}","${student.student_id}","${student.profiles?.group_name || ""}","${student.profiles?.degree_name || ""}","${student.profiles?.email || ""}","${formatDate(student.created_at)}","${translatedStatus}"`
      })
      .join("\n")

    const csv = csvHeader + courseContent
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

  // Handle status change
  const handleStatusChange = async (selectionId: string, newStatus: "approved" | "rejected") => {
    try {
      await updateCourseSelectionStatus(selectionId, newStatus)

      // Update local state
      setStudentSelections((prev) =>
        prev.map((selection) => (selection.id === selectionId ? { ...selection, status: newStatus } : selection)),
      )

      const student = studentSelections.find((s) => s.id === selectionId)
      const statusText = newStatus === "approved" ? "approved" : "rejected"

      toast({
        title: t(`toast.selection.${statusText}`),
        description: t(`toast.selection.${statusText}.description`).replace("{0}", student?.profiles?.full_name || ""),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} selection`,
        variant: "destructive",
      })
    }
  }

  // Filter students based on search term
  const filteredSelections = studentSelections.filter(
    (selection) =>
      !searchTerm ||
      selection.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      selection.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!courseProgram) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold">Course program not found</h2>
            <p className="text-muted-foreground mt-2">The requested course program could not be found.</p>
            <Link href="/manager/electives/course">
              <Button className="mt-4">Back to Course Programs</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives/course">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{getLocalizedName(courseProgram)}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(courseProgram.status)}
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
                <dd>
                  {courseProgram.deadline ? (
                    formatDate(courseProgram.deadline)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.maxSelections")}:</dt>
                <dd>
                  {courseProgram.max_selections} {t("manager.courseDetails.courses")}
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
                <dd>{formatDate(courseProgram.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.status")}:</dt>
                <dd>{t(`manager.status.${courseProgram.status.toLowerCase()}`)}</dd>
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
                <CardTitle>{t("manager.courseDetails.coursesInProgram")}</CardTitle>
              </CardHeader>
              <CardContent>
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
                        const enrollmentCount = getCourseEnrollmentCount(course.id)
                        const maxStudents = course.max_students || 0

                        return (
                          <tr key={course.id} className="border-b">
                            <td className="py-3 px-4 text-sm">{getLocalizedName(course)}</td>
                            <td className="py-3 px-4 text-sm">{course.professor || "—"}</td>
                            <td className="py-3 px-4 text-sm">
                              <Badge variant={enrollmentCount >= maxStudents ? "destructive" : "secondary"}>
                                {enrollmentCount}/{maxStudents}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportCourseEnrollmentsToCSV(course.id, getLocalizedName(course))}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t("manager.courseDetails.studentSelections")}</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder={t("manager.courseDetails.searchStudents")}
                      className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={exportAllSelectionsToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("manager.courseDetails.exportAll")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSelections ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
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
                        {filteredSelections.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-muted-foreground">
                              No student selections found
                            </td>
                          </tr>
                        ) : (
                          filteredSelections.map((selection) => (
                            <tr key={selection.id} className="border-b">
                              <td className="py-3 px-4 text-sm">{selection.profiles?.full_name || "—"}</td>
                              <td className="py-3 px-4 text-sm">{selection.profiles?.group_name || "—"}</td>
                              <td className="py-3 px-4 text-sm">{formatDate(selection.created_at)}</td>
                              <td className="py-3 px-4 text-sm">{getSelectionStatusBadge(selection.status)}</td>
                              <td className="py-3 px-4 text-sm text-center">
                                {selection.statement_url ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      downloadStudentStatement(
                                        selection.profiles?.full_name || "",
                                        selection.statement_url!,
                                      )
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
                                    <DropdownMenuItem onClick={() => openEditDialog(selection)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      {t("manager.courseDetails.edit")}
                                    </DropdownMenuItem>
                                    {selection.status === "pending" && (
                                      <>
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() => handleStatusChange(selection.id, "approved")}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.approve")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleStatusChange(selection.id, "rejected")}
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.reject")}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {selection.status === "approved" && (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleStatusChange(selection.id, "rejected")}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {t("manager.courseDetails.withdraw")}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        )}
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
                          <span>{selectedStudent.profiles?.full_name || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.email")}:</span>
                          <span>{selectedStudent.profiles?.email || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.group")}:</span>
                          <span>{selectedStudent.profiles?.group_name || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.program")}:</span>
                          <span>{selectedStudent.profiles?.degree_name || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.year")}:</span>
                          <span>{selectedStudent.profiles?.academic_year || "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.selectedCourses")}</h3>
                      <div className="mt-2 space-y-2">
                        {(selectedStudent.selected_course_ids || []).map((courseId) => {
                          const course = courses.find((c) => c.id === courseId)
                          return (
                            <div key={courseId} className="rounded-md border p-2">
                              <p className="font-medium">{course ? getLocalizedName(course) : courseId}</p>
                              {course?.professor && <p className="text-sm text-muted-foreground">{course.professor}</p>}
                            </div>
                          )
                        })}
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

                    {selectedStudent.statement_url && (
                      <div>
                        <h3 className="text-sm font-medium">{t("statementFile")}</h3>
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center gap-2 bg-transparent"
                            onClick={() =>
                              downloadStudentStatement(
                                selectedStudent.profiles?.full_name || "",
                                selectedStudent.statement_url!,
                              )
                            }
                          >
                            <Download className="h-4 w-4" />
                            {t("downloadStatement")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  {selectedStudent.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="mr-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() => {
                          handleStatusChange(selectedStudent.id, "approved")
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
                          handleStatusChange(selectedStudent.id, "rejected")
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

        {/* Student Selection Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setTimeout(() => {
                setStudentToEdit(null)
              }, 300)
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            {studentToEdit && (
              <>
                <DialogHeader>
                  <DialogTitle>{t("manager.courseDetails.editStudentSelection")}</DialogTitle>
                  <DialogDescription>
                    {t("manager.courseDetails.editSelectionFor")} {studentToEdit.profiles?.full_name}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.studentInformation")}</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.name")}:</span>
                          <span>{studentToEdit.profiles?.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.group")}:</span>
                          <span>{studentToEdit.profiles?.group_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.program")}:</span>
                          <span>{studentToEdit.profiles?.degree_name}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.editCourses")}</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-2">
                        {t("manager.courseDetails.selectUpTo")} {courseProgram.max_selections}{" "}
                        {t("manager.courseDetails.courses")}
                      </p>
                      <div className="mt-2 space-y-2">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`course-${course.id}`}
                              checked={studentToEdit.editedCourses.includes(course.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (studentToEdit.editedCourses.length < courseProgram.max_selections) {
                                    setStudentToEdit({
                                      ...studentToEdit,
                                      editedCourses: [...studentToEdit.editedCourses, course.id],
                                    })
                                  }
                                } else {
                                  setStudentToEdit({
                                    ...studentToEdit,
                                    editedCourses: studentToEdit.editedCourses.filter((id: string) => id !== course.id),
                                  })
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 accent-primary focus:ring-primary"
                              disabled={
                                !studentToEdit.editedCourses.includes(course.id) &&
                                studentToEdit.editedCourses.length >= courseProgram.max_selections
                              }
                            />
                            <label htmlFor={`course-${course.id}`} className="text-sm font-medium">
                              {getLocalizedName(course)}
                              {course.professor && (
                                <span className="text-xs text-muted-foreground ml-1">({course.professor})</span>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                      {t("manager.courseDetails.cancel")}
                    </Button>
                  </DialogClose>
                  <Button onClick={saveStudentSelection} disabled={studentToEdit.editedCourses.length === 0}>
                    {t("manager.courseDetails.saveChanges")}
                  </Button>
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
