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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, Filter, Plus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { Skeleton } from "@/components/ui/skeleton"

export default function CoursesPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const { toast } = useToast()

  const [courses, setCourses] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [programFilter, setProgramFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const itemsPerPage = 10

  // Fetch courses and programs data
  useEffect(() => {
    if (!institution?.id) return

    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Try to get courses from cache first
        const cachedCourses = getCachedData<any[]>("courses", institution.id)
        const cachedPrograms = getCachedData<any[]>("programs", institution.id)

        if (cachedCourses && cachedPrograms) {
          setCourses(cachedCourses)
          setPrograms(cachedPrograms)
          setIsLoading(false)
          return
        }

        // If not in cache, fetch from Supabase
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        // Fetch courses
        if (!cachedCourses) {
          const { data: coursesData, error: coursesError } = await supabase
            .from("courses")
            .select("*, programs(name, code)")
            .eq("institution_id", institution.id)

          if (coursesError) throw coursesError

          setCourses(coursesData || [])
          setCachedData("courses", institution.id, coursesData || [])
        }

        // Fetch programs
        if (!cachedPrograms) {
          const { data: programsData, error: programsError } = await supabase
            .from("programs")
            .select("id, name, code")
            .eq("institution_id", institution.id)

          if (programsError) throw programsError

          setPrograms(programsData || [])
          setCachedData("programs", institution.id, programsData || [])
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [institution?.id, getCachedData, setCachedData, toast])

  // Function to toggle course status
  const toggleCourseStatus = async (courseId: string, currentStatus: string) => {
    if (!institution?.id || isUpdating) return

    setIsUpdating(true)

    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"

      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error } = await supabase.from("courses").update({ status: newStatus }).eq("id", courseId)

      if (error) throw error

      // Update local state
      setCourses((prevCourses) =>
        prevCourses.map((course) => (course.id === courseId ? { ...course, status: newStatus } : course)),
      )

      // Update cache
      invalidateCache("courses", institution.id)
      setCachedData(
        "courses",
        institution.id,
        courses.map((course) => (course.id === courseId ? { ...course, status: newStatus } : course)),
      )

      toast({
        title: "Success",
        description: `Course ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      })
    } catch (error: any) {
      console.error("Error updating course status:", error)
      toast({
        title: "Error",
        description: "Failed to update course status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Function to delete a course
  const deleteCourse = async (courseId: string) => {
    if (!institution?.id || isUpdating) return

    if (!confirm(t("admin.courses.confirmDelete"))) return

    setIsUpdating(true)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error

      // Update local state
      setCourses((prevCourses) => prevCourses.filter((course) => course.id !== courseId))

      // Update cache
      invalidateCache("courses", institution.id)
      setCachedData(
        "courses",
        institution.id,
        courses.filter((course) => course.id !== courseId),
      )

      toast({
        title: "Success",
        description: "Course deleted successfully.",
      })
    } catch (error: any) {
      console.error("Error deleting course:", error)
      toast({
        title: "Error",
        description: "Failed to delete course. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Filter courses based on search term and filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      searchTerm === "" ||
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || course.status === statusFilter

    const matchesProgram = programFilter === "all" || course.program?.id === programFilter

    return matchesSearch && matchesStatus && matchesProgram
  })

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCourses.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)

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
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value)
                      setCurrentPage(1)
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
                    value={programFilter}
                    onValueChange={(value) => {
                      setProgramFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.courses.program")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.courses.allPrograms")}</SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>
                          {program.name}
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
                      <TableHead>{t("admin.courses.program")}</TableHead>
                      <TableHead>{t("admin.courses.status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.courses.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      // Show skeleton rows while loading
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : currentItems.length > 0 ? (
                      currentItems.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>{course.instructor}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.programs?.code || "N/A"}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(course.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link href={`/admin/courses/${course.id}`} className="w-full">
                                    {t("admin.courses.edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    toggleCourseStatus(course.id, course.status)
                                  }}
                                >
                                  {course.status === "active"
                                    ? t("admin.courses.deactivate")
                                    : t("admin.courses.activate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    deleteCourse(course.id)
                                  }}
                                >
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

              {filteredCourses.length > itemsPerPage && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === 1}
                        aria-label={t("pagination.previous")}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          aria-label={`${t("pagination.page")} ${page}`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === totalPages}
                        aria-label={t("pagination.next")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
