import { DialogFooter } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, ElectivePackStatus, SelectionStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ArrowLeft, Edit, Plus, Search, Trash2, CheckCircle, XCircle, Clock, Download } from "lucide-react"
import Link from "next/link"

interface ElectivePackDetailPageProps {
  params: {
    id: string
  }
}

export default function ElectivePackDetailPage({ params }: ElectivePackDetailPageProps) {
  // Mock elective pack data
  const electivePack = {
    id: params.id,
    name:
      params.id === "fall-2023"
        ? "Fall Semester 2023 Electives"
        : params.id === "spring-2024"
          ? "Spring Semester 2024 Electives"
          : "Elective Pack",
    description:
      "Select your preferred elective courses for this semester. You can choose up to the maximum number of courses allowed for this pack.",
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

  // Mock elective courses data for this pack
  const electiveCourses = [
    {
      id: "1",
      name: "Business Ethics",
      description: "Explore ethical principles and moral challenges in business decision-making.",
      credits: 3,
      maxStudents: 30,
      currentStudents: 18,
      teacher: "Dr. Anna Ivanova",
      academicYear: 2,
      semester: electivePack.semester,
      year: electivePack.year,
      degree: "Bachelor",
      programs: ["Management", "International Management"],
    },
    {
      id: "2",
      name: "Digital Marketing",
      description: "Learn modern digital marketing strategies and tools for business growth.",
      credits: 4,
      maxStudents: 25,
      currentStudents: 25,
      teacher: "Prof. Mikhail Petrov",
      academicYear: 2,
      semester: electivePack.semester,
      year: electivePack.year,
      degree: "Bachelor",
      programs: ["Management", "International Management"],
    },
    {
      id: "3",
      name: "Sustainable Business",
      description: "Study sustainable business practices and their impact on the environment and society.",
      credits: 3,
      maxStudents: 35,
      currentStudents: 12,
      teacher: "Dr. Elena Smirnova",
      academicYear: 2,
      semester: electivePack.semester,
      year: electivePack.year,
      degree: "Bachelor",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "4",
      name: "Project Management",
      description: "Master the principles and methodologies of effective project management.",
      credits: 4,
      maxStudents: 30,
      currentStudents: 28,
      teacher: "Prof. Sergei Kuznetsov",
      academicYear: 2,
      semester: electivePack.semester,
      year: electivePack.year,
      degree: "Bachelor",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "5",
      name: "International Business Law",
      description: "Understand legal frameworks governing international business operations.",
      credits: 3,
      maxStudents: 25,
      currentStudents: 15,
      teacher: "Dr. Olga Volkova",
      academicYear: 2,
      semester: electivePack.semester,
      year: electivePack.year,
      degree: "Bachelor",
      programs: ["International Management"],
    },
    {
      id: "6",
      name: "Financial Markets",
      description: "Analyze financial markets, instruments, and investment strategies.",
      credits: 4,
      maxStudents: 30,
      currentStudents: 22,
      teacher: "Prof. Dmitry Sokolov",
      academicYear: 2,
      semester: electivePack.semester,
      year: electivePack.year,
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
      selectedCourses: ["Business Ethics", "Sustainable Business"],
      selectionDate: "2023-08-05",
      status: SelectionStatus.APPROVED,
    },
    {
      id: "2",
      studentName: "Maria Petrova",
      studentId: "st123457",
      group: "23.B12-vshm",
      program: "Management",
      selectedCourses: ["Digital Marketing", "Financial Markets"],
      selectionDate: "2023-08-06",
      status: SelectionStatus.APPROVED,
    },
    {
      id: "3",
      studentName: "Ivan Sokolov",
      studentId: "st123458",
      group: "23.B12-vshm",
      program: "Management",
      selectedCourses: ["Project Management", "International Business Law"],
      selectionDate: "2023-08-07",
      status: SelectionStatus.PENDING,
    },
    {
      id: "4",
      studentName: "Elena Ivanova",
      studentId: "st123459",
      group: "23.B11-vshm",
      program: "International Management",
      selectedCourses: ["Business Ethics", "International Business Law"],
      selectionDate: "2023-08-08",
      status: SelectionStatus.PENDING,
    },
  ]

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
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

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{electivePack.name}</h1>
              <p className="text-muted-foreground">
                {electivePack.semester} {electivePack.year} • Max Selections: {electivePack.maxSelections}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(electivePack.status)}
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Pack
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Pack Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium">Selection Period:</dt>
                  <dd>
                    {formatDate(electivePack.startDate)} - {formatDate(electivePack.endDate)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Max Selections:</dt>
                  <dd>{electivePack.maxSelections} courses</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Courses:</dt>
                  <dd>{electivePack.coursesCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Students Enrolled:</dt>
                  <dd>{electivePack.studentsEnrolled}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Created:</dt>
                  <dd>{formatDate(electivePack.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Status:</dt>
                  <dd>{electivePack.status}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Enrollment Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Overall Enrollment</span>
                    <span className="text-sm font-medium">{electivePack.studentsEnrolled} students</span>
                  </div>
                  <Progress value={electivePack.studentsEnrolled > 0 ? 75 : 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Approved Selections</span>
                    <span className="text-sm font-medium">
                      {studentSelections.filter((s) => s.status === SelectionStatus.APPROVED).length} /{" "}
                      {studentSelections.length}
                    </span>
                  </div>
                  <Progress
                    value={
                      (studentSelections.filter((s) => s.status === SelectionStatus.APPROVED).length /
                        studentSelections.length) *
                      100
                    }
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Pending Selections</span>
                    <span className="text-sm font-medium">
                      {studentSelections.filter((s) => s.status === SelectionStatus.PENDING).length} /{" "}
                      {studentSelections.length}
                    </span>
                  </div>
                  <Progress
                    value={
                      (studentSelections.filter((s) => s.status === SelectionStatus.PENDING).length /
                        studentSelections.length) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="students">Student Selections</TabsTrigger>
          </TabsList>
          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Courses in this Pack</CardTitle>
                  <CardDescription>Manage the courses available in this elective pack</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Course to Pack</DialogTitle>
                      <DialogDescription>Select courses to add to this elective pack.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="search"
                            placeholder="Search courses..."
                            className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {electiveCourses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted">
                            <Checkbox id={`course-${course.id}`} />
                            <div>
                              <label
                                htmlFor={`course-${course.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {course.name}
                              </label>
                              <p className="text-xs text-muted-foreground">{course.teacher}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Selected Courses</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Teacher</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Credits</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Enrollment</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Programs</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {electiveCourses.map((course) => (
                        <tr key={course.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{course.name}</td>
                          <td className="py-3 px-4 text-sm">{course.teacher}</td>
                          <td className="py-3 px-4 text-sm">{course.credits}</td>
                          <td className="py-3 px-4 text-sm">
                            <Badge variant={course.currentStudents >= course.maxStudents ? "destructive" : "secondary"}>
                              {course.currentStudents}/{course.maxStudents}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {course.programs.map((program, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {program}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                  <CardDescription>Manage student selections for this elective pack</CardDescription>
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
                        <th className="py-3 px-4 text-left text-sm font-medium">Student</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">ID</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Group</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Program</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Selected Courses</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Selection Date</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSelections.map((selection) => (
                        <tr key={selection.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{selection.studentName}</td>
                          <td className="py-3 px-4 text-sm">{selection.studentId}</td>
                          <td className="py-3 px-4 text-sm">{selection.group}</td>
                          <td className="py-3 px-4 text-sm">{selection.program}</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex flex-col gap-1">
                              {selection.selectedCourses.map((course, index) => (
                                <span key={index} className="text-xs">
                                  {course}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">{formatDate(selection.selectionDate)}</td>
                          <td className="py-3 px-4 text-sm">{getSelectionStatusBadge(selection.status)}</td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              {selection.status === SelectionStatus.PENDING && (
                                <>
                                  <Button variant="ghost" size="icon" className="text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-red-600">
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
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
    </DashboardLayout>
  )
}
