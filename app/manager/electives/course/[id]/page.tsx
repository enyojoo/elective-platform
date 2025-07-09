"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
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
import { PageSkeleton } from "@/components/ui/page-skeleton"

// Interface definitions
interface ElectiveCourseDetailPageProps {
  params: { id: string }
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
  courses: string[] // Expecting an array of course UUIDs
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
  instructor: string | null
  degree: string | null
}

interface StudentSelection {
  id: string
  selected_ids: string[] // Expecting an array of course UUIDs
  status: string
  created_at: string
  student_id: string
  statement_file: string | null
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
  }
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`--- Starting data load for elective course ID: ${params.id} ---`)

      // 1. Fetch the main elective course program
      const programData = await getCourseProgram(params.id)
      console.log("1. Fetched Elective Course Program:", programData)

      if (!programData) {
        setError("Elective course program not found. Please check the ID in the URL.")
        setLoading(false)
        return
      }
      setElectiveCourse(programData)

      // 2. Get course IDs from the program data
      // Ensure `programData.courses` is an array. If it's null or not an array, default to empty.
      const courseIds = Array.isArray(programData.courses) ? programData.courses : []
      console.log("2. Extracted Course IDs:", courseIds)

      // 3. Fetch details for the extracted course IDs
      if (courseIds.length > 0) {
        const coursesData = await getCoursesFromIds(courseIds)
        console.log("3. Fetched Course Details:", coursesData)
        setCourses(coursesData)
      } else {
        console.log("3. No associated course IDs found in the program data. The 'Courses' tab will be empty.")
        setCourses([])
      }

      // 4. Fetch all student selections for this program
      const selectionsData = await getCourseSelections(params.id)
      console.log("4. Fetched Student Selections:", selectionsData)
      setStudentSelections(selectionsData)

      console.log("--- Data load finished successfully ---")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      console.error("--- Data load failed ---", err)
      setError(`Failed to load data: ${errorMessage}`)
      toast({
        title: "Error Loading Data",
        description: "Failed to load page data. Please check the console for detailed logs.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Helper functions (calculations, formatting, badges)
  const getCourseEnrollment = (courseId: string) =>
    studentSelections.filter(
      (s) =>
        Array.isArray(s.selected_ids) &&
        s.selected_ids.includes(courseId) &&
        (s.status === "approved" || s.status === "pending"),
    ).length

  const getTotalStudentsEnrolled = () =>
    studentSelections.filter((s) => s.status === "approved" || s.status === "pending").length

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: any; label: string } } = {
      draft: { variant: "outline", label: t("manager.status.draft") },
      published: { variant: "secondary", label: t("manager.status.published") },
      closed: { variant: "destructive", label: t("manager.status.closed") },
      archived: { variant: "default", label: t("manager.status.archived") },
    }
    const { variant, label } = statusMap[status] || { variant: "outline", label: status }
    return <Badge variant={variant}>{label}</Badge>
  }

  const getSelectionStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.approved")}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.pending")}
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.rejected")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Event Handlers
  const handleStatusChange = async (selectionId: string, newStatus: "approved" | "rejected", studentName: string) => {
    try {
      await updateCourseSelectionStatus(selectionId, newStatus)
      setStudentSelections((prev) => prev.map((s) => (s.id === selectionId ? { ...s, status: newStatus } : s)))
      toast({ title: `Selection ${newStatus}`, description: `Selection for ${studentName} has been ${newStatus}.` })
    } catch (error) {
      toast({ title: "Error", description: `Failed to ${newStatus} selection.`, variant: "destructive" })
    }
  }

  const saveStudentSelection = async () => {
    if (!studentToEdit) return
    try {
      await updateStudentCourseSelection(studentToEdit.id, studentToEdit.editedCourses, studentToEdit.status)
      setStudentSelections((prev) =>
        prev.map((s) => (s.id === studentToEdit.id ? { ...s, selected_ids: studentToEdit.editedCourses } : s)),
      )
      setEditDialogOpen(false)
      toast({
        title: t("toast.selection.updated"),
        description: t("toast.selection.updated.course.description").replace(
          "{0}",
          studentToEdit.profiles?.full_name || "Student",
        ),
      })
    } catch (error) {
      toast({ title: "Error", description: "Failed to update selection.", variant: "destructive" })
    }
  }

  // Other functions (dialogs, exports)
  const openStudentDialog = (student: StudentSelection) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const openEditDialog = (student: StudentSelection) => {
    setStudentToEdit({ ...student, editedCourses: [...(student.selected_ids || [])] })
    setEditDialogOpen(true)
  }

  const exportCourseEnrollmentsToCSV = async (course: Course) => {
    try {
      const selectionData = await getCourseSelectionData(course.id, params.id)
      if (!selectionData || selectionData.length === 0) {
        toast({ title: "No Data", description: "No students are enrolled in this course." })
        return
      }
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
      toast({ title: "Export Error", description: "Failed to fetch data for export.", variant: "destructive" })
    }
  }

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
          .map((courseId: string) => {
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

  const downloadStudentStatement = (studentName: string, fileName: string | null) => {
    if (!fileName) {
      toast({
        title: "Statement not available",
        description: `No statement file uploaded for ${studentName}`,
      })
      return
    }

    // In a real app, this would download the actual file
    // For this demo, we'll just show a toast
    toast({
      title: "Statement download",
      description: "Statement file download started",
    })
  }

  const filteredStudentSelections = studentSelections.filter(
    (s) =>
      s.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Render logic
  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <PageSkeleton />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Data</h1>
          <p className="text-muted-foreground mt-2 max-w-md">{error}</p>
          <Button onClick={loadData} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!electiveCourse) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course program not found</h1>
        </div>
      </DashboardLayout>
    )
  }

  // Main component return
  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives?tab=courses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "ru" && electiveCourse.name_ru ? electiveCourse.name_ru : electiveCourse.name}
            </h1>
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

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("manager.courseDetails.programDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.deadline")}:</dt>
                <dd>{electiveCourse.deadline ? formatDate(electiveCourse.deadline) : "N/A"}</dd>
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
                <div className="col-span-full flex flex-col gap-1 pt-2">
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

        {/* Tabs */}
        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses">{t("manager.courseDetails.coursesTab")}</TabsTrigger>
            <TabsTrigger value="students">{t("manager.courseDetails.studentsTab")}</TabsTrigger>
          </TabsList>

          {/* Courses Tab Content */}
          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("manager.courseDetails.coursesInProgram")}</CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No courses are configured for this program.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[25%]">{t("manager.courseDetails.name")}</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Degree</TableHead>
                          <TableHead>{t("manager.courseDetails.enrollment")}</TableHead>
                          <TableHead className="text-center">{t("manager.courseDetails.export")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">
                              {language === "ru" && course.name_ru ? course.name_ru : course.name}
                              <div className="text-sm text-muted-foreground">
                                {course.code} • {course.credits} credits
                              </div>
                            </TableCell>
                            <TableCell>{course.instructor || "N/A"}</TableCell>
                            <TableCell>{course.degree || "N/A"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  getCourseEnrollment(course.id) >= course.max_students ? "destructive" : "secondary"
                                }
                              >
                                {getCourseEnrollment(course.id)}/{course.max_students}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportCourseEnrollmentsToCSV(course)}
                                className="flex items-center gap-1 mx-auto"
                              >
                                <FileDown className="h-4 w-4" />
                                {t("manager.courseDetails.download")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab Content */}
          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>{t("manager.courseDetails.studentSelections")}</CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder={t("manager.courseDetails.searchStudents")}
                      className="h-10 w-full rounded-md border pl-8"
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
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("manager.courseDetails.name")}</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>{t("manager.courseDetails.selectionDate")}</TableHead>
                        <TableHead>{t("manager.courseDetails.status")}</TableHead>
                        <TableHead className="text-center">Statement</TableHead>
                        <TableHead className="text-center">{t("manager.courseDetails.view")}</TableHead>
                        <TableHead className="text-center">{t("manager.courseDetails.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudentSelections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            {searchTerm ? "No students found." : "No student selections have been made yet."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudentSelections.map((selection) => (
                          <TableRow key={selection.id}>
                            <TableCell className="font-medium">
                              {selection.profiles?.full_name || "N/A"}
                              <div className="text-sm text-muted-foreground">
                                {selection.profiles?.student_profiles?.[0]?.groups?.display_name || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell>{selection.profiles?.email || "N/A"}</TableCell>
                            <TableCell>{formatDate(selection.created_at)}</TableCell>
                            <TableCell>{getSelectionStatusBadge(selection.status)}</TableCell>
                            <TableCell className="text-center">
                              {selection.statement_file ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    downloadStudentStatement(
                                      selection.profiles?.full_name || "Student",
                                      selection.statement_file,
                                    )
                                  }
                                >
                                  <FileDown className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button variant="ghost" size="icon" onClick={() => openStudentDialog(selection)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                            <TableCell className="text-center">
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
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs (Student Details, Edit Selection) */}
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
