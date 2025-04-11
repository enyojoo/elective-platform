"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ArrowLeft, Search, Filter, Plus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock program data
const mockPrograms = [
  {
    id: "1",
    name: "Master in Management",
    nameRu: "Магистр менеджмента",
    code: "MiM",
    level: "master",
    description: "A comprehensive program focusing on management principles and practices.",
    descriptionRu: "Комплексная программа, ориентированная на принципы и практики менеджмента.",
    students: 120,
    courses: 18,
    status: "active",
    years: ["2023", "2024"],
    degreeId: "2",
  },
  {
    id: "2",
    name: "Master in Business Analytics",
    nameRu: "Магистр бизнес-аналитики",
    code: "MiBA",
    level: "master",
    description: "Advanced program for data-driven business decision making.",
    descriptionRu: "Продвинутая программа для принятия бизнес-решений на основе данных.",
    students: 45,
    courses: 14,
    status: "active",
    years: ["2023", "2024"],
    degreeId: "2",
  },
]

// Mock student data
const mockStudents = [
  {
    id: "1",
    firstName: "Anna",
    lastName: "Ivanova",
    email: "a.ivanova@student.gsom.spbu.ru",
    programId: "1",
    enrollmentYear: 2023,
    group: "23.B01-vshm",
    status: "active",
  },
  {
    id: "2",
    firstName: "Mikhail",
    lastName: "Petrov",
    email: "m.petrov@student.gsom.spbu.ru",
    programId: "1",
    enrollmentYear: 2023,
    group: "23.B01-vshm",
    status: "active",
  },
  {
    id: "3",
    firstName: "Elena",
    lastName: "Smirnova",
    email: "e.smirnova@student.gsom.spbu.ru",
    programId: "1",
    enrollmentYear: 2023,
    group: "23.B02-vshm",
    status: "active",
  },
  {
    id: "4",
    firstName: "Dmitry",
    lastName: "Kozlov",
    email: "d.kozlov@student.gsom.spbu.ru",
    programId: "1",
    enrollmentYear: 2023,
    group: "23.B02-vshm",
    status: "inactive",
  },
  {
    id: "5",
    firstName: "Olga",
    lastName: "Sokolova",
    email: "o.sokolova@student.gsom.spbu.ru",
    programId: "1",
    enrollmentYear: 2024,
    group: "24.B01-vshm",
    status: "active",
  },
  {
    id: "6",
    firstName: "Ivan",
    lastName: "Kuznetsov",
    email: "i.kuznetsov@student.gsom.spbu.ru",
    programId: "2",
    enrollmentYear: 2023,
    group: "23.B01-vshm",
    status: "active",
  },
  {
    id: "7",
    firstName: "Maria",
    lastName: "Volkova",
    email: "m.volkova@student.gsom.spbu.ru",
    programId: "2",
    enrollmentYear: 2023,
    group: "23.B01-vshm",
    status: "active",
  },
  {
    id: "8",
    firstName: "Alexander",
    lastName: "Morozov",
    email: "a.morozov@student.gsom.spbu.ru",
    programId: "2",
    enrollmentYear: 2024,
    group: "24.B01-vshm",
    status: "active",
  },
]

export default function ProgramStudentsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [program, setProgram] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtering and pagination state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [yearFilter, setYearFilter] = useState("all")
  const [groupFilter, setGroupFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    // Simulate API call to fetch program details
    const fetchedProgram = mockPrograms.find((p) => p.id === id)

    if (fetchedProgram) {
      setProgram(fetchedProgram)

      // Fetch students for this program
      const programStudents = mockStudents.filter((s) => s.programId === id)
      setStudents(programStudents)
    } else {
      // If program not found, redirect to programs list
      router.push("/admin/programs")
    }

    setIsLoading(false)
  }, [id, router])

  // Get unique enrollment years and groups for filters
  const enrollmentYears = [...new Set(students.map((s) => s.enrollmentYear))].sort((a, b) => b - a)
  const groups = [...new Set(students.map((s) => s.group))].sort()

  // Filter students based on search and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === "" ||
      student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.group.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    const matchesYear = yearFilter === "all" || student.enrollmentYear.toString() === yearFilter
    const matchesGroup = groupFilter === "all" || student.group === groupFilter

    return matchesSearch && matchesStatus && matchesYear && matchesGroup
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>Loading program students...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!program) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>Program not found</div>
          <Link href="/admin/programs">
            <Button>Back to Programs</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/programs">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{program.name} Students</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{program.code}</Badge>
                <Badge
                  variant="outline"
                  className={
                    program.status === "active"
                      ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200"
                  }
                >
                  {program.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <Link href={`/admin/users/invite-student?programId=${id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Student
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
                    placeholder="Search students..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
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
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={yearFilter}
                    onValueChange={(value) => {
                      setYearFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {enrollmentYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={groupFilter}
                    onValueChange={(value) => {
                      setGroupFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
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
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No students found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.group}</TableCell>
                          <TableCell>{student.enrollmentYear}</TableCell>
                          <TableCell>{getStatusBadge(student.status)}</TableCell>
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
                                  <Link href={`/admin/users/${student.id}`} className="w-full">
                                    View Profile
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  {student.status === "active" ? "Deactivate" : "Activate"}
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

              {totalPages > 1 && (
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
