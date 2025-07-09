"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Download,
  Trash2,
  Archive,
  ArchiveRestore,
  XCircle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserRole } from "@/lib/types"

interface CourseElective {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  deadline: string
  max_students: number
  status: string
  courses: string[]
  created_at: string
  updated_at: string
}

type StatusFilter = "all" | "draft" | "published" | "closed" | "archived"

export default function ManagerCoursePage() {
  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  const [courseElectives, setCourseElectives] = useState<CourseElective[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<StatusFilter>("all")

  useEffect(() => {
    if (institution?.id) {
      loadCourseElectives()
    }
  }, [institution?.id])

  const loadCourseElectives = async () => {
    if (!institution?.id) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("elective_courses")
        .select("*")
        .eq("institution_id", institution.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setCourseElectives(data || [])
    } catch (error) {
      console.error("Error loading course electives:", error)
      toast({
        title: "Error",
        description: "Failed to load course electives",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filter electives based on search and status
  const filteredElectives = courseElectives.filter((elective) => {
    const matchesSearch =
      elective.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (elective.name_ru && elective.name_ru.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = activeTab === "all" || elective.status === activeTab

    return matchesSearch && matchesStatus
  })

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      all: courseElectives.length,
      draft: courseElectives.filter((e) => e.status === "draft").length,
      published: courseElectives.filter((e) => e.status === "published").length,
      closed: courseElectives.filter((e) => e.status === "closed").length,
      archived: courseElectives.filter((e) => e.status === "archived").length,
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  // Handle status change
  const handleStatusChange = async (electiveId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("elective_courses")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", electiveId)

      if (error) throw error

      // Update local state
      setCourseElectives((prev) =>
        prev.map((elective) =>
          elective.id === electiveId
            ? { ...elective, status: newStatus, updated_at: new Date().toISOString() }
            : elective,
        ),
      )

      toast({
        title: "Status updated",
        description: `Course elective status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update elective status",
        variant: "destructive",
      })
    }
  }

  // Handle delete
  const handleDelete = async (electiveId: string) => {
    if (!confirm("Are you sure you want to delete this course elective? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("elective_courses").delete().eq("id", electiveId)

      if (error) throw error

      // Update local state
      setCourseElectives((prev) => prev.filter((elective) => elective.id !== electiveId))

      toast({
        title: "Elective deleted",
        description: "Course elective has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting elective:", error)
      toast({
        title: "Error",
        description: "Failed to delete course elective",
        variant: "destructive",
      })
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      published: "default",
      closed: "destructive",
      archived: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Get action items based on status
  const getActionItems = (elective: CourseElective) => {
    const baseActions = [
      {
        icon: Eye,
        label: "View Details",
        href: `/manager/electives/course/${elective.id}`,
      },
      {
        icon: Edit,
        label: "Edit",
        href: `/manager/electives/course/${elective.id}/edit`,
      },
      {
        icon: Copy,
        label: "Duplicate",
        action: () => {
          // Handle duplicate logic
          toast({
            title: "Feature coming soon",
            description: "Duplicate functionality will be available soon",
          })
        },
      },
      {
        icon: Download,
        label: "Export Data",
        action: () => {
          // Handle export logic
          toast({
            title: "Feature coming soon",
            description: "Export functionality will be available soon",
          })
        },
      },
    ]

    const statusActions = []

    // Add status-specific actions
    if (elective.status === "draft") {
      statusActions.push({
        icon: CheckCircle,
        label: "Publish",
        action: () => handleStatusChange(elective.id, "published"),
      })
    } else if (elective.status === "published") {
      statusActions.push({
        icon: XCircle,
        label: "Close",
        action: () => handleStatusChange(elective.id, "closed"),
      })
    } else if (elective.status === "closed") {
      statusActions.push({
        icon: CheckCircle,
        label: "Reopen",
        action: () => handleStatusChange(elective.id, "published"),
      })
    }

    // Archive/Unarchive actions
    if (elective.status !== "archived") {
      statusActions.push({
        icon: Archive,
        label: "Archive",
        action: () => handleStatusChange(elective.id, "archived"),
      })
    } else {
      statusActions.push({
        icon: ArchiveRestore,
        label: "Unarchive",
        action: () => handleStatusChange(elective.id, "draft"),
      })
    }

    // Delete action (destructive)
    const deleteAction = {
      icon: Trash2,
      label: "Delete",
      action: () => handleDelete(elective.id),
      destructive: true,
    }

    return [...baseActions, ...statusActions, deleteAction]
  }

  return (
    <DashboardLayout userRole={UserRole.MANAGER}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Electives</h1>
          <p className="text-muted-foreground">Manage course elective packs and student enrollment options</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search course electives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StatusFilter)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
                <TabsTrigger value="published">Published ({statusCounts.published})</TabsTrigger>
                <TabsTrigger value="closed">Closed ({statusCounts.closed})</TabsTrigger>
                <TabsTrigger value="archived">Archived ({statusCounts.archived})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredElectives.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm
                        ? "No course electives found"
                        : activeTab === "all"
                          ? "No course electives yet"
                          : `No ${activeTab} course electives`}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first course elective to get started"}
                    </p>
                    {!searchTerm && activeTab === "all" && (
                      <Button asChild>
                        <Link href="/manager/electives/course-builder">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Course Elective
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Elective Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Max Students</TableHead>
                        <TableHead>Courses</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredElectives.map((elective) => (
                        <TableRow key={elective.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {language === "ru" && elective.name_ru ? elective.name_ru : elective.name}
                              </div>
                              {elective.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {language === "ru" && elective.description_ru
                                    ? elective.description_ru
                                    : elective.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(elective.status)}</TableCell>
                          <TableCell>{formatDate(elective.deadline)}</TableCell>
                          <TableCell>{elective.max_students}</TableCell>
                          <TableCell>{elective.courses?.length || 0}</TableCell>
                          <TableCell>{formatDate(elective.created_at)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {getActionItems(elective).map((item, index) => (
                                  <DropdownMenuItem
                                    key={index}
                                    className={item.destructive ? "text-destructive" : ""}
                                    onClick={item.action}
                                    asChild={!!item.href}
                                  >
                                    {item.href ? (
                                      <Link href={item.href}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                      </Link>
                                    ) : (
                                      <>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
