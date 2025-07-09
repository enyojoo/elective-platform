"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, Search, CheckCircle, XCircle, Clock } from "lucide-react"
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

export default function ElectiveCourseDetailPage({ params }: ElectiveCourseDetailPageProps) {
  const [electiveCourse, setElectiveCourse] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [studentSelections, setStudentSelections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

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

      // Load courses if they exist
      if (program?.courses && Array.isArray(program.courses) && program.courses.length > 0) {
        const { data: coursesData, error: coursesError } = await supabase
          .from("courses")
          .select("*")
          .in("id", program.courses)

        if (!coursesError && coursesData) {
          setCourses(coursesData)
        }
      }

      // Load student selections
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

      if (!selectionsError && selections) {
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
        return <Badge variant="outline">Draft</Badge>
      case "published":
        return <Badge variant="secondary">Published</Badge>
      case "closed":
        return <Badge variant="destructive">Closed</Badge>
      case "archived":
        return <Badge variant="default">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSelectionStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800">
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
            <TabsTrigger value="courses">Courses ({courses.length})</TabsTrigger>
            <TabsTrigger value="students">Student Selections ({studentSelections.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Courses in this Program</CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No courses found for this program</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Code</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Enrollment</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => {
                          const currentEnrollment = getCourseEnrollment(course.id)
                          return (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium">
                                {language === "ru" && course.name_ru ? course.name_ru : course.name}
                              </TableCell>
                              <TableCell>{course.code}</TableCell>
                              <TableCell>{course.credits}</TableCell>
                              <TableCell>{course.instructor || "N/A"}</TableCell>
                              <TableCell>
                                <Badge variant={currentEnrollment >= course.max_students ? "destructive" : "secondary"}>
                                  {currentEnrollment}/{course.max_students}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{course.status}</Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
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
                    <input
                      type="search"
                      placeholder="Search students..."
                      className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStudentSelections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No students found matching your search" : "No student selections yet"}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>Selection Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Selected Courses</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStudentSelections.map((selection) => {
                          const studentProfile = selection.profiles
                          const groupInfo = studentProfile?.student_profiles?.[0]?.groups

                          return (
                            <TableRow key={selection.id}>
                              <TableCell className="font-medium">{studentProfile?.full_name || "N/A"}</TableCell>
                              <TableCell>{studentProfile?.email || "N/A"}</TableCell>
                              <TableCell>{groupInfo?.display_name || "N/A"}</TableCell>
                              <TableCell>{formatDate(selection.created_at)}</TableCell>
                              <TableCell>{getSelectionStatusBadge(selection.status)}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {(selection.selected_ids || []).map((courseId: string) => {
                                    const course = courses.find((c) => c.id === courseId)
                                    return (
                                      <div key={courseId} className="text-sm">
                                        {course
                                          ? language === "ru" && course.name_ru
                                            ? course.name_ru
                                            : course.name
                                          : "Unknown Course"}
                                      </div>
                                    )
                                  })}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {selection.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 hover:text-green-700 bg-transparent"
                                        onClick={() =>
                                          handleStatusChange(
                                            selection.id,
                                            "approved",
                                            studentProfile?.full_name || "Student",
                                          )
                                        }
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:text-red-700 bg-transparent"
                                        onClick={() =>
                                          handleStatusChange(
                                            selection.id,
                                            "rejected",
                                            studentProfile?.full_name || "Student",
                                          )
                                        }
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {selection.status === "approved" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 bg-transparent"
                                      onClick={() =>
                                        handleStatusChange(
                                          selection.id,
                                          "rejected",
                                          studentProfile?.full_name || "Student",
                                        )
                                      }
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />
    </DashboardLayout>
  )
}
