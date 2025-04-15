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

interface ExchangeProgramDetailPageProps {
  params: {
    id: string
  }
}

export default function AdminExchangeDetailPage({ params }: ExchangeProgramDetailPageProps) {
  // State for dialog
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Add the language hook near the top of the component
  const { t, language } = useLanguage()

  // Helper function to get formatted exchange program name
  const getExchangeProgramName = (id: string) => {
    if (id.includes("fall-2023")) return "Fall Semester 2023 Exchange"
    if (id.includes("spring-2023")) return "Spring Semester 2023 Exchange"
    if (id.includes("fall-2024")) return "Fall Semester 2024 Exchange"
    if (id.includes("spring-2024")) return "Spring Semester 2024 Exchange"

    // Extract season and year from ID
    const seasonMatch = id.match(/(spring|fall|winter|summer)/i)
    const yearMatch = id.match(/20\d\d/)

    if (seasonMatch && yearMatch) {
      const season = seasonMatch[0].charAt(0).toUpperCase() + seasonMatch[0].slice(1).toLowerCase()
      return `${season} Semester ${yearMatch[0]} Exchange`
    }

    return "Exchange Program" // Default if no pattern is found
  }

  // Mock exchange program data
  const exchangeProgram = {
    id: params.id,
    name: getExchangeProgramName(params.id),
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
      email: "alex.johnson@student.gsom.spbu.ru",
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
      email: "maria.petrova@student.gsom.spbu.ru",
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
      email: "ivan.sokolov@student.gsom.spbu.ru",
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
      email: "elena.ivanova@student.gsom.spbu.ru",
      selectedUniversities: ["University of Amsterdam", "Vienna University of Economics and Business"],
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
            <Link href="/admin/electives?tab=exchange">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{exchangeProgram.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">{getStatusBadge(exchangeProgram.status)}</div>
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
              {/* Update the status display in the program details card */}
              <div className="flex justify-between">
                <dt className="font-medium">Status:</dt>
                <dd>{t(`manager.status.${exchangeProgram.status.toLowerCase()}`)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Tabs defaultValue="universities">
          <TabsList>
            <TabsTrigger value="universities">Universities</TabsTrigger>
            <TabsTrigger value="students">Student Selections</TabsTrigger>
          </TabsList>
          <TabsContent value="universities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Universities</CardTitle>
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
                <DialogDescription>
                  View details for {selectedStudent.studentName}'s exchange selection
                </DialogDescription>
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
                    <h3 className="text-sm font-medium">Selected Universities</h3>
                    <div className="mt-2 space-y-2">
                      {selectedStudent.selectedUniversities.map((university: string, index: number) => (
                        <div key={index} className="rounded-md border p-2">
                          <p className="font-medium">{university}</p>
                          <p className="text-xs text-muted-foreground">
                            {universities.find((u) => u.name === university)?.city},{" "}
                            {universities.find((u) => u.name === university)?.country}
                          </p>
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
