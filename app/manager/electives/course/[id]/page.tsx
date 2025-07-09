"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Users, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"

interface ElectiveCourse {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  status: string
  deadline: string | null
  created_at: string
  updated_at: string
  max_selections: number
  semester: string | null
  academic_year: string | null
  syllabus_template_url: string | null
  courses: string[] | null
  institution_id: string
}

export default function CourseElectiveDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [course, setCourse] = useState<ElectiveCourse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()

  useEffect(() => {
    if (courseId && institution?.id) {
      loadCourseDetails()
    }
  }, [courseId, institution?.id])

  const loadCourseDetails = async () => {
    if (!courseId || !institution?.id) return

    setIsLoading(true)
    try {
      console.log("Fetching course details for ID:", courseId)

      const { data, error } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("id", courseId)
        .eq("institution_id", institution.id)
        .single()

      if (error) {
        console.error("Error fetching course details:", error)
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        })
        return
      }

      if (!data) {
        toast({
          title: "Not Found",
          description: "Course not found",
          variant: "destructive",
        })
        router.push("/manager/electives/course")
        return
      }

      setCourse(data)
    } catch (error) {
      console.error("Error loading course details:", error)
      toast({
        title: "Error",
        description: "Failed to load course details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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

  const getLocalizedName = (course: ElectiveCourse) => {
    if (language === "ru" && course.name_ru) {
      return course.name_ru
    }
    return course.name
  }

  const getLocalizedDescription = (course: ElectiveCourse) => {
    if (language === "ru" && course.description_ru) {
      return course.description_ru
    }
    return course.description
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">Course not found</h3>
          <p className="text-muted-foreground mb-4">The course you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/manager/electives/course">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course Electives
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/manager/electives/course">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{getLocalizedName(course)}</h1>
              <p className="text-muted-foreground">Course elective details and management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(course.status)}
            <Button asChild>
              <Link href={`/manager/electives/course/${course.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Course
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{course.name}</p>
              </div>
              {course.name_ru && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name (Russian)</label>
                  <p className="text-sm">{course.name_ru}</p>
                </div>
              )}
              {getLocalizedDescription(course) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{getLocalizedDescription(course)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">{getStatusBadge(course.status)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Course Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Deadline</label>
                <p className="text-sm">{course.deadline ? formatDate(course.deadline) : "No deadline set"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Max Selections</label>
                <p className="text-sm">{course.max_selections}</p>
              </div>
              {course.semester && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Semester</label>
                  <p className="text-sm">{course.semester}</p>
                </div>
              )}
              {course.academic_year && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Academic Year</label>
                  <p className="text-sm">{course.academic_year}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Available Courses</label>
                <p className="text-sm">{course.courses?.length || 0} courses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Course Management
            </CardTitle>
            <CardDescription>Manage student selections and course availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Total Selections</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-muted-foreground">Pending Approvals</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{course.courses?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Available Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Creation Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{formatDate(course.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm">{formatDate(course.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {course.syllabus_template_url && (
            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href={course.syllabus_template_url} target="_blank" rel="noopener noreferrer">
                    Download Syllabus Template
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
