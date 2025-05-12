"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, Filter, Plus, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useInstitution } from "@/lib/institution-context"
import { useDialogState } from "@/hooks/use-dialog-state"
import { cleanupDialogEffects } from "@/lib/dialog-utils"

interface Course {
  id: string
  name_en: string
  name_ru: string
  instructor_en: string
  instructor_ru: string
  code: string
  status: string
  degree_id: string
  degree: {
    id: string
    name: string
    name_ru: string
    code: string
  } | null
}

interface Degree {
  id: string
  name: string
  name_ru: string
  code: string
  status: string
}

// Cache keys
const COURSES_CACHE_KEY = "admin_courses_cache"
const DEGREES_CACHE_KEY = "admin_degrees_cache"

// Cache expiry time (1 hour)
const CACHE_EXPIRY = 60 * 60 * 1000

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [degreeFilter, setDegreeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [degrees, setDegrees] = useState<Degree[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingDegrees, setIsLoadingDegrees] = useState(true)
  const [totalCourses, setTotalCourses] = useState(0)
  const itemsPerPage = 10
  const { t, language } = useLanguage()
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()
  const { institution } = useInstitution()

  // Delete confirmation dialog state
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null)
  const {
    isOpen: isDeleteDialogOpen,
    openDialog: openDeleteDialog,
    closeDialog: closeDeleteDialog,
  } = useDialogState(false)

  // Load cached data on initial render
  useEffect(() => {
    const loadCachedData = () => {
      try {
        // Load cached degrees
        const cachedDegrees = localStorage.getItem(DEGREES_CACHE_KEY)
        if (cachedDegrees) {
          const { data, timestamp, institutionId } = JSON.parse(cachedDegrees)
          // Check if cache is valid and for the current institution
          if (Date.now() - timestamp < CACHE_EXPIRY && institutionId === institution?.id) {
            setDegrees(data)
            setIsLoadingDegrees(false)
          }
        }

        // Load cached courses
        const cachedCourses = localStorage.getItem(COURSES_CACHE_KEY)
        if (cachedCourses) {
          const { data, timestamp, institutionId, filters } = JSON.parse(cachedCourses)
          // Check if cache is valid, for the current institution, and filters match
          if (
            Date.now() - timestamp < CACHE_EXPIRY &&
            institutionId === institution?.id &&
            filters.searchTerm === searchTerm &&
            filters.statusFilter === statusFilter &&
            filters.degreeFilter === degreeFilter &&
            filters.currentPage === currentPage
          ) {
            setCourses(data.courses)
            setTotalCourses(data.totalCourses)
            setIsLoadingCourses(false)
          }
        }
      } catch (error) {
        console.error("Error loading cached data:", error)
        // If there's an error, we'll just fetch fresh data
      }
    }

    loadCachedData()
  }, [institution?.id, searchTerm, statusFilter, degreeFilter, currentPage])

  // Fetch degrees from Supabase
  useEffect(() => {
    async function fetchDegrees() {
      if (!institution?.id || !isLoadingDegrees) {
        return
      }

      try {
        const { data, error } = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", institution.id)
          .order("name", { ascending: true })

        if (error) {
          throw error
        }

        setDegrees(data || [])

        // Cache the degrees data
        localStorage.setItem(
          DEGREES_CACHE_KEY,
          JSON.stringify({
            data,
            timestamp: Date.now(),
            institutionId: institution.id,
          }),
        )
      } catch (error: any) {
        console.error("Error fetching degrees:", error)
        toast({
          title: t("admin.courses.error", "Error"),
          description: t("admin.courses.errorFetching", "Failed to fetch degrees") + ": " + error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoadingDegrees(false)
      }
    }

    fetchDegrees()
  }, [supabase, institution?.id, isLoadingDegrees, toast, t])

  // Fetch courses from Supabase
  useEffect(() => {
    async function fetchCourses() {
      if (!institution?.id) {
        setIsLoadingCourses(false)
        return
      }

      try {
        // Build query
        let query = supabase
          .from("courses")
          .select("*, degree:degree_id(*)", { count: "exact" })
          .eq("institution_id", institution.id)

        // Apply filters
        if (searchTerm) {
          query = query.or(
            `name_en.ilike.%${searchTerm}%,name_ru.ilike.%${searchTerm}%,instructor_en.ilike.%${searchTerm}%,instructor_ru.ilike.%${searchTerm}%`,
          )
        }

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter)
        }

        if (degreeFilter !== "all") {
          query = query.eq("degree_id", degreeFilter)
        }

        // Apply pagination
        const from = (currentPage - 1) * itemsPerPage
        const to = from + itemsPerPage - 1
        query = query.range(from, to)

        // Execute query
        const { data, error, count } = await query

        if (error) {
          throw error
        }

        setCourses(data || [])
        setTotalCourses(count || 0)

        // Cache the courses data
        localStorage.setItem(
          COURSES_CACHE_KEY,
          JSON.stringify({
            data: {
              courses: data,
              totalCourses: count,
            },
            timestamp: Date.now(),
            institutionId: institution.id,
            filters: {
              searchTerm,
              statusFilter,
              degreeFilter,
              currentPage,
            },
          }),
        )
      } catch (error: any) {
        console.error("Error fetching courses:", error)
        toast({
          title: t("admin.courses.error", "Error"),
          description: t("admin.courses.errorFetching", "Failed to load courses") + ": " + error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [supabase, institution?.id, searchTerm, statusFilter, degreeFilter, currentPage, toast, t])

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("admin.courses.status.active")}
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("admin.courses.status.inactive")}
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            {t("admin.courses.status.draft")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handle course status toggle
  const handleStatusToggle = async (courseId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"

      const { error } = await supabase
        .from("courses")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", courseId)

      if (error) {
        throw error
      }

      // Update local state
      setCourses(courses.map((course) => (course.id === courseId ? { ...course, status: newStatus } : course)))

      // Invalidate cache
      localStorage.removeItem(COURSES_CACHE_KEY)

      toast({
        title: t("admin.courses.statusUpdated", "Course status updated"),
        description: t("admin.courses.statusUpdateSuccess", "Course status has been updated successfully"),
      })
    } catch (error: any) {
      toast({
        title: t("admin.courses.error", "Error"),
        description: t("admin.courses.errorUpdatingStatus", "Failed to update course status") + ": " + error.message,
        variant: "destructive",
      })
    }
  }

  // Handle opening delete confirmation dialog
  const handleDelete = (courseId: string) => {
    setCourseToDelete(courseId)
    openDeleteDialog()
  }

  // Handle closing delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    closeDeleteDialog()

    // Ensure cleanup after dialog closes
    setTimeout(() => {
      setCourseToDelete(null)
      cleanupDialogEffects()
    }, 300) // Wait for animation to complete
  }

  // Confirm delete action
  const confirmDelete = async () => {
    if (!courseToDelete) return

    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseToDelete)

      if (error) {
        throw error
      }

      // Update local state
      setCourses((prev) => prev.filter((course) => course.id !== courseToDelete))
      setTotalCourses(totalCourses - 1)

      // Invalidate cache
      localStorage.removeItem(COURSES_CACHE_KEY)

      toast({
        title: t("admin.courses.deleteSuccess", "Course deleted"),
        description: t("admin.courses.deleteSuccessDesc", "Course has been deleted successfully"),
      })

      // Close dialog and clean up
      handleCloseDeleteDialog()
    } catch (error: any) {
      console.error("Error deleting course:", error)
      toast({
        title: t("admin.courses.error", "Error"),
        description: t("admin.courses.errorDeleting", "Failed to delete course") + ": " + error.message,
        variant: "destructive",
      })
      handleCloseDeleteDialog()
    }
  }

  // Get the course name for the delete confirmation dialog
  const getCourseToDeleteName = () => {
    if (!courseToDelete) return ""
    const course = courses.find((c) => c.id === courseToDelete)
    return course ? (language === "ru" && course.name_ru ? course.name_ru : course.name_en) : ""
  }

  // Helper function to get localized degree name
  const getLocalizedDegreeName = (degree: any) => {
    if (language === "ru" && degree.name_ru && degree.name_ru.trim() !== "") {
      return degree.name_ru
    }
    return degree.name
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalCourses / itemsPerPage)

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.courses.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.courses.subtitle")}</p>
          </div>
          <Link href="/admin/courses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.courses.addCourse")}
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("admin.courses.search")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page when search changes
                      setIsLoadingCourses(true) // Trigger a new fetch
                    }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value)
                      setCurrentPage(1) // Reset to first page when filter changes
                      setIsLoadingCourses(true) // Trigger a new fetch
                    }}
                  >
                    <SelectTrigger className="w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.courses.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.courses.allStatus")}</SelectItem>
                      <SelectItem value="active">{t("admin.courses.active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.courses.inactive")}</SelectItem>
                      <SelectItem value="draft">{t("admin.courses.draft")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={degreeFilter}
                    onValueChange={(value) => {
                      setDegreeFilter(value)
                      setCurrentPage(1) // Reset to first page when filter changes
                      setIsLoadingCourses(true) // Trigger a new fetch
                    }}
                    disabled={isLoadingDegrees}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.courses.degree")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.courses.allDegrees")}</SelectItem>
                      {degrees.map((degree) => (
                        <SelectItem key={degree.id} value={degree.id}>
                          {getLocalizedDegreeName(degree)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.courses.name")}</TableHead>
                      <TableHead>{t("admin.courses.instructor")}</TableHead>
                      <TableHead>{t("admin.courses.degree")}</TableHead>
                      <TableHead>{t("admin.courses.status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.courses.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCourses ? (
                      <TableSkeleton columns={5} rows={itemsPerPage} />
                    ) : courses.length > 0 ? (
                      courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">
                            {language === "ru" && course.name_ru ? course.name_ru : course.name_en}
                          </TableCell>
                          <TableCell>
                            {language === "ru" && course.instructor_ru ? course.instructor_ru : course.instructor_en}
                          </TableCell>
                          <TableCell>
                            {course.degree && (
                              <Badge variant="outline">
                                {language === "ru" && course.degree.name_ru
                                  ? course.degree.name_ru
                                  : course.degree.name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(course.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link href={`/admin/courses/${course.id}/edit`} className="w-full">
                                    {t("admin.courses.edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusToggle(course.id, course.status)}>
                                  {course.status === "active"
                                    ? t("admin.courses.deactivate")
                                    : t("admin.courses.activate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(course.id)}>
                                  {t("admin.courses.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t("admin.courses.noCoursesFound")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1)
                            setIsLoadingCourses(true) // Trigger a new fetch
                          }
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        aria-label={t("pagination.previous")}
                      >
                        {t("pagination.previous")}
                      </PaginationPrevious>
                    </PaginationItem>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      // Show pages around current page
                      let pageNum = i + 1
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 3 + i
                        }
                        if (pageNum > totalPages - 4) {
                          pageNum = totalPages - 4 + i
                        }
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === pageNum}
                            onClick={(e) => {
                              e.preventDefault()
                              setCurrentPage(pageNum)
                              setIsLoadingCourses(true) // Trigger a new fetch
                            }}
                            aria-label={`${t("pagination.page")} ${pageNum}`}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1)
                            setIsLoadingCourses(true) // Trigger a new fetch
                          }
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        aria-label={t("pagination.next")}
                      >
                        {t("pagination.next")}
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog()
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onEscapeKeyDown={(e) => {
            e.stopPropagation()
            handleCloseDeleteDialog()
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault()
            handleCloseDeleteDialog()
          }}
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("admin.courses.confirmDeleteTitle", "Delete Course")}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t(
                "admin.courses.confirmDeleteMessage",
                "You are sure you want to delete this course? This action cannot be undone.",
              )}
              <div className="mt-2 font-medium">{getCourseToDeleteName()}</div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              {t("admin.courses.cancelDelete", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t("admin.courses.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
