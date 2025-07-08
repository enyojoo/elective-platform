import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Clock, MapPin, Users, BookOpen, Calendar, GraduationCap } from "lucide-react"
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

interface ElectivePack {
  id: string
  name: string
  description: string | null
  max_selections: number
  selection_deadline: string | null
  courses: Course[]
}

async function getElectivePack(packId: string): Promise<ElectivePack | null> {
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

    // Get courses for this pack with enrollment counts
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
      .order("name")

    if (coursesError) {
      console.error("Error fetching courses:", coursesError)
      return null
    }

    // Get enrollment counts for each course
    const coursesWithEnrollment = await Promise.all(
      (courses || []).map(async (course) => {
        const { count } = await supabase
          .from("student_course_selections")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id)
          .in("status", ["pending", "approved"])

        const currentEnrollment = count || 0
        const isFull = currentEnrollment >= course.max_students

        return {
          ...course,
          current_enrollment: currentEnrollment,
          is_full: isFull,
        }
      }),
    )

    return {
      ...pack,
      courses: coursesWithEnrollment,
    }
  } catch (error) {
    console.error("Error in getElectivePack:", error)
    return null
  }
}

export default async function CoursePackPage({ params }: { params: { packId: string } }) {
  const pack = await getElectivePack(params.packId)

  if (!pack) {
    notFound()
  }

  const availableCourses = pack.courses.filter((course) => !course.is_full)
  const fullCourses = pack.courses.filter((course) => course.is_full)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/student/courses" className="hover:text-foreground">
            Course Electives
          </Link>
          <span>/</span>
          <span>{pack.name}</span>
        </div>
        <h1 className="text-3xl font-bold">{pack.name}</h1>
        {pack.description && <p className="text-muted-foreground">{pack.description}</p>}
      </div>

      {/* Pack Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Selection Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Maximum Selections: <strong>{pack.max_selections}</strong>
              </span>
            </div>
            {pack.selection_deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Deadline: <strong>{new Date(pack.selection_deadline).toLocaleDateString()}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Total Courses: <strong>{pack.courses.length}</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Courses */}
      {availableCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Available Courses</h2>
          <div className="grid gap-4">
            {availableCourses.map((course) => (
              <CourseCard key={course.id} course={course} packId={params.packId} />
            ))}
          </div>
        </div>
      )}

      {/* Full Courses */}
      {fullCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-muted-foreground">Full Courses</h2>
          <div className="grid gap-4">
            {fullCourses.map((course) => (
              <CourseCard key={course.id} course={course} packId={params.packId} disabled />
            ))}
          </div>
        </div>
      )}

      {pack.courses.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No courses available in this pack.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CourseCard({ course, packId, disabled = false }: { course: Course; packId: string; disabled?: boolean }) {
  const enrollmentPercentage = (course.current_enrollment / course.max_students) * 100

  return (
    <Card className={disabled ? "opacity-60" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {course.name}
              <Badge variant="outline">{course.code}</Badge>
              {disabled && <Badge variant="destructive">Full</Badge>}
            </CardTitle>
            <CardDescription>{course.description}</CardDescription>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-medium">{course.credits} Credits</div>
            <div className="text-xs text-muted-foreground">
              {course.current_enrollment}/{course.max_students} enrolled
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Course Details */}
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

        <div className="flex justify-end">
          <Button asChild disabled={disabled} variant={disabled ? "outline" : "default"}>
            <Link href={`/student/courses/${packId}/select?courseId=${course.id}`}>
              {disabled ? "Course Full" : "Select Course"}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
