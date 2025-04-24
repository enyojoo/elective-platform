"use client"

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
import { Search, MoreHorizontal, Filter, UserPlus } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { UserRole, type DegreeType, type ProgramType } from "@/lib/types"
// Add the useLanguage import at the top with other imports
import { useLanguage } from "@/lib/language-context"

// Mock degrees data
const mockDegrees: DegreeType[] = [
  { id: 1, name: "Bachelor", code: "BSc" },
  { id: 2, name: "Master", code: "MSc" },
  { id: 3, name: "PhD", code: "PhD" },
]

// Mock programs data
const mockPrograms: ProgramType[] = [
  { id: 1, name: "Management", code: "MGT", degreeId: 1 },
  { id: 2, name: "International Business", code: "IB", degreeId: 1 },
  { id: 3, name: "Management", code: "MGT", degreeId: 2 },
  { id: 4, name: "Business Analytics", code: "BA", degreeId: 2 },
  { id: 5, name: "Corporate Finance", code: "CF", degreeId: 2 },
  { id: 6, name: "Management", code: "MGT", degreeId: 3 },
]

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: "Anna Petrova",
    email: "a.petrova@student.gsom.spbu.ru",
    role: UserRole.STUDENT,
    degreeId: 2,
    programId: 3,
    enrollmentYear: 2023,
    status: "active",
  },
  {
    id: 2,
    name: "Ivan Ivanov",
    email: "i.ivanov@student.gsom.spbu.ru",
    role: UserRole.STUDENT,
    degreeId: 2,
    programId: 4,
    enrollmentYear: 2023,
    status: "active",
  },
  {
    id: 3,
    name: "Elena Smirnova",
    email: "e.smirnova@gsom.spbu.ru",
    role: UserRole.PROGRAM_MANAGER,
    degreeId: 2,
    programId: 3,
    enrollmentYear: 2023,
    status: "active",
  },
  {
    id: 4,
    name: "Dmitry Sokolov",
    email: "d.sokolov@student.gsom.spbu.ru",
    role: UserRole.STUDENT,
    degreeId: 1,
    programId: 1,
    enrollmentYear: 2022,
    status: "inactive",
  },
  {
    id: 5,
    name: "Olga Kuznetsova",
    email: "o.kuznetsova@gsom.spbu.ru",
    role: UserRole.ADMIN,
    degreeId: null,
    programId: null,
    enrollmentYear: null,
    status: "active",
  },
  {
    id: 6,
    name: "Mikhail Volkov",
    email: "m.volkov@student.gsom.spbu.ru",
    role: UserRole.STUDENT,
    degreeId: 2,
    programId: 5,
    enrollmentYear: 2023,
    status: "active",
  },
  {
    id: 7,
    name: "Natalia Orlova",
    email: "n.orlova@gsom.spbu.ru",
    role: UserRole.PROGRAM_MANAGER,
    degreeId: 1,
    programId: 1,
    enrollmentYear: 2022,
    status: "active",
  },
  {
    id: 8,
    name: "Sergei Popov",
    email: "s.popov@student.gsom.spbu.ru",
    role: UserRole.STUDENT,
    degreeId: 2,
    programId: 3,
    enrollmentYear: 2023,
    status: "pending",
  },
]

// Replace the UsersPage component with this updated version that uses translations
export default function UsersPage() {
  const { t } = useLanguage()
  const [users, setUsers] = useState(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [degrees, setDegrees] = useState<DegreeType[]>([])
  const [programs, setPrograms] = useState<ProgramType[]>([])

  // Fetch degrees and programs
  useEffect(() => {
    // In a real app, these would be API calls
    setDegrees(mockDegrees)
    setPrograms(mockPrograms)
  }, [])

  // Filter users based on search term and filters
  useEffect(() => {
    let filteredUsers = mockUsers

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.status === statusFilter)
    }

    setUsers(filteredUsers)
  }, [searchTerm, roleFilter, statusFilter])

  // Helper function to get degree name
  const getDegreeName = (degreeId: number | null) => {
    if (!degreeId) return "-"
    return degrees.find((d) => d.id === degreeId)?.name || "-"
  }

  // Helper function to get program name
  const getProgramName = (programId: number | null) => {
    if (!programId) return "-"
    return programs.find((p) => p.id === programId)?.name || "-"
  }

  // Helper function to get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">{t("admin.users.admin")}</Badge>
        )
      case UserRole.PROGRAM_MANAGER:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
            {t("admin.users.manager")}
          </Badge>
        )
      case UserRole.STUDENT:
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">
            {t("admin.users.student")}
          </Badge>
        )
      default:
        return <Badge>{role}</Badge>
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("admin.users.active")}
          </Badge>
        )
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("admin.users.inactive")}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            {t("admin.users.pending")}
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.users.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.users.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/users/invite">
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                {t("admin.users.inviteManager")}
              </Button>
            </Link>
            <Link href="/admin/users/invite-student">
              <Button variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                {t("admin.users.inviteStudent")}
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.users.searchUsers")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.users.role")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.users.allRoles")}</SelectItem>
                      <SelectItem value={UserRole.STUDENT}>{t("admin.users.student")}</SelectItem>
                      <SelectItem value={UserRole.PROGRAM_MANAGER}>{t("admin.users.manager")}</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>{t("admin.users.admin")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.users.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.users.allStatus")}</SelectItem>
                      <SelectItem value="active">{t("admin.users.active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.users.inactive")}</SelectItem>
                      <SelectItem value="pending">{t("admin.users.pending")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.users.name")}</TableHead>
                      <TableHead>{t("admin.users.email")}</TableHead>
                      <TableHead>{t("admin.users.role")}</TableHead>
                      <TableHead>{t("admin.users.degree")}</TableHead>
                      <TableHead>{t("admin.users.program")}</TableHead>
                      <TableHead>{t("admin.users.enrollmentYear")}</TableHead>
                      <TableHead>{t("admin.users.status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.users.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {t("admin.users.noUsersFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{getDegreeName(user.degreeId)}</TableCell>
                          <TableCell>{getProgramName(user.programId)}</TableCell>
                          <TableCell>{user.enrollmentYear || "-"}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link href={`/admin/users/${user.id}`}>{t("admin.users.edit")}</Link>
                                </DropdownMenuItem>
                                {user.role === UserRole.PROGRAM_MANAGER && (
                                  <DropdownMenuItem>
                                    <Link href={`/admin/users/${user.id}/assign`}>
                                      {t("admin.users.reassignProgram")}
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-destructive">
                                  {t("admin.users.deactivate")}
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

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      2
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#">3</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
