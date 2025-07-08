"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Users, Edit, Eye, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useCachedManagerProfile } from "@/hooks/use-cached-manager-profile"
import { useSession } from "@/lib/session"

interface Course {
  id: string
  name: string
  description: string
  instructor: string
  schedule: string
  location: string
  max_students: number
  current_students: number
}

interface ElectivePack {
  id: string
  name: string
  description: string
  courses: Course[]
  max_selections: number
  selection_deadline: string
  status: string
  created_at: string
  updated_at: string
}

interface StudentSelection {
  id: string
  student_id: string
  selected_ids: string[]
  status: string
  created_at: string
  updated_at: string
  student: {
    full_name: string
    email: string
    group: {
      name: string
    }
  }
}

export default function ManagerCoursePackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { user } = useSession()
  const { profile } = useCachedManagerProfile(user?.id)

  const [pack, setPack] = useState<ElectivePack | null>(null)
  const [selections, setSelections] = useState<StudentSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectionsLoading, setSelectionsLoading] = useState(true)

  useEffect(() => {
    if (packId && profile?.institution_id) {
      fetchPackDetails()
      fetchSelections()
    }
  }, [packId, profile?.institution_id])

  const fetchPackDetails = async () => {
    try {
      setLoading(true)

      // Fetch elective course pack details
      const { data: packData, error: packError } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", packId)
        .eq("institution_id", profile?.institution_id)
        .single()

      if (packError) throw packError

      if (!packData) {
        toast({
          title: "Error",
          description: "Course pack not found",
          variant: "destructive",
        })
        router.push("/manager/electives/course")
        return
      }

      // Fetch courses with enrollment counts
      const coursesWithEnrollment = await Promise.all(
        (packData.courses || []).map(async (course: any) => {
          // Count pending and approved selections for this course
          const { count, error: countError } = await supabase
            .from("course_selections")
            .select("*", { count: "exact", head: true })
            .eq("elective_courses_id", packId)
            .contains("selected_ids", [course.id])
            .in("status", ["pending", "approved"])

          if (countError) {
            console.error("Error counting enrollments:", countError)
            return { ...course, current_students: 0 }
          }

          return {
            ...course,
            current_students: count || 0,
          }
        }),
      )

      setPack({
        ...packData,
        courses: coursesWithEnrollment,
      })
    } catch (error: any) {
      console.error("Error fetching pack details:", error)
      toast({
        title: "Error",
        description: "Failed to load course pack details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSelections = async () => {
    try {
      setSelectionsLoading(true)

      const { data: selectionsData, error: selectionsError } = await supabase
        .from("course_selections")
        .select(`
          *,
          student:profiles!course_selections_student_id_fkey(
            full_name,
            email,
            group:groups(name)
          )
        `)
        .eq("elective_courses_id", packId)
        .order("created_at", { ascending: false })

      if (selectionsError) throw selectionsError

      setSelections(selectionsData || [])
    } catch (error: any) {
      console.error("Error fetching selections:", error)
      toast({
        title: "Error",
        description: "Failed to load student selections",
        variant: "destructive",
      })
    } finally {
      setSelectionsLoading(false)
    }
  }

  const updateSelectionStatus = async (selectionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("course_selections")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectionId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Selection ${newStatus} successfully`,
      })

      // Refresh data to update counts
      fetchSelections()
      fetchPackDetails()
    } catch (error: any) {
      console.error("Error updating selection status:", error)
      toast({
        title: "Error",
        description: "Failed to update selection status",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            Approved
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Pack Not Found</h1>
          <Button onClick={() => router.push("/manager/electives/course")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course Electives
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/manager/electives/course")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course Electives
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/manager/electives/course/${pack.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Pack
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{pack.name}</CardTitle>
              <CardDescription className="mt-2">{pack.description}</CardDescription>
            </div>
            <Badge variant={pack.status === "published" ? "default" : "secondary"}>{pack.status}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <span className="text-muted-foreground">Max Selections:</span>
              <p className="font-medium">{pack.max_selections}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Selection Deadline:</span>
              <p className="font-medium">{new Date(pack.selection_deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">{new Date(pack.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <p className="font-medium">{new Date(pack.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">Courses ({pack.courses.length})</TabsTrigger>
          <TabsTrigger value="selections">Student Selections ({selections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {pack.courses.map((course) => {
              const isFull = course.current_students >= course.max_students
              const utilizationPercentage = (course.current_students / course.max_students) * 100

              return (
                <Card key={course.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4" />
                        <span className={isFull ? "text-red-500 font-medium" : ""}>
                          {course.current_students}/{course.max_students}
                        </span>
                      </div>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Instructor:</strong> {course.instructor}
                        </div>
                        <div>
                          <strong>Schedule:</strong> {course.schedule}
                        </div>
                        <div>
                          <strong>Location:</strong> {course.location}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Enrollment</span>
                          <span>{utilizationPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              utilizationPercentage >= 100
                                ? "bg-red-500"
                                : utilizationPercentage >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <Badge variant={isFull ? "destructive" : "outline"}>{isFull ? "Full" : "Available"}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="selections" className="space-y-4">
          {selectionsLoading ? (
            <div className="text-center py-8">Loading selections...</div>
          ) : selections.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p>No student selections yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Student Selections</CardTitle>
                <CardDescription>Manage and review student course selections</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Selected Courses</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selections.map((selection) => (
                      <TableRow key={selection.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{selection.student.full_name}</div>
                            <div className="text-sm text-muted-foreground">{selection.student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{selection.student.group?.name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {selection.selected_ids.map((courseId) => {
                              const course = pack.courses.find((c) => c.id === courseId)
                              return course ? (
                                <Badge key={courseId} variant="outline" className="mr-1">
                                  {course.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(selection.status)}
                            {getStatusBadge(selection.status)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(selection.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {selection.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateSelectionStatus(selection.id, "approved")}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateSelectionStatus(selection.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
