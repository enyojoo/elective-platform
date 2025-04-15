"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, ElectivePackStatus, SelectionStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, Edit, Eye, MoreVertical, Search, CheckCircle, XCircle, Clock, Download } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Add the language import first
import { useLanguage } from "@/lib/language-context"

interface ElectiveCourseDetailPageProps {
  params: {
    id: string
  }
}

export default function AdminElectiveCourseDetailPage({ params }: ElectiveCourseDetailPageProps) {
  // Add the language hook near the top of the component
  const { t, language } = useLanguage()

  // State for dialog
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Mock elective course data
  const electiveCourse = {
    id: params.id,
    name:
      params.id === "fall-2023"
        ? "Fall Semester 2023"
        : params.id === "spring-2024"
          ? "Spring Semester 2024"
          : "Elective Courses",
    description:
      "Select your preferred courses for this semester's elective program. You can choose up to the maximum number of courses allowed for this program.",
    semester: params.id.includes("fall") ? "Fall" : "Spring",
    year: params.id.includes("2023") ? 2023 : params.id.includes("2024") ? 2024 : 2025,
    maxSelections: params.id === "spring-2024" ? 3 : 2,
    status: ElectivePackStatus.PUBLISHED,
    startDate: params.id.includes("fall") ? "2023-08-01" : "2024-01-10",
    endDate: params.id.includes("fall") ? "2023-08-15" : "2024-01-25",
    coursesCount: params.id === "spring-2024" ? 8 : 6,
    studentsEnrolled: params.id === "fall-2023" ? 42 : params.id === "spring-2024" ? 28 : 0,
    createdAt: params.id.includes("fall") ? "2023-07-01" : "2023-12-01",
  }

  // Mock courses data for this elective program
  const courses = [
    {
      id: "1",
      name: "Strategic Management",
      description: "This course focuses on the strategic management of organizations.",
      credits: 5,
      maxStudents: 30,
      currentStudents: 25,
      professor: "Dr. Smith",
      semester: electiveCourse.semester,
      year: electiveCourse.year,
      degree: "Bachelor",
      programs: ["Management", "International Management"],
    },
    {
      id: "2",
      name: "International Marketing",
      description: "This course covers marketing strategies in an international context.",
      credits: 4,
      maxStudents: 25,
      currentStudents: 25,
      professor: "Dr. Johnson",
      semester: electiveCourse.semester,
      year: electiveCourse.year,
      degree: "Bachelor",
      programs: ["Management", "International Management"],
    },
    {
      id: "3",
      name: "Financial Management",
      description: "This course covers financial management principles and practices.",
      credits: 5,
      maxStudents: 35,
      currentStudents: 20,
      professor: "Dr. Williams",
      semester: electiveCourse.semester,
      year: electiveCourse.year,
      degree: "Bachelor",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "4",
      name: "Organizational Behavior",
      description: "This course examines human behavior in organizational settings.",
      credits: 4,
      maxStudents: 30,
      currentStudents: 30,
      professor: "Dr. Brown",
      semester: electiveCourse.semester,
      year: electiveCourse.year,
      degree: "Bachelor",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "5",
      name: "Business Ethics",
      description: "This course explores ethical issues in business and management.",
      credits: 3,
      maxStudents: 40,
      currentStudents: 15,
      professor: "Dr. Davis",
      semester: electiveCourse.semester,
      year: electiveCourse.year,
      degree: "Bachelor",
      programs: ["International Management"],
    },
    {
      id: "6",
      name: "Supply Chain Management",
      description: "This course covers the management of supply chains and logistics.",
      credits: 4,
      maxStudents: 25,
      currentStudents: 20,
      professor: "Dr. Miller",
      semester: electiveCourse.semester,
      year: electiveCourse.year,
      degree: "Bachelor",
      programs: ["Management", "International Management"],
    },
  ]

  // Mock student selections data
  const studentSelections = [
    {
      id: "1",
      studentName: "Alex Johnson",
      studentId: "st123456",
      group: "23.B12-vshm",
      program: "Management",
      email: "alex.johnson@student.gsom.spbu.ru",
      selectedCourses: ["Strategic Management", "Financial Management"],
      selectionDate: "2023-08-05",
      status: SelectionStatus.APPROVED,
    },
    {
      id: "2",
      studentName: "Maria Petrova",
      studentId: "st123457",
      group: "23.B12-vshm",
      program: "Management",
      email: "maria.petrova@student.gsom.spbu.ru",
      selectedCourses: ["International Marketing", "Supply Chain Management"],
      selectionDate: "2023-08-06",
      status: SelectionStatus.APPROVED,
    },
    {
      id: "3",
      studentName: "Ivan Sokolov",
      studentId: "st123458",
      group: "23.B12-vshm",
      program: "Management",
      email: "ivan.sokolov@student.gsom.spbu.ru",
      selectedCourses: ["Organizational Behavior", "Business Ethics"],
      selectionDate: "2023-08-07",
      status: SelectionStatus.PENDING,
    },
    {
      id: "4",
      studentName: "Elena Ivanova",
      studentId: "st123459",
      group: "23.B11-vshm",
      program: "International Management",
      email: "elena.ivanova@student.gsom.spbu.ru",
      selectedCourses: ["Strategic Management", "Business Ethics"],
      selectionDate: "2023-08-08",
      status: SelectionStatus.PENDING,
    },
  ]

  // Replace the existing formatDate function with this one:
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper function to get status badge
  const getStatusBadge = (status: ElectivePackStatus) => {
    switch (status) {
      case ElectivePackStatus.DRAFT:
        return <Badge variant="outline">Draft</Badge>
      case ElectivePackStatus.PUBLISHED:
        return <Badge variant="secondary">Published</Badge>
      case ElectivePackStatus.CLOSED:
        return <Badge variant="destructive">Closed</Badge>
      case ElectivePackStatus.ARCHIVED:
        return <Badge variant="default">Archived</Badge>
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
            Approved
          </Badge>
        )
      case SelectionStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case SelectionStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
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

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/admin/electives?tab=courses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{electiveCourse.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">{getStatusBadge(electiveCourse.status)}</div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">Selection Period:</dt>
                <dd>
                  {formatDate(electiveCourse.startDate)} - {formatDate(electiveCourse.endDate)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Max Selections:</dt>
                <dd>{electiveCourse.maxSelections} courses</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Courses:</dt>
                <dd>{electiveCourse.coursesCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Students Enrolled:</dt>
                <dd>{electiveCourse.studentsEnrolled}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Created:</dt>
                <dd>{formatDate(electiveCourse.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Status:</dt>
                <dd>{t(`manager.status.${electiveCourse.status.toLowerCase()}`)}</dd>
              </div>
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
                <div>
                  <CardTitle>Courses in this Program</CardTitle>
                  {/* No description needed */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Professor</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Enrollment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course) => (
                        <tr key={course.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{course.name}</td>
                          <td className="py-3 px-4 text-sm">{course.professor}</td>
                          <td className="py-3 px-4 text-sm">
                            <Badge variant={course.currentStudents >= course.maxStudents ? "destructive" : "secondary"}>
                              {course.currentStudents}/{course.maxStudents}
                            </Badge>
                          </td>
                        </tr>
                      ))}
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
                  <CardTitle>Student Selections</CardTitle>
                  <CardDescription>Manage student selections for this elective program</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder="Search students..."
                      className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[200px]"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Group</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Selection Date</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">View</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSelections.map((selection) => (
                        <tr key={selection.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{selection.studentName}</td>
                          <td className="py-3 px-4 text-sm">{selection.group}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(selection.selectionDate)}</td>
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
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {selection.status === SelectionStatus.PENDING && (
                                  <>
                                    <DropdownMenuItem className="text-green-600">
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
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
      </div>
      {/* Student Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>Student Selection Details</DialogTitle>
                <DialogDescription>View details for {selectedStudent.studentName}'s course selection</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Student Information</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{selectedStudent.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">ID:</span>
                        <span>{selectedStudent.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{selectedStudent.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Group:</span>
                        <span>{selectedStudent.group}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Program:</span>
                        <span>{selectedStudent.program}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Selected Courses</h3>
                    <div className="mt-2 space-y-2">
                      {selectedStudent.selectedCourses.map((course: string, index: number) => (
                        <div key={index} className="rounded-md border p-2">
                          <p className="font-medium">{course}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Selection Information</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Date:</span>
                        <span>{formatDate(selectedStudent.selectionDate)}</span>
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
                {selectedStudent.status === SelectionStatus.PENDING && (
                  <>
                    <Button
                      variant="outline"
                      className="mr-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                      onClick={() => console.log("Approve selection")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="mr-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                      onClick={() => console.log("Reject selection")}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
