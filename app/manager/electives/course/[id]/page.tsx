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
import {
  getCourseProgram,
  getCoursesFromIds,
  getCourseSelections,
  getCourseSelectionData,
  updateCourseSelectionStatus,
  updateStudentCourseSelection,
} from "@/actions/course-program-details"

interface ElectiveCourseDetailPageProps {
  params: {
    id: string
  }
}

interface ElectiveCourse {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  deadline: string
  max_selections: number
  status: string
  courses: string[]
  created_at: string
  updated_at: string
}

interface Course {
  id: string
  name: string
  name_ru: string | null
  code: string
  description: string | null
  description_ru: string | null
  credits: number
  max_students: number
  status: string
}

interface StudentSelection {
  id: string
  selected_ids: string[]
  status: string
  created_at: string
  student_id: string
  profiles: {
    id: string
    full_name: string | null
    email: string
    student_profiles: {
      group_id: string
      enrollment_year: string
      groups: {
        name: string
        display_name: string
        programs: {
          name: string
          name_ru: string | null
          degrees: {
            name: string
            name_ru: string | null
          }
        }
      }
    }[]
  } | null
}

export default function ElectiveCourseDetailPage({ params }: ElectiveCourseDetailPageProps) {
  const [electiveCourse, setElectiveCourse] = useState<ElectiveCourse | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [studentSelections, setStudentSelections] = useState<StudentSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<StudentSelection | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState<any>(null)

  const { t, language } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading course program with ID:", params.id)

      // Load course program
      const program = await getCourseProgram(params.id)
      console.log("Course program loaded:", program)
      setElectiveCourse(program)

      // Load courses from the courses column
      if (program?.courses && Array.isArray(program.courses) && program.courses.length > 0) {
        console.log("Loading courses with IDs:", program.courses)
        const coursesData = await getCoursesFromIds(program.courses)
        console.log("Courses loaded:", coursesData)
        setCourses(coursesData)
      } else {
        console.log("No courses found in program or courses is not an array:", program?.courses)
        setCourses([])
      }

      // Load student selections
      console.log("Loading student selections for course program ID:", params.id)
      const selections = await getCourseSelections(params.id)
      console.log("Student selections loaded:", selections)
      setStudentSelections(selections)
    } catch (error) {
      console.error("Error loading data:", error)
      setError(error instanceof Error ? error.message : "Failed to load course program data")
      toast({
        title: "Error",
        description: "Failed to load course program data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate enrollment count for each course (pending + approved)
  const getCourseEnrollment = (courseId: string) => {
    const count = studentSelections.filter(
      (selection) =>
        selection.selected_ids &&
        selection.selected_ids.includes(courseId) &&
        (selection.status === "approved" || selection.status === "pending"),
    ).length
    console.log(`Course ${courseId} enrollment:`, count)
    return count
  }

  // Get total students enrolled (both pending and approved)
  const getTotalStudentsEnrolled = () => {
    const count = studentSelections.filter(
      (selection) => selection.status === "approved" || selection.status === "pending",
    ).length
    console.log("Total students enrolled:", count)
    return count
  }

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
        return <Badge variant="outline">{status}</Badge>
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
        return <Badge variant="outline">{status}</Badge>
    }
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
      editedCourses: [...(student.selected_ids || [])],
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
        prev.map((selection) =>
          selection.id === studentToEdit.id ? { ...selection, selected_ids: studentToEdit.editedCourses } : selection,
        ),
      )

      setEditDialogOpen(false)
      setStudentToEdit(null)

      toast({
        title: t("toast.selection.updated"),
        description: t("toast.selection.updated.course.description").replace(
          "{0}",
          studentToEdit.profiles?.full_name || "Student",
        ),
      })
    } catch (error) {
      console.error("Error updating selection:", error)
      toast({
        title: "Error",
        description: "Failed to update selection",
        variant: "destructive",
      })
    }
  }

  // Function to handle approve/reject actions
  const handleStatusChange = async (selectionId: string, newStatus: "approved" | "rejected", studentName: string) => {
    try {
      await updateCourseSelectionStatus(selectionId, newStatus)

      // Update local state
      setStudentSelections((prev) =>
        prev.map((selection) => (selection.id === selectionId ? { ...selection, status: newStatus } : selection)),
      )

      toast({
        title: `Selection ${newStatus}`,
        description: `Selection ${newStatus} for ${studentName}`,
      })
    } catch (error) {
      console.error(`Error ${newStatus} selection:`, error)
      toast({
        title: "Error",
        description: `Failed to ${newStatus} selection`,
        variant: "destructive",
      })
    }
  }

  // Function to export course enrollments to CSV
  const exportCourseEnrollmentsToCSV = async (course: Course) => {
    try {
      const selectionData = await getCourseSelectionData(course.id, params.id)

      // Define column headers based on language
      const headers = {
        en: ["Student Name", "Email", "Group", "Program", "Status", "Selection Date"],
        ru: ["Имя студента", "Электронная почта", "Группа", "Программа", "Статус", "Дата выбора"],
      }

      // Create CSV content
      let csvContent = headers[language as keyof typeof headers].map((header) => `"${header}"`).join(",") + "\n"

      // Add data rows
      selectionData.forEach((selection) => {
        const translatedStatus =
          language === "ru"
            ? selection.status === "approved"
              ? "Утверждено"
              : selection.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : selection.status

        const groupName = selection.profiles?.student_profiles?.[0]?.groups?.display_name || "N/A"
        const programName = selection.profiles?.student_profiles?.[0]?.groups?.programs?.name || "N/A"

        const row = [
          `"${selection.profiles?.full_name || "N/A"}"`,
          `"${selection.profiles?.email || "N/A"}"`,
          `"${groupName}"`,
          `"${programName}"`,
          `"${translatedStatus}"`,
          `"${formatDate(selection.created_at)}"`,
        ]

        csvContent += row.join(",") + "\n"
      })

      // Create and download the file
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const fileName = `course_${course.name.replace(/\s+/g, "_")}_enrollments_${language}.csv`

      link.setAttribute("href", url)
      link.setAttribute("download", fileName)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: `Course enrollment data exported successfully`,
      })
    } catch (error) {
      console.error("Error exporting course data:", error)
      toast({
        title: "Error",
        description: "Failed to export course data",
        variant: "destructive",
      })
    }
  }

  // Function to export all student selections to CSV
  const exportAllSelectionsToCSV = () => {
    // Create CSV header with translated column names
    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "ID студента" : "Student ID"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Выбранные курсы" : "Selected Courses"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}"\n`

    // Create CSV content with translated status
    const allSelectionsContent = studentSelections
      .map((student) => {
        // Translate status based on current language
        const translatedStatus =
          language === "ru"
            ? student.status === "approved"
              ? "Утверждено"
              : student.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : student.status

        // Get selected course names
        const selectedCourseNames = (student.selected_ids || [])
          .map((courseId) => {
            const course = courses.find((c) => c.id === courseId)
            return course ? (language === "ru" && course.name_ru ? course.name_ru : course.name) : "Unknown Course"
          })
          .join("; ")

        const groupName = student.profiles?.student_profiles?.[0]?.groups?.display_name || "N/A"
        const programName = student.profiles?.student_profiles?.[0]?.groups?.programs?.name || "N/A"

        return `"${student.profiles?.full_name || "N/A"}","${student.student_id}","${groupName}","${programName}","${student.profiles?.email || "N/A"}","${selectedCourseNames}","${formatDate(student.created_at)}","${translatedStatus}"`
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
      `${electiveCourse?.name.replace(/\s+/g, "_")}_${language === "ru" ? "все_выборы" : "all_selections"}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter students based on search term
  const filteredStudentSelections = studentSelections.filter((selection) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      selection.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      selection.profiles?.email?.toLowerCase().includes(searchLower) ||
      selection.student_id?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Error Loading Data</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button onClick={loadData} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!electiveCourse) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Course program not found</h1>
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
                <dd>{electiveCourse.deadline ? formatDate(electiveCourse.deadline) : "No deadline set"}</dd>
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
                <dd>{getTotalStudentsEnrolled()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.created")}:</dt>
                <dd>{formatDate(electiveCourse.created_at)}</dd>
              </div>
              {electiveCourse.description && (
                <div className="flex flex-col gap-1">
                  <dt className="font-medium">Description:</dt>
                  <dd className="text-sm text-muted-foreground">
                    {language === "ru" && electiveCourse.description_ru
                      ? electiveCourse.description_ru
                      : electiveCourse.description}
                  </dd>
                </div>
              )}
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
                  <div className="text-center py-8 text-muted-foreground">No courses configured for this program</div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.name")}</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Code</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Credits</th>
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
                          const currentEnrollment = getCourseEnrollment(course.id)
                          return (
                            <tr key={course.id} className="border-b">
                              <td className="py-3 px-4 text-sm">
                                {language === "ru" && course.name_ru ? course.name_ru : course.name}
                              </td>
                              <td className="py-3 px-4 text-sm">{course.code}</td>
                              <td className="py-3 px-4 text-sm">{course.credits}</td>
                              <td className="py-3 px-4 text-sm">
                                <Badge variant={currentEnrollment >= course.max_students ? "destructive" : "secondary"}>
                                  {currentEnrollment}/{course.max_students}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-sm text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => exportCourseEnrollmentsToCSV(course)}
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
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.name")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.group")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Program</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.courseDetails.selectionDate")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.status")}</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">{t("manager.courseDetails.view")}</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">
                          {t("manager.courseDetails.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentSelections.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            {searchTerm ? "No students found matching your search" : "No student selections yet"}
                          </td>
                        </tr>
                      ) : (
                        filteredStudentSelections.map((selection) => {
                          const groupName = selection.profiles?.student_profiles?.[0]?.groups?.display_name || "N/A"
                          const programName = selection.profiles?.student_profiles?.[0]?.groups?.programs?.name || "N/A"

                          return (
                            <tr key={selection.id} className="border-b">
                              <td className="py-3 px-4 text-sm">{selection.profiles?.full_name || "N/A"}</td>
                              <td className="py-3 px-4 text-sm">{groupName}</td>
                              <td className="py-3 px-4 text-sm">{programName}</td>
                              <td className="py-3 px-4 text-sm">{formatDate(selection.created_at)}</td>
                              <td className="py-3 px-4 text-sm">{getSelectionStatusBadge(selection.status)}</td>
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
                                          onClick={() =>
                                            handleStatusChange(
                                              selection.id,
                                              "approved",
                                              selection.profiles?.full_name || "Student",
                                            )
                                          }
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.approve")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() =>
                                            handleStatusChange(
                                              selection.id,
                                              "rejected",
                                              selection.profiles?.full_name || "Student",
                                            )
                                          }
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.reject")}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {selection.status === "approved" && (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() =>
                                          handleStatusChange(
                                            selection.id,
                                            "rejected",
                                            selection.profiles?.full_name || "Student",
                                          )
                                        }
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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
                    {t("manager.courseDetails.viewDetailsFor")} {selectedStudent.profiles?.full_name || "Student"}
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
                          <span>{selectedStudent.profiles?.full_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.id")}:</span>
                          <span>{selectedStudent.student_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.email")}:</span>
                          <span>{selectedStudent.profiles?.email || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.group")}:</span>
                          <span>{selectedStudent.profiles?.student_profiles?.[0]?.groups?.display_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.program")}:</span>
                          <span>
                            {selectedStudent.profiles?.student_profiles?.[0]?.groups?.programs?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.selectedCourses")}</h3>
                      <div className="mt-2 space-y-2">
                        {(selectedStudent.selected_ids || []).map((courseId: string) => {
                          const course = courses.find((c) => c.id === courseId)
                          return (
                            <div key={courseId} className="rounded-md border p-2">
                              <p className="font-medium">
                                {course
                                  ? language === "ru" && course.name_ru
                                    ? course.name_ru
                                    : course.name
                                  : "Unknown Course"}
                              </p>
                              {course && (
                                <p className="text-sm text-muted-foreground">
                                  {course.code} • {course.credits} credits
                                </p>
                              )}
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
                  </div>
                </div>
                <DialogFooter>
                  {selectedStudent.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        className="mr-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() => {
                          handleStatusChange(
                            selectedStudent.id,
                            "approved",
                            selectedStudent.profiles?.full_name || "Student",
                          )
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
                          handleStatusChange(
                            selectedStudent.id,
                            "rejected",
                            selectedStudent.profiles?.full_name || "Student",
                          )
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
                    {t("manager.courseDetails.editSelectionFor")} {studentToEdit.profiles?.full_name || "Student"}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.studentInformation")}</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.name")}:</span>
                          <span>{studentToEdit.profiles?.full_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.group")}:</span>
                          <span>{studentToEdit.profiles?.student_profiles?.[0]?.groups?.display_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.program")}:</span>
                          <span>{studentToEdit.profiles?.student_profiles?.[0]?.groups?.programs?.name || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.editCourses")}</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-2">
                        {t("manager.courseDetails.selectUpTo")} {electiveCourse.max_selections}{" "}
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
                                  // Add course if not exceeding max selections
                                  if (studentToEdit.editedCourses.length < electiveCourse.max_selections) {
                                    setStudentToEdit({
                                      ...studentToEdit,
                                      editedCourses: [...studentToEdit.editedCourses, course.id],
                                    })
                                  }
                                } else {
                                  // Remove course
                                  setStudentToEdit({
                                    ...studentToEdit,
                                    editedCourses: studentToEdit.editedCourses.filter((id: string) => id !== course.id),
                                  })
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 accent-primary focus:ring-primary"
                              disabled={
                                !studentToEdit.editedCourses.includes(course.id) &&
                                studentToEdit.editedCourses.length >= electiveCourse.max_selections
                              }
                            />
                            <label htmlFor={`course-${course.id}`} className="text-sm font-medium">
                              {language === "ru" && course.name_ru ? course.name_ru : course.name}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({course.code} • {course.credits} credits)
                              </span>
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
