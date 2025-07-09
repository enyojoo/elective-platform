"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs"
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
import { getElectivePack } from "@/actions/elective-packs"
import { getCourseSelections, getElectiveCourses, updateCourseSelectionStatus } from "@/actions/course-selections"

interface ElectiveCourseDetailPageProps {
  params: {
    id: string
  }
}

export default function ElectiveCourseDetailPage({ params }: ElectiveCourseDetailPageProps) {
  const [electivePack, setElectivePack] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [courseSelections, setCourseSelections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState<any>(null)

  const { t, language } = useLanguage()
  const { toast } = useToast()

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Load elective pack details
        const packData = await getElectivePack(params.id)
        setElectivePack(packData)

        // Load courses for this pack
        const coursesData = await getElectiveCourses(params.id)
        setCourses(coursesData)

        // Load course selections
        const selectionsData = await getCourseSelections(params.id)
        setCourseSelections(selectionsData)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id, toast])

  // Calculate enrollment counts for each course
  const getEnrollmentCount = (courseName: string) => {
    return courseSelections.filter(
      (selection) =>
        selection.selected_courses &&
        selection.selected_courses.includes(courseName) &&
        (selection.status === "approved" || selection.status === "pending"),
    ).length
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
      case "active":
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

  // Function to open dialog with student details
  const openStudentDialog = (student: any) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  // Function to open edit dialog for a student selection
  const openEditDialog = (student: any) => {
    setStudentToEdit({
      ...student,
      editedCourses: [...(student.selected_courses || [])],
    })
    setEditDialogOpen(true)
  }

  // Function to handle saving edited student selection
  const saveStudentSelection = () => {
    console.log("Saving edited selection for student:", studentToEdit)
    setEditDialogOpen(false)
    toast({
      title: t("toast.selection.updated"),
      description: t("toast.selection.updated.course.description").replace(
        "{0}",
        studentToEdit.students?.name || "Student",
      ),
    })
  }

  // Function to download student statement
  const downloadStatementFile = async (studentName: string, fileUrl: string | null) => {
    if (!fileUrl) {
      toast({
        title: t("toast.statement.notAvailable"),
        description: t("toast.statement.notAvailable.description").replace("{0}", studentName),
      })
      return
    }

    try {
      const file = await downloadStatementFile(fileUrl)
      const url = URL.createObjectURL(file)
      const link = document.createElement("a")
      link.href = url
      link.download = `${studentName}_statement.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

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
    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "ID студента" : "Student ID"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Выбранные курсы" : "Selected Courses"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}","${language === "ru" ? "Заявление" : "Statement"}\n`

    const allSelectionsContent = courseSelections
      .map((selection) => {
        const translatedStatus =
          language === "ru"
            ? selection.status === "approved"
              ? "Утверждено"
              : selection.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : selection.status

        const statementLink = selection.statement_file_url
          ? `${window.location.origin}/api/statements/${selection.statement_file_url}`
          : language === "ru"
            ? "Не загружено"
            : "Not uploaded"

        const selectedCourses = selection.selected_courses ? selection.selected_courses.join("; ") : ""

        return `"${selection.students?.name || ""}","${selection.students?.student_id || ""}","${selection.students?.group_name || ""}","${selection.students?.degree_program || ""}","${selection.students?.email || ""}","${selectedCourses}","${formatDate(selection.created_at)}","${translatedStatus}","${statementLink}"`
      })
      .join("\n")

    const csv = csvHeader + allSelectionsContent
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `${electivePack?.name?.replace(/\s+/g, "_") || "course_pack"}_${language === "ru" ? "все_выборы" : "all_selections"}.csv`,
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to export course enrollments to CSV
  const exportCourseEnrollmentsToCSV = (courseName: string) => {
    const studentsInCourse = courseSelections.filter(
      (selection) => selection.selected_courses && selection.selected_courses.includes(courseName),
    )

    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "ID студента" : "Student ID"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}\n`

    const courseContent = studentsInCourse
      .map((selection) => {
        const translatedStatus =
          language === "ru"
            ? selection.status === "approved"
              ? "Утверждено"
              : selection.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : selection.status

        return `"${selection.students?.name || ""}","${selection.students?.student_id || ""}","${selection.students?.group_name || ""}","${selection.students?.degree_program || ""}","${selection.students?.email || ""}","${formatDate(selection.created_at)}","${translatedStatus}"`
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

  // Function to handle status updates
  const handleStatusUpdate = async (selectionId: string, newStatus: string, studentName: string) => {
    try {
      await updateCourseSelectionStatus(selectionId, newStatus)

      // Update local state
      setCourseSelections((prev) =>
        prev.map((selection) => (selection.id === selectionId ? { ...selection, status: newStatus } : selection)),
      )

      // Show toast based on status
      const toastKey = newStatus === "approved" ? "approved" : newStatus === "rejected" ? "rejected" : "withdrawn"
      toast({
        title: t(`toast.selection.${toastKey}`),
        description: t(`toast.selection.${toastKey}.description`).replace("{0}", studentName),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update selection status",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!electivePack) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Course pack not found</h1>
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
              <h1 className="text-3xl font-bold tracking-tight">{electivePack.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(electivePack.status)}
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
                <dt className="font-medium">{t("manager.courseDetails.selectionPeriod")}:</dt>
                <dd>{electivePack.deadline ? formatDate(electivePack.deadline) : "Not set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.maxSelections")}:</dt>
                <dd>
                  {electivePack.max_selections} {t("manager.courseDetails.courses")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.courses")}:</dt>
                <dd>{courses.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.studentsEnrolled")}:</dt>
                <dd>{courseSelections.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.courseDetails.status")}:</dt>
                <dd>{t(`manager.status.${electivePack.status}`)}</dd>
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
                        const enrollmentCount = getEnrollmentCount(course.name)
                        return (
                          <tr key={course.id} className="border-b">
                            <td className="py-3 px-4 text-sm">{course.name}</td>
                            <td className="py-3 px-4 text-sm">{course.professor}</td>
                            <td className="py-3 px-4 text-sm">
                              <Badge variant={enrollmentCount >= course.max_students ? "destructive" : "secondary"}>
                                {enrollmentCount}/{course.max_students}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportCourseEnrollmentsToCSV(course.name)}
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
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.name")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.group")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.courseDetails.selectionDate")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.courseDetails.status")}</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">{t("statement")}</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">{t("manager.courseDetails.view")}</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">
                          {t("manager.courseDetails.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseSelections.map((selection) => (
                        <tr key={selection.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{selection.students?.name || "Unknown"}</td>
                          <td className="py-3 px-4 text-sm">{selection.students?.group_name || "Unknown"}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(selection.created_at)}</td>
                          <td className="py-3 px-4 text-sm">{getSelectionStatusBadge(selection.status)}</td>
                          <td className="py-3 px-4 text-sm text-center">
                            {selection.statement_file_url ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  downloadStatementFile(
                                    selection.students?.name || "Student",
                                    selection.statement_file_url,
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
                                      onClick={() =>
                                        handleStatusUpdate(
                                          selection.id,
                                          "approved",
                                          selection.students?.name || "Student",
                                        )
                                      }
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      {t("manager.exchangeDetails.approve")}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        handleStatusUpdate(
                                          selection.id,
                                          "rejected",
                                          selection.students?.name || "Student",
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
                                      handleStatusUpdate(
                                        selection.id,
                                        "rejected",
                                        selection.students?.name || "Student",
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
                      ))}
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
                    {t("manager.courseDetails.viewDetailsFor")} {selectedStudent.students?.name}
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
                          <span>{selectedStudent.students?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.id")}:</span>
                          <span>{selectedStudent.students?.student_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.email")}:</span>
                          <span>{selectedStudent.students?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.group")}:</span>
                          <span>{selectedStudent.students?.group_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.program")}:</span>
                          <span>{selectedStudent.students?.degree_program}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.selectedCourses")}</h3>
                      <div className="mt-2 space-y-2">
                        {selectedStudent.selected_courses?.map((course: string, index: number) => (
                          <div key={index} className="rounded-md border p-2">
                            <p className="font-medium">{course}</p>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">No courses selected</p>}
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
                        {selectedStudent.statement_file_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center gap-2 bg-transparent"
                            onClick={() =>
                              downloadStatementFile(
                                selectedStudent.students?.name || "Student",
                                selectedStudent.statement_file_url,
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
                    {/* Digital Authorization Section */}
                    <div className="mt-4">
                      <h3 className="text-sm font-medium">{t("student.authorization.title")}</h3>
                      <div className="mt-2">
                        <p className="text-sm">
                          <span className="font-medium">{t("student.authorization.authorizedBy")}</span>{" "}
                          {selectedStudent.students?.name}
                        </p>
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
                          handleStatusUpdate(
                            selectedStudent.id,
                            "approved",
                            selectedStudent.students?.name || "Student",
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
                          handleStatusUpdate(
                            selectedStudent.id,
                            "rejected",
                            selectedStudent.students?.name || "Student",
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
                    {t("manager.courseDetails.editSelectionFor")} {studentToEdit.students?.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.studentInformation")}</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.name")}:</span>
                          <span>{studentToEdit.students?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.group")}:</span>
                          <span>{studentToEdit.students?.group_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">{t("manager.courseDetails.program")}:</span>
                          <span>{studentToEdit.students?.degree_program}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{t("manager.courseDetails.editCourses")}</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-2">
                        {t("manager.courseDetails.selectUpTo")} {electivePack.max_selections}{" "}
                        {t("manager.courseDetails.courses")}
                      </p>
                      <div className="mt-2 space-y-2">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`course-${course.id}`}
                              checked={studentToEdit.editedCourses.includes(course.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (studentToEdit.editedCourses.length < electivePack.max_selections) {
                                    setStudentToEdit({
                                      ...studentToEdit,
                                      editedCourses: [...studentToEdit.editedCourses, course.name],
                                    })
                                  }
                                } else {
                                  setStudentToEdit({
                                    ...studentToEdit,
                                    editedCourses: studentToEdit.editedCourses.filter(
                                      (name: string) => name !== course.name,
                                    ),
                                  })
                                }
                              }}
                              className="h-4 w-4 rounded border-gray-300 accent-primary focus:ring-primary"
                              disabled={
                                !studentToEdit.editedCourses.includes(course.name) &&
                                studentToEdit.editedCourses.length >= electivePack.max_selections
                              }
                            />
                            <label htmlFor={`course-${course.id}`} className="text-sm font-medium">
                              {course.name}
                              <span className="text-xs text-muted-foreground ml-1">({course.professor})</span>
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
