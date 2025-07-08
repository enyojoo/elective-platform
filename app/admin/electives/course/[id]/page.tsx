import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, MapPin, Users, BookOpen, Calendar, GraduationCap, Edit, Eye } from "lucide-react"
import Link from "next/link"

interface Course {
  id: string
  name: string
  code: string
  credits: number
  description: string | null
  max_students: number
  current_enrollment: number
  semester: string
  year: string
  schedule: string | null
  location: string | null
  instructor: string | null
  prerequisites: string | null
  is_full: boolean
}

interface StudentSelection {
  id: string
  status: string
  created_at: string
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    student_id: string
  }
}

interface ElectivePack {
  id: string
  name: string
  description: string | null
  max_selections: number
  selection_deadline: string | null
  course: Course
  student_selections: StudentSelection[]
}

async function getCourseElectivePack(packId: string): Promise<ElectivePack | null> {
  try {
    // Get the elective pack
    const { data: pack, error: packError } = await supabase
      .from("elective_packs")
      .select("*")
      .eq("id", packId)
      .eq("type", "course")
      .single()

    if (packError || !pack) {
      console.error("Error fetching elective pack:", packError)
      return null
    }

    // Get the course for this pack
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select(`
        id,
        name,
        code,
        credits,
        description,
        max_students,
        semester,
        year,
        schedule,
        location,
        instructor,
        prerequisites
      `)
      .eq("elective_pack_id", packId)
      .single()

    if (coursesError || !courses) {
      console.error("Error fetching course:", coursesError)
      return null
    }

    // Get student selections for this course
    const { data: selections, error: selectionsError } = await supabase
      .from("student_course_selections")
      .select(`
        id,
        status,
        created_at,
        profiles!inner (
          id,
          first_name,
          last_name,
          email,
          student_id
        )
      `)
      .eq("course_id", courses.id)
      .order("created_at", { ascending: false })

    if (selectionsError) {
      console.error("Error fetching selections:", selectionsError)
      return null
    }

    // Count current enrollment (pending + approved)
    const currentEnrollment = selections?.filter((s) => s.status === "pending" || s.status === "approved").length || 0

    const courseWithEnrollment = {
      ...courses,
      current_enrollment: currentEnrollment,
      is_full: currentEnrollment >= courses.max_students,
    }

    const studentSelections =
      selections?.map((selection) => ({
        id: selection.id,
        status: selection.status,
        created_at: selection.created_at,
        student: {
          id: selection.profiles.id,
          first_name: selection.profiles.first_name,
          last_name: selection.profiles.last_name,
          email: selection.profiles.email,
          student_id: selection.profiles.student_id,
        },
      })) || []

    return {
      ...pack,
      course: courseWithEnrollment,
      student_selections: studentSelections,
    }
  } catch (error) {
    console.error("Error in getCourseElectivePack:", error)
    return null
  }
}

export default async function AdminCourseElectivePackPage({ params }: { params: { id: string } }) {
  const pack = await getCourseElectivePack(params.id)

  if (!pack) {
    notFound()
  }

  const course = pack.course
  const enrollmentPercentage = (course.current_enrollment / course.max_students) * 100

  const pendingSelections = pack.student_selections.filter((s) => s.status === "pending")
  const approvedSelections = pack.student_selections.filter((s) => s.status === "approved")
  const rejectedSelections = pack.student_selections.filter((s) => s.status === "rejected")

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/admin/electives/course" className="hover:text-foreground">
              Course Electives
            </Link>
            <span>/</span>
            <span>{pack.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{pack.name}</h1>
          {pack.description && <p className="text-muted-foreground">{pack.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/electives/course/${params.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Pack
            </Link>
          </Button>
        </div>
      </div>

      {/* Course Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{course.name}</h3>
                <Badge variant="outline">{course.code}</Badge>
                {course.is_full && <Badge variant="destructive">Full</Badge>}
              </div>
              {course.description && <p className="text-muted-foreground">{course.description}</p>}
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm font-medium">{course.credits} Credits</div>
              <div className="text-xs text-muted-foreground">
                {course.current_enrollment}/{course.max_students} enrolled
              </div>
            </div>
          </div>

          {/* Enrollment Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Enrollment</span>
              <span className={enrollmentPercentage >= 100 ? "text-red-600" : "text-muted-foreground"}>
                {Math.round(enrollmentPercentage)}%
              </span>
            </div>
            <Progress
              value={enrollmentPercentage}
              className={`h-2 ${enrollmentPercentage >= 100 ? "[&>div]:bg-red-500" : ""}`}
            />
          </div>

          {/* Course Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {course.semester && course.year && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {course.semester} {course.year}
                </span>
              </div>
            )}
            {course.schedule && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{course.schedule}</span>
              </div>
            )}
            {course.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{course.location}</span>
              </div>
            )}
            {course.instructor && (
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>{course.instructor}</span>
              </div>
            )}
          </div>

          {course.prerequisites && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Prerequisites:</div>
              <div className="text-sm text-muted-foreground">{course.prerequisites}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{pack.student_selections.length}</div>
            <div className="text-sm text-muted-foreground">Total Applications</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingSelections.length}</div>
            <div className="text-sm text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{approvedSelections.length}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{rejectedSelections.length}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Selections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student Selections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pack.student_selections.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pack.student_selections.map((selection) => (
                  <TableRow key={selection.id}>
                    <TableCell className="font-medium">
                      {selection.student.first_name} {selection.student.last_name}
                    </TableCell>
                    <TableCell>{selection.student.student_id}</TableCell>
                    <TableCell>{selection.student.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          selection.status === "approved"
                            ? "default"
                            : selection.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {selection.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(selection.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/${selection.student.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No student selections yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
