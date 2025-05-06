"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, MoreHorizontal, Filter, Plus, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import { useCachedPrograms } from "@/hooks/use-cached-programs"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useDataCache } from "@/lib/data-cache-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// Mock programs data for development
const mockPrograms = [
  {
    id: "1",
    name: "Master in Management",
    code: "MiM",
    level: "master",
    students: 45,
    courses: 12,
    status: "active",
    description: "A comprehensive management program for future business leaders",
  },
  {
    id: "2",
    name: "Master in Finance",
    code: "MiF",
    level: "master",
    students: 38,
    courses: 10,
    status: "active",
    description: "Advanced financial education for aspiring finance professionals",
  },
  {
    id: "3",
    name: "Bachelor in Business Administration",
    code: "BBA",
    level: "bachelor",
    students: 120,
    courses: 24,
    status: "active",
    description: "Foundation business education for undergraduate students",
  },
  {
    id: "4",
    name: "Master in Business Analytics",
    code: "MBA",
    level: "master",
    students: 32,
    courses: 14,
    status: "active",
    description: "Data-driven business program focusing on analytics and insights",
  },
  {
    id: "5",
    name: "Bachelor in Economics",
    code: "BEc",
    level: "bachelor",
    students: 85,
    courses: 20,
    status: "inactive",
    description: "Comprehensive economics program for undergraduate students",
  },
]

export default function ProgramsPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { data: fetchedPrograms, isLoading, error, isInitialized } = useCachedPrograms(institution?.id)
  const { invalidateCache } = useDataCache()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])
  const itemsPerPage = 10

  // Use mock data for development, replace with fetched data in production
  const programs = fetchedPrograms || mockPrograms

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Filter programs based on search term and filters
  useEffect(() => {
    let result = [...programs]

    if (searchTerm) {
      result = result.filter(
        (program) =>
          program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((program) => program.status === statusFilter)
    }

    if (levelFilter !== "all") {
      result = result.filter((program) => program.level === levelFilter)
    }

    setFilteredPrograms(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, statusFilter, levelFilter, programs])

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredPrograms.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage)

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("admin.programs.active")}
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("admin.programs.inactive")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handle program status change
  const handleStatusChange = async (programId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("programs").update({ status: newStatus }).eq("id", programId)

      if (error) throw error

      // Invalidate the programs cache
      if (institution?.id) {
        invalidateCache("programs", institution.id)
      }

      toast({
        title: "Success",
        description: `Program has been ${newStatus === "active" ? "activated" : "deactivated"}`,
      })
    } catch (error: any) {
      console.error("Error updating program status:", error)
      toast({
        title: "Error",
        description: `Failed to update program status: ${error.message}`,
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
    <DashboardLayout userRole="admin">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.programs.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.programs.subtitle")}</p>
          </div>
          <Link href="/admin/programs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.programs.addProgram")}
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
                    placeholder={t("admin.programs.searchPrograms")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.programs.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.programs.allStatus")}</SelectItem>
                      <SelectItem value="active">{t("admin.programs.active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.programs.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.programs.level")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.programs.allLevels")}</SelectItem>
                      <SelectItem value="bachelor">{t("admin.programs.bachelors")}</SelectItem>
                      <SelectItem value="master">{t("admin.programs.masters")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.programs.name")}</TableHead>
                      <TableHead>{t("admin.programs.code")}</TableHead>
                      <TableHead>{t("admin.programs.level")}</TableHead>
                      <TableHead>{t("admin.programs.students")}</TableHead>
                      <TableHead>{t("admin.programs.courses")}</TableHead>
                      <TableHead>{t("admin.programs.status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.programs.action")}</TableHead>
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
                            <Skeleton className="h-5 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[40px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[40px]" />
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
                        <TableCell colSpan={7} className="h-24 text-center">
                          {t("admin.programs.noPrograms")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((program) => (
                        <TableRow key={program.id}>
                          <TableCell className="font-medium">{program.name}</TableCell>
                          <TableCell>{program.code}</TableCell>
                          <TableCell>
                            {program.level === "bachelor" ? t("admin.programs.bachelors") : t("admin.programs.masters")}
                          </TableCell>
                          <TableCell>{program.students}</TableCell>
                          <TableCell>{program.courses}</TableCell>
                          <TableCell>{getStatusBadge(program.status)}</TableCell>
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
                                  <Link href={`/admin/programs/${program.id}/edit`} className="w-full">
                                    {t("admin.programs.edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link href={`/admin/programs/${program.id}/students`} className="w-full">
                                    {t("admin.programs.viewStudents")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(program.id, program.status === "active" ? "inactive" : "active")
                                  }
                                >
                                  {program.status === "active"
                                    ? t("admin.programs.deactivate")
                                    : t("admin.programs.activate")}
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

              {filteredPrograms.length > itemsPerPage && (
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
