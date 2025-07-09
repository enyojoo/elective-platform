"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreVertical, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface ElectiveCourse {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  deadline: string
  max_selections: number
  status: string
  created_at: string
  updated_at: string
  institution_id: string
}

export default function CourseElectivesPage() {
  const [electiveCourses, setElectiveCourses] = useState<ElectiveCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadElectiveCourses()
  }, [institution?.id])

  const loadElectiveCourses = async () => {
    if (!institution?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("institution_id", institution.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching course electives:", error)
        toast({
          title: "Error",
          description: "Failed to load course electives",
          variant: "destructive",
        })
        return
      }

      setElectiveCourses(data || [])
    } catch (error) {
      console.error("Error loading course electives:", error)
      toast({
        title: "Error",
        description: "Failed to load course electives",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (courseId: string, newStatus: string, courseName: string) => {
    try {
      const { error } = await supabase.from("elective_courses").update({ status: newStatus }).eq("id", courseId)

      if (error) {
        console.error("Error updating course status:", error)
        toast({
          title: "Error",
          description: "Failed to update course status",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setElectiveCourses((prev) =>
        prev.map((course) => (course.id === courseId ? { ...course, status: newStatus } : course)),
      )

      toast({
        title: "Success",
        description: `Course "${courseName}" ${newStatus === "closed" ? "closed" : "reopened"} successfully`,
      })
    } catch (error) {
      console.error("Error updating course status:", error)
      toast({
        title: "Error",
        description: "Failed to update course status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (courseId: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.from("elective_courses").delete().eq("id", courseId)

      if (error) {
        console.error("Error deleting course:", error)
        toast({
          title: "Error",
          description: "Failed to delete course",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setElectiveCourses((prev) => prev.filter((course) => course.id !== courseId))

      toast({
        title: "Success",
        description: `Course "${courseName}" deleted successfully`,
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
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.name_ru && course.name_ru.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.description_ru && course.description_ru.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab = activeTab === "all" || course.status === activeTab

    return matchesSearch && matchesTab
  })

  // Get counts for each status
  const statusCounts = {
    all: electiveCourses.length,
    draft: electiveCourses.filter((c) => c.status === "draft").length,
    published: electiveCourses.filter((c) => c.status === "published").length,
    closed: electiveCourses.filter((c) => c.status === "closed").length,
    archived: electiveCourses.filter((c) => c.status === "archived").length,
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Electives</h1>
          <p className="text-muted-foreground">Manage course electives and student selections</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search courses..."
                className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/manager/electives/course/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Course Elective
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all" className="relative">
                  All
                  {statusCounts.all > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="draft" className="relative">
                  Draft
                  {statusCounts.draft > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.draft}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="published" className="relative">
                  Published
                  {statusCounts.published > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.published}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="closed" className="relative">
                  Closed
                  {statusCounts.closed > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.closed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archived" className="relative">
                  Archived
                  {statusCounts.archived > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.archived}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-8">
                    {searchTerm ? (
                      <div>
                        <p className="text-muted-foreground mb-4">No courses found matching your search</p>
                        <Button variant="outline" onClick={() => setSearchTerm("")}>
                          Clear search
                        </Button>
                      </div>
                    ) : electiveCourses.length === 0 ? (
                      <div>
                        <p className="text-muted-foreground mb-4">No course electives yet</p>
                        <Button asChild>
                          <Link href="/manager/electives/course/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first course elective
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No courses in this category</p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredCourses.map((course) => (
                      <Card key={course.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">
                                  {language === "ru" && course.name_ru ? course.name_ru : course.name}
                                </h3>
                                {getStatusBadge(course.status)}
                              </div>
                              {course.description && (
                                <p className="text-muted-foreground mb-3">
                                  {language === "ru" && course.description_ru
                                    ? course.description_ru
                                    : course.description}
                                </p>
                              )}
                              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Deadline:</span> {formatDate(course.deadline)}
                                </div>
                                <div>
                                  <span className="font-medium">Max Selections:</span> {course.max_selections}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {formatDate(course.created_at)}
                                </div>
                              </div>
                            </div>
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
                                    View
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
                                    onClick={() =>
                                      handleStatusChange(
                                        course.id,
                                        "closed",
                                        language === "ru" && course.name_ru ? course.name_ru : course.name,
                                      )
                                    }
                                  >
                                    Close
                                  </DropdownMenuItem>
                                )}
                                {course.status === "closed" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        course.id,
                                        "published",
                                        language === "ru" && course.name_ru ? course.name_ru : course.name,
                                      )
                                    }
                                  >
                                    Reopen
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() =>
                                    handleDelete(
                                      course.id,
                                      language === "ru" && course.name_ru ? course.name_ru : course.name,
                                    )
                                  }
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Toaster />
    </DashboardLayout>
  )
}
