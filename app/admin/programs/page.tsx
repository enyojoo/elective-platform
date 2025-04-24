"use client"

import { useState } from "react"
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
import { Search, MoreHorizontal, Filter, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"

// Mock programs data
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
    degreeId: "2",
  },
  {
    id: "3",
    name: "Master in Corporate Finance",
    nameRu: "Магистр корпоративных финансов",
    code: "MCF",
    level: "master",
    description: "Specialized program in corporate finance and investment strategies.",
    descriptionRu: "Специализированная программа по корпоративным финансам и инвестиционным стратегиям.",
    students: 38,
    courses: 12,
    status: "active",
    degreeId: "2",
  },
  {
    id: "4",
    name: "Bachelor in Management",
    nameRu: "Бакалавр менеджмента",
    code: "BiM",
    level: "bachelor",
    description: "Undergraduate program covering fundamental management concepts.",
    descriptionRu: "Программа бакалавриата, охватывающая фундаментальные концепции менеджмента.",
    students: 210,
    courses: 24,
    status: "active",
    degreeId: "1",
  },
  {
    id: "5",
    name: "Master in Information Systems",
    nameRu: "Магистр информационных систем",
    code: "MIS",
    level: "master",
    description: "Advanced program focusing on information systems and digital transformation.",
    descriptionRu: "Продвинутая программа, ориентированная на информационные системы и цифровую трансформацию.",
    students: 32,
    courses: 16,
    status: "inactive",
    degreeId: "2",
  },
]

// Mock degrees data
const mockDegrees = [
  {
    id: "1",
    name: "Bachelor's",
    nameRu: "Бакалавриат",
    code: "bachelor",
  },
  {
    id: "2",
    name: "Master's",
    nameRu: "Магистратура",
    code: "master",
  },
]

export default function ProgramsPage() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter programs based on search term and filters
  const filteredPrograms = mockPrograms.filter((program) => {
    const matchesSearch =
      searchTerm === "" ||
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || program.status === statusFilter
    const matchesLevel = levelFilter === "all" || program.level === levelFilter
    return matchesSearch && matchesStatus && matchesLevel
  })

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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
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
                      <SelectValue placeholder={t("admin.programs.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.programs.allStatus")}</SelectItem>
                      <SelectItem value="active">{t("admin.programs.active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.programs.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={levelFilter}
                    onValueChange={(value) => {
                      setLevelFilter(value)
                      setCurrentPage(1)
                    }}
                  >
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
                    {currentItems.length > 0 ? (
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
                                <DropdownMenuItem>
                                  {program.status === "active"
                                    ? t("admin.programs.deactivate")
                                    : t("admin.programs.activate")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          {t("admin.programs.noPrograms")}
                        </TableCell>
                      </TableRow>
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
