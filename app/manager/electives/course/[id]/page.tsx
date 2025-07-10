"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface ElectiveCourseDetailPageProps {
  params: {
    id: string
  }
}

interface Course {
  id: string
  name_en: string
  name_ru?: string
  instructor_en: string
  instructor_ru?: string
  degree_id: string
  max_students: number
  degrees?: {
    name: string
    name_ru?: string
  }
}

interface StudentSelection {
  id: string
  student_id: string
  elective_courses_id: string
  selected_ids: string[]
  status: string
  statement_url?: string
  created_at: string
  profiles: {
    id: string
    full_name: string
    email: string
    student_profiles: Array<{
      group_id: string
      enrollment_year: number
      groups: {
        name: string
        display_name: string
        programs: {
          name: string
          name_ru?: string
        }
      }
    }>
  }
}

export default function ElectiveCourseDetailPage({ params }: ElectiveCourseDetailPageProps) {
  const [electiveCourse, setElectiveCourse] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [studentSelections, setStudentSelections] = useState<StudentSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<StudentSelection | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load course program
      const { data: program, error: programError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", params.id)
        .single()

      if (programError) {
        throw new Error("Failed to load course program")
      }

      setElectiveCourse(program)

      // Load courses using the UUIDs from the courses column
      if (program?.courses && Array.isArray(program.courses) && program.courses.length > 0) {
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select(`
    id,
    name_en,
    name_ru,
    instructor_en,
    instructor_ru,
    degree_id,
    max_students,
    degrees(
      name,
      name_ru
    )
  `)
          .in("id", program.courses)

        if (coursesError) {
          console.error("Error loading courses:", coursesError)
        } else if (coursesData) {
          setCourses(coursesData)
        }
      }

      // Load student selections with profile information
      const { data: selections, error: selectionsError } = await supabase
        .from("course_selections")
        .select(`
    *,
    profiles(
      id,
      full_name,
      email,
      student_profiles(
        group_id,
        enrollment_year,
        groups(
          name,
          display_name,
          programs(
            name,
            name_ru
          )
        )
      )
    )
  `)
        .eq("elective_courses_id", params.id)

      if (selectionsError) {
        console.error("Error loading student selections:", selectionsError)
      } else if (selections) {
        setStudentSelections(selections)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load course program data")
      toast({
        title: "Error",
        description: "Failed to load course program data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            Draft
          </Badge>
        )
      case "published":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            Published
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            Closed
          </Badge>
        )
      case "archived":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
            Archived
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSelectionStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCourseEnrollment = (courseId: string) => {
    return studentSelections.filter(
      (selection) =>
        selection.selected_ids &&
        selection.selected_ids.includes(courseId) &&
        (selection.status === "approved" || selection.status === "pending"),
    ).length
  }

  const getTotalStudentsEnrolled = () => {
    return studentSelections.filter((selection) => selection.status === "approved" || selection.status === "pending")
      .length
  }

  const handleStatusChange = async (selectionId: string, newStatus: "approved" | "rejected", studentName: string) => {
    try {
      const { error } = await supabase.from("course_selections").update({ status: newStatus }).eq("id", selectionId)

      if (error) throw error

      setStudentSelections((prev) =>
        prev.map((selection) => (selection.id === selectionId ? { ...selection, status: newStatus } : selection)),
      )

      toast({
        title: `Selection ${newStatus}`,
        description: `Selection ${newStatus} for ${studentName}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${newStatus} selection`,
        variant: "destructive",
      })
    }
  }

  const exportCourseEnrollmentsToCSV = (course: Course) => {
    // Get students enrolled in this specific course
    const enrolledStudents = studentSelections.filter(
      (selection) =>
        selection.selected_ids &&
        selection.selected_ids.includes(course.id) &&
        (selection.status === "approved" || selection.status === "pending"),
    )

    if (enrolledStudents.length === 0) {
      toast({
        title: "No Data",
        description: "No students are enrolled in this course.",
      })
      return
    }

    // Create CSV content
    const headers = ["Student Name", "Email", "Group", "Program", "Status", "Selection Date"]
    let csvContent = headers.map((header) => `"${header}"`).join(",") + "\n"

    enrolledStudents.forEach((selection) => {
      const studentProfile = selection.profiles?.student_profiles?.[0]
      const groupName = studentProfile?.groups?.display_name || "N/A"
      const programName = studentProfile?.groups?.programs?.name || "N/A"

      const row = [
        `"${selection.profiles?.full_name || "N/A"}"`,
        `"${selection.profiles?.email || "N/A"}"`,
        `"${groupName}"`,
        `"${programName}"`,
        `"${selection.status}"`,
        `"${formatDate(selection.created_at)}"`,
      ]

      csvContent += row.join(",") + "\n"
    })

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fileName = `course_${course.name_en.replace(/\s+/g, "_")}_enrollments.csv`

    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: `Course enrollment data for "${course.name_en}" exported successfully`,
    })
  }

  const exportAllSelectionsToCSV = () => {
    if (studentSelections.length === 0) {
      toast({
        title: "No Data",
        description: "No student selections to export.",
      })
      return
    }

    // Create CSV content
    const headers = ["Student Name", "Email", "Group", "Program", "Selected Courses", "Status", "Selection Date"]
    let csvContent = headers.map((header) => `"${header}"`).join(",") + "\n"

    studentSelections.forEach((selection) => {
      const studentProfile = selection.profiles?.student_profiles?.[0]
      const groupName = studentProfile?.groups?.display_name || "N/A"
      const programName = studentProfile?.groups?.programs?.name || "N/A"

      // Get selected course names
      const selectedCourseNames = (selection.selected_ids || [])
        .map((courseId) => {
          const course = courses.find((c) => c.id === courseId)
          return course ? (language === "ru" && course.name_ru ? course.name_ru : course.name_en) : "Unknown Course"
        })
        .join("; ")

      const row = [
        `"${selection.profiles?.full_name || "N/A"}"`,
        `"${selection.profiles?.email || "N/A"}"`,
        `"${groupName}"`,
        `"${programName}"`,
        `"${selectedCourseNames}"`,
        `"${selection.status}"`,
        `"${formatDate(selection.created_at)}"`,
      ]

      csvContent += row.join(",") + "\n"
    })

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fileName = `course_program_${electiveCourse?.name?.replace(/\s+/g, "_")}_all_selections.csv`

    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: "All student selections exported successfully",
    })
  }

  const openStudentDialog = (student: StudentSelection) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  const downloadStudentStatement = (studentName: string, statementUrl: string | null) => {
    if (!statementUrl) {
      toast({
        title: "Statement not available",
        description: `No statement file uploaded for ${studentName}`,
      })
      return
    }

    // Open the statement URL in a new tab
    window.open(statementUrl, "_blank")

    toast({
      title: "Statement opened",
      description: "Statement file opened in new tab",
    })
  }

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
            <Link href="/manager/electives/course">
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
                Edit
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Deadline:</dt>
                <dd>{electiveCourse.deadline ? formatDate(electiveCourse.deadline) : "No deadline set"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Max Selections:</dt>
                <dd>{electiveCourse.max_selections} courses</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Courses:</dt>
                <dd>{courses.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Students Enrolled:</dt>
                <dd>{getTotalStudentsEnrolled()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Created:</dt>
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
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Student Selections</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Courses in this Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[25%]">Name</TableHead>
                        <TableHead className="w-[20%]">Instructor</TableHead>
                        <TableHead className="w-[15%]">Degree</TableHead>
                        <TableHead className="w-[15%]">Enrollment</TableHead>
                        <TableHead className="w-[25%] text-center">Export</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No courses configured for this program
                          </TableCell>
                        </TableRow>
                      ) : (
                        courses.map((course) => {
                          const currentEnrollment = getCourseEnrollment(course.id)
                          return (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium">
                                {language === "ru" && course.name_ru ? course.name_ru : course.name_en}
                              </TableCell>
                              <TableCell>
                                {language === "ru" && course.instructor_ru
                                  ? course.instructor_ru
                                  : course.instructor_en || "Not assigned"}
                              </TableCell>
                              <TableCell>
                                {course.degrees
                                  ? language === "ru" && course.degrees.name_ru
                                    ? course.degrees.name_ru
                                    : course.degrees.name
                                  : "Not specified"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={currentEnrollment >= course.max_students ? "destructive" : "secondary"}>
                                  {currentEnrollment}/{course.max_students}
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
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Student Selections</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search students..."
                      className="pl-8 md:w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={exportAllSelectionsToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[20%]">Name</TableHead>
                        <TableHead className="w-[20%]">Email</TableHead>
                        <TableHead className="w-[15%]">Selection Date</TableHead>
                        <TableHead className="w-[15%]">Status</TableHead>
                        <TableHead className="w-[10%] text-center">Statement</TableHead>
                        <TableHead className="w-[10%] text-center">View</TableHead>
                        <TableHead className="w-[10%] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudentSelections.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            {searchTerm ? "No students found matching your search" : "No student selections yet"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudentSelections.map((selection) => {
                          const studentProfile = selection.profiles
                          const groupInfo = studentProfile?.student_profiles?.[0]?.groups

                          return (
                            <TableRow key={selection.id}>
                              <TableCell className="font-medium">
                                {studentProfile?.full_name || "N/A"}
                                <div className="text-sm text-muted-foreground">{groupInfo?.display_name || "N/A"}</div>
                              </TableCell>
                              <TableCell>{studentProfile?.email || "N/A"}</TableCell>
                              <TableCell>{formatDate(selection.created_at)}</TableCell>
                              <TableCell>{getSelectionStatusBadge(selection.status)}</TableCell>
                              <TableCell className="text-center">
                                {selection.statement_url ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      downloadStudentStatement(
                                        studentProfile?.full_name || "Student",
                                        selection.statement_url,
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
                                    <DropdownMenuItem>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    {selection.status === "pending" && (
                                      <>
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() =>
                                            handleStatusChange(
                                              selection.id,
                                              "approved",
                                              studentProfile?.full_name || "Student",
                                            )
                                          }
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() =>
                                            handleStatusChange(
                                              selection.id,
                                              "rejected",
                                              studentProfile?.full_name || "Student",
                                            )
                                          }
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          Reject
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
                                            studentProfile?.full_name || "Student",
                                          )
                                        }
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Withdraw
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
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
                  <DialogTitle>Student Selection Details</DialogTitle>
                  <DialogDescription>
                    View details for {selectedStudent.profiles?.full_name || "Student"} course selection
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Student Information</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Name:</span>
                          <span>{selectedStudent.profiles?.full_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">ID:</span>
                          <span>{selectedStudent.student_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{selectedStudent.profiles?.email || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Group:</span>
                          <span>{selectedStudent.profiles?.student_profiles?.[0]?.groups?.display_name || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Program:</span>
                          <span>
                            {selectedStudent.profiles?.student_profiles?.[0]?.groups?.programs?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Selected Courses</h3>
                      <div className="mt-2 space-y-2">
                        {(selectedStudent.selected_ids || []).map((courseId: string) => {
                          const course = courses.find((c) => c.id === courseId)
                          return (
                            <div key={courseId} className="rounded-md border p-2">
                              <p className="font-medium">
                                {course
                                  ? language === "ru" && course.name_ru
                                    ? course.name_ru
                                    : course.name_en
                                  : "Unknown Course"}
                              </p>
                              {course && (
                                <p className="text-sm text-muted-foreground">
                                  {language === "ru" && course.instructor_ru
                                    ? course.instructor_ru
                                    : course.instructor_en}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Selection Information</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Date:</span>
                          <span>{formatDate(selectedStudent.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
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
                        Approve
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
                        Reject
                      </Button>
                    </>
                  )}
                  <DialogClose asChild>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Close
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
