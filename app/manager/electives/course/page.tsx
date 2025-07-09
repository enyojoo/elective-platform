"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreVertical, Edit, Eye, Trash2, Archive, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataCache } from "@/lib/data-cache-context"
import { formatDate } from "@/lib/utils"

interface ElectiveCourse {
  id: string
  name: string
  name_ru: string | null
  status: string
  deadline: string | null
  created_at: string
  updated_at: string
  max_selections: number
  semester: string | null
  academic_year: string | null
  syllabus_template_url: string | null
  courses: string[] | null
  course_count?: number
}

export default function ManagerCourseElectivesPage() {
  const [electiveCourses, setElectiveCourses] = useState<ElectiveCourse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()

  useEffect(() => {
    if (institution?.id) {
      loadElectiveCourses()
    }
  }, [institution?.id])

  const loadElectiveCourses = async () => {
    if (!institution?.id) return

    setIsLoading(true)
    try {
      // Try to get cached data first
      const cacheKey = `coursePrograms_${institution.id}`
      const cachedData = getCachedData(cacheKey)

      if (cachedData) {
        setElectiveCourses(cachedData)
        setIsLoading(false)
        return
      }

      console.log("Fetching course electives for institution:", institution.id)

      const { data, error } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("institution_id", institution.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching elective courses:", error)
        throw error
      }

      const coursesWithCounts = (data || []).map((course) => ({
        ...course,
        course_count: course.courses?.length || 0,
      }))

      console.log("Course electives loaded:", coursesWithCounts)
      setElectiveCourses(coursesWithCounts)
      setCachedData(cacheKey, coursesWithCounts)
    } catch (error) {
      console.error("Error loading elective courses:", error)
      toast({
        title: "Error",
        description: "Failed to load course electives",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get status badge
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

  // Handle status change
  const handleStatusChange = async (courseId: string, newStatus: string, courseName: string) => {
    try {
      const { error } = await supabase
        .from("elective_courses")
        .update({ status: newStatus })
        .eq("id", courseId)
        .eq("institution_id", institution?.id)

      if (error) throw error

      // Update local state
      setElectiveCourses((prev) =>
        prev.map((course) => (course.id === courseId ? { ...course, status: newStatus } : course)),
      )

      // Invalidate cache
      if (institution?.id) {
        invalidateCache(`coursePrograms_${institution.id}`)
      }

      toast({
        title: "Status updated",
        description: `${courseName} status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      })
    }
  }

  // Handle delete
  const handleDelete = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from("elective_courses")
        .delete()
        .eq("id", courseId)
        .eq("institution_id", institution?.id)

      if (error) throw error

      // Update local state
      setElectiveCourses((prev) => prev.filter((course) => course.id !== courseId))

      // Invalidate cache
      if (institution?.id) {
        invalidateCache(`coursePrograms_${institution.id}`)
      }

      toast({
        title: "Course deleted",
        description: `${courseName} has been deleted`,
      })
    } catch (error) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  // Filter courses based on search term and active tab
  const filteredCourses = electiveCourses.filter((course) => {
    const matchesSearch =
      !searchTerm ||
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.name_ru && course.name_ru.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "draft" && course.status === "draft") ||
      (activeTab === "published" && course.status === "published") ||
      (activeTab === "closed" && course.status === "closed") ||
      (activeTab === "archived" && course.status === "archived")

    return matchesSearch && matchesTab
  })

  // Get course counts for tabs
  const courseCounts = {
    all: electiveCourses.length,
    draft: electiveCourses.filter((c) => c.status === "draft").length,
    published: electiveCourses.filter((c) => c.status === "published").length,
    closed: electiveCourses.filter((c) => c.status === "closed").length,
    archived: electiveCourses.filter((c) => c.status === "archived").length,
  }

  const getLocalizedName = (course: ElectiveCourse) => {
    if (language === "ru" && course.name_ru) {
      return course.name_ru
    }
    return course.name
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Electives</h1>
          <p className="text-muted-foreground">Manage elective courses for students</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search courses..."
                  className="pl-8 md:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link href="/manager/electives/course-builder">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course Elective
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({courseCounts.all})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({courseCounts.draft})</TabsTrigger>
                <TabsTrigger value="published">Published ({courseCounts.published})</TabsTrigger>
                <TabsTrigger value="closed">Closed ({courseCounts.closed})</TabsTrigger>
                <TabsTrigger value="archived">Archived ({courseCounts.archived})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredCourses.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm ? "No courses found" : "No course electives yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first course elective to get started"}
                    </p>
                    {!searchTerm && (
                      <Button asChild>
                        <Link href="/manager/electives/course-builder">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Course Elective
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">Course Name</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Deadline</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Courses</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Max Selections</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Created</th>
                          <th className="py-3 px-4 text-center text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCourses.map((course) => (
                          <tr key={course.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">
                              <Link
                                href={`/manager/electives/course/${course.id}`}
                                className="font-medium hover:underline"
                              >
                                {getLocalizedName(course)}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-sm">{getStatusBadge(course.status)}</td>
                            <td className="py-3 px-4 text-sm">
                              {course.deadline ? (
                                formatDate(course.deadline)
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm">{course.course_count || 0}</td>
                            <td className="py-3 px-4 text-sm">{course.max_selections}</td>
                            <td className="py-3 px-4 text-sm">{formatDate(course.created_at)}</td>
                            <td className="py-3 px-4 text-sm text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manager/electives/course/${course.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manager/electives/course/${course.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  {course.status === "published" && (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleStatusChange(course.id, "closed", getLocalizedName(course))}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Close
                                    </DropdownMenuItem>
                                  )}
                                  {course.status === "closed" && (
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() =>
                                        handleStatusChange(course.id, "published", getLocalizedName(course))
                                      }
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Reopen Course
                                    </DropdownMenuItem>
                                  )}
                                  {(course.status === "draft" || course.status === "closed") && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(course.id, "archived", getLocalizedName(course))
                                      }
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(course.id, getLocalizedName(course))}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
