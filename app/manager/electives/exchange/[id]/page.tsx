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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ArrowLeft, Edit, Plus, Search, Trash2, CheckCircle, XCircle, Clock, Download } from "lucide-react"
import Link from "next/link"

interface ExchangeProgramDetailPageProps {
  params: {
    id: string
  }
}

export default function ExchangeDetailPage({ params }: ExchangeProgramDetailPageProps) {
  // Mock exchange program data
  const exchangeProgram = {
    id: params.id,
    name:
      params.id === "fall-2023"
        ? "Fall Semester 2023 Exchange"
        : params.id === "spring-2024"
          ? "Spring Semester 2024 Exchange"
          : "Exchange Program",
    description:
      "Select your preferred universities for this semester's exchange program. You can choose up to the maximum number of universities allowed for this program.",
    semester: params.id.includes("fall") ? "Fall" : "Spring",
    year: params.id.includes("2023") ? 2023 : params.id.includes("2024") ? 2024 : 2025,
    maxSelections: params.id === "spring-2024" ? 3 : 2,
    status: ElectivePackStatus.PUBLISHED,
    startDate: params.id.includes("fall") ? "2023-08-01" : "2024-01-10",
    endDate: params.id.includes("fall") ? "2023-08-15" : "2024-01-25",
    universitiesCount: params.id === "spring-2024" ? 8 : 6,
    studentsEnrolled: params.id === "fall-2023" ? 42 : params.id === "spring-2024" ? 28 : 0,
    createdAt: params.id.includes("fall") ? "2023-07-01" : "2023-12-01",
  }

  // Mock universities data for this exchange program
  const universities = [
    {
      id: "1",
      name: "University of Amsterdam",
      description: "One of the largest research universities in Europe with a rich academic tradition.",
      country: "Netherlands",
      city: "Amsterdam",
      language: "English, Dutch",
      maxStudents: 5,
      currentStudents: 3,
      website: "https://www.uva.nl/en",
      academicYear: 2,
      semester: exchangeProgram.semester,
      year: exchangeProgram.year,
      degree: "Bachelor",
      programs: ["Management", "International Management"],
    },
    {
      id: "2",
      name: "HEC Paris",
      description: "One of Europe's leading business schools with a strong focus on management education.",
      country: "France",
      city: "Paris",
      language: "English, French",
      maxStudents: 4,
      currentStudents: 4,
      website: "https://www.hec.edu/en",
      academicYear: 2,
      semester: exchangeProgram.semester,
      year: exchangeProgram.year,
      degree: "Bachelor",
      programs: ["Management", "International Management"],
    },
    {
      id: "3",
      name: "Copenhagen Business School",
      description: "One of the largest business schools in Europe with a broad range of programs.",
      country: "Denmark",
      city: "Copenhagen",
      language: "English, Danish",
      maxStudents: 6,
      currentStudents: 2,
      website: "https://www.cbs.dk/en",
      academicYear: 2,
      semester: exchangeProgram.semester,
      year: exchangeProgram.year,
      degree: "Bachelor",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "4",
      name: "Bocconi University",
      description: "A private university in Milan, Italy, specializing in economics, management, and finance.",
      country: "Italy",
      city: "Milan",
      language: "English, Italian",
      maxStudents: 5,
      currentStudents: 5,
      website: "https://www.unibocconi.eu/",
      academicYear: 2,
      semester: exchangeProgram.semester,
      year: exchangeProgram.year,
      degree: "Bachelor",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "5",
      name: "Vienna University of Economics and Business",
      description:
        "One of Europe's largest business universities focusing on business, economics, and social sciences.",
      country: "Austria",
      city: "Vienna",
      language: "English, German",
      maxStudents: 4,
      currentStudents: 2,
      website: "https://www.wu.ac.at/en/",
      academicYear: 2,
      semester: exchangeProgram.semester,
      year: exchangeProgram.year,
      degree: "Bachelor",
      programs: ["International Management"],
    },
    {
      id: "6",
      name: "Stockholm School of Economics",
      description: "A private business school with a strong international presence and research focus.",
      country: "Sweden",
      city: "Stockholm",
      language: "English, Swedish",
      maxStudents: 3,
      currentStudents: 2,
      website: "https://www.hhs.se/en/",
      academicYear: 2,
      semester: exchangeProgram.semester,
      year: exchangeProgram.year,
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
      selectedUniversities: ["University of Amsterdam", "Copenhagen Business School"],
      selectionDate: "2023-08-05",
      status: SelectionStatus.APPROVED,
    },
    {
      id: "2",
      studentName: "Maria Petrova",
      studentId: "st123457",
      group: "23.B12-vshm",
      program: "Management",
      selectedUniversities: ["HEC Paris", "Stockholm School of Economics"],
      selectionDate: "2023-08-06",
      status: SelectionStatus.APPROVED,
    },
    {
      id: "3",
      studentName: "Ivan Sokolov",
      studentId: "st123458",
      group: "23.B12-vshm",
      program: "Management",
      selectedUniversities: ["Bocconi University", "Vienna University of Economics and Business"],
      selectionDate: "2023-08-07",
      status: SelectionStatus.PENDING,
    },
    {
      id: "4",
      studentName: "Elena Ivanova",
      studentId: "st123459",
      group: "23.B11-vshm",
      program: "International Management",
      selectedUniversities: ["University of Amsterdam", "Vienna University of Economics and Business"],
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
              <h1 className="text-3xl font-bold tracking-tight">{exchangeProgram.name}</h1>
              <p className="text-muted-foreground">
                {exchangeProgram.semester} {exchangeProgram.year} • Max Selections: {exchangeProgram.maxSelections}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(exchangeProgram.status)}
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit Program
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium">Selection Period:</dt>
                  <dd>
                    {formatDate(exchangeProgram.startDate)} - {formatDate(exchangeProgram.endDate)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Max Selections:</dt>
                  <dd>{exchangeProgram.maxSelections} universities</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Universities:</dt>
                  <dd>{exchangeProgram.universitiesCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Students Enrolled:</dt>
                  <dd>{exchangeProgram.studentsEnrolled}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Created:</dt>
                  <dd>{formatDate(exchangeProgram.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Status:</dt>
                  <dd>{exchangeProgram.status}</dd>
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
                    <span className="text-sm font-medium">{exchangeProgram.studentsEnrolled} students</span>
                  </div>
                  <Progress value={exchangeProgram.studentsEnrolled > 0 ? 75 : 0} className="h-2" />
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

        <Tabs defaultValue="universities">
          <TabsList>
            <TabsTrigger value="universities">Universities</TabsTrigger>
            <TabsTrigger value="students">Student Selections</TabsTrigger>
          </TabsList>
          <TabsContent value="universities" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Universities in this Program</CardTitle>
                  <CardDescription>Manage the universities available in this exchange program</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add University
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add University to Program</DialogTitle>
                      <DialogDescription>Select universities to add to this exchange program.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="search"
                            placeholder="Search universities..."
                            className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {universities.map((university) => (
                          <div
                            key={university.id}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted"
                          >
                            <Checkbox id={`university-${university.id}`} />
                            <div>
                              <label
                                htmlFor={`university-${university.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {university.name}
                              </label>
                              <p className="text-xs text-muted-foreground">
                                {university.city}, {university.country}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Add Selected Universities</Button>
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
                        <th className="py-3 px-4 text-left text-sm font-medium">Location</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Language</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Enrollment</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Programs</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {universities.map((university) => (
                        <tr key={university.id} className="border-b">
                          <td className="py-3 px-4 text-sm">{university.name}</td>
                          <td className="py-3 px-4 text-sm">
                            {university.city}, {university.country}
                          </td>
                          <td className="py-3 px-4 text-sm">{university.language}</td>
                          <td className="py-3 px-4 text-sm">
                            <Badge
                              variant={
                                university.currentStudents >= university.maxStudents ? "destructive" : "secondary"
                              }
                            >
                              {university.currentStudents}/{university.maxStudents}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex flex-wrap gap-1">
                              {university.programs.map((program, index) => (
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
                  <CardDescription>Manage student selections for this exchange program</CardDescription>
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
                        <th className="py-3 px-4 text-left text-sm font-medium">Selected Universities</th>
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
                              {selection.selectedUniversities.map((university, index) => (
                                <span key={index} className="text-xs">
                                  {university}
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
