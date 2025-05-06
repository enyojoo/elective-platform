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
import { Search, MoreHorizontal, Filter, Plus, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCachedCourses } from "@/hooks/use-cached-courses"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// Mock courses data
const mockCourses = [
  {
    id: 1,
    name: "Strategic Management",
    instructor: "Prof. John Smith",
    program: "Master in Management",
    programCode: "MiM",
    status: "active",
  },
  {
    id: 2,
    name: "Financial Accounting",
    instructor: "Dr. Jane Doe",
    program: "Master in Finance",
    programCode: "MiF",
    status: "active",
  },
  {
    id: 3,
    name: "Marketing Analytics",
    instructor: "Prof. Robert Johnson",
    program: "Master in Business Analytics",
    programCode: "MBA",
    status: "inactive",
  },
  {
    id: 4,
    name: "Organizational Behavior",
    instructor: "Dr. Emily Chen",
    program: "Bachelor in Management",
    programCode: "BiM",
    status: "draft",
  },
  {
    id: 5,
    name: "Business Ethics",
    instructor: "Prof. Michael Brown",
    program: "Master in Management",
    programCode: "MiM",
    status: "active",
  },
  {
    id: 6,
    name: "International Economics",
    instructor: "Dr. Sarah Wilson",
    program: "Master in International Business",
    programCode: "MIB",
    status: "active",
  },
  {
    id: 7,
    name: "Corporate Finance",
    instructor: "Prof. David Lee",
    program: "Master in Finance",
    programCode: "MiF",
    status: "inactive",
  },
  {
    id: 8,
    name: "Supply Chain Management",
    instructor: "Dr. Thomas Anderson",
    program: "Master in Management",
    programCode: "MiM",
    status: "draft",
  },
]

// Mock programs data
const mockPrograms = [
  { id: 1, name: "Master in Management", code: "MiM" },
  { id: 2, name: "Master in Finance", code: "MiF" },
  { id: 3, name: "Master in Business Analytics", code: "MBA" },
  { id: 4, name: "Master in International Business", code: "MIB" },
  { id: 5, name: "Bachelor in Management", code: "BiM" },
]

export default function CoursesPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { data: fetchedCourses, isLoading, error, isInitialized } = useCachedCourses(institution?.id)
  const { invalidateCache } = useDataCache()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [programFilter, setProgramFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredCourses, setFilteredCourses] = useState<any[]>([])
  const itemsPerPage = 10

  // Use mock data for development, replace with fetched data in production
  const courses = fetchedCourses || mockCourses

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Filter courses based on search term and filters
  useEffect(() => {
    let result = [...courses]

    if (searchTerm) {
      result = result.filter(
        (course) =>
          course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((course) => course.status === statusFilter)
    }

    if (programFilter !== "all") {
      result = result.filter((course) => course.program === programFilter || course.programCode === programFilter)
    }

    setFilteredCourses(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, statusFilter, programFilter, courses])

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

  // Handle course status change
  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("courses").update({ status: newStatus }).eq("id", courseId)

      if (error) throw error

      // Invalidate the courses cache
      if (institution?.id) {
        invalidateCache("courses", institution.id)
      }

      toast({
        title: "Success",
        description: `Course has been ${newStatus === "active" ? "activated" : "deactivated"}`,
      })
    } catch (error: any) {
      console.error("Error updating course status:", error)
      toast({
        title: "Error",
        description: `Failed to update course status: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Only show skeleton on initial load, not when data is cached
  if (!isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-4 w-[350px] mt-2" />
            </div>
            <Skeleton className="h-10 w-[150px]" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-[130px]" />
                    <Skeleton className="h-10 w-[180px]" />
                  </div>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
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

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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

                  <Select value={programFilter} onValueChange={setProgramFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.courses.program")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.courses.allPrograms")}</SelectItem>
                      {mockPrograms.map((program) => (
                        <SelectItem key={program.id} value={program.name}>
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
                      // Skeleton loading state
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-5 w-[150px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t("admin.courses.noCoursesFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>{course.instructor}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.programCode}</Badge>
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
                                  <Link href={`/admin/courses/${course.id}`} className="w-full">
                                    {t("admin.courses.edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      course.id.toString(),
                                      course.status === "active" ? "inactive" : "active",
                                    )
                                  }
                                >
                                  {course.status === "active"
                                    ? t("admin.courses.deactivate")
                                    : t("admin.courses.activate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  {t("admin.courses.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
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
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          isActive={currentPage === page}
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
