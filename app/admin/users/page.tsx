"use client"

import { useEffect, useState } from "react"
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
import Link from "next/link"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

// Define user type
type User = {
  id: string
  name: string
  email: string
  role: string
  status: string
  programName: string
  degreeName: string
  enrollmentYear: string
}

export default function UsersPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Fetch users data
  useEffect(() => {
    if (!institution) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch all profiles for this institution (including admins, managers, and students)
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, is_active")
          .eq("institution_id", institution.id)

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError)
          throw profilesError
        }

        console.log(`Fetched ${profilesData.length} profiles for institution ${institution.id}`)

        // Fetch student profiles
        const { data: studentProfilesData, error: studentProfilesError } = await supabase
          .from("student_profiles")
          .select("profile_id, enrollment_year, group_id")

        if (studentProfilesError) throw studentProfilesError

        // Fetch manager profiles
        const { data: managerProfilesData, error: managerProfilesError } = await supabase
          .from("manager_profiles")
          .select("profile_id, program_id")

        if (managerProfilesError) throw managerProfilesError

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, program_id")
          .eq("institution_id", institution.id)

        if (groupsError) throw groupsError

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name, degree_id")
          .eq("institution_id", institution.id)

        if (programsError) throw programsError

        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .eq("institution_id", institution.id)

        if (degreesError) throw degreesError

        // Create maps for faster lookups
        const studentProfilesMap = new Map(
          studentProfilesData.map((sp) => [
            sp.profile_id,
            { enrollmentYear: sp.enrollment_year, groupId: sp.group_id },
          ]),
        )

        const managerProfilesMap = new Map(
          managerProfilesData.map((mp) => [mp.profile_id, { programId: mp.program_id }]),
        )

        const groupsMap = new Map(groupsData.map((g) => [g.id, { programId: g.program_id }]))

        const programsMap = new Map(programsData.map((p) => [p.id, { name: p.name, degreeId: p.degree_id }]))

        const degreesMap = new Map(degreesData.map((d) => [d.id, { name: d.name }]))

        // Transform profiles data
        const transformedUsers = profilesData.map((profile) => {
          let programId = null
          let programName = "-"
          let degreeId = null
          let degreeName = "-"
          let enrollmentYear = "-"

          // Get student-specific data
          if (profile.role === "student") {
            const studentData = studentProfilesMap.get(profile.id)
            if (studentData) {
              enrollmentYear = studentData.enrollmentYear || "-"

              // Get program from group
              if (studentData.groupId) {
                const groupData = groupsMap.get(studentData.groupId)
                if (groupData) {
                  programId = groupData.programId

                  // Get program name and degree
                  const programData = programsMap.get(programId)
                  if (programData) {
                    programName = programData.name
                    degreeId = programData.degreeId

                    // Get degree name
                    const degreeData = degreesMap.get(degreeId)
                    if (degreeData) {
                      degreeName = degreeData.name
                    }
                  }
                }
              }
            }
          }

          // Get manager-specific data
          if (profile.role === "manager") {
            const managerData = managerProfilesMap.get(profile.id)
            if (managerData && managerData.programId) {
              programId = managerData.programId

              // Get program name and degree
              const programData = programsMap.get(programId)
              if (programData) {
                programName = programData.name
                degreeId = programData.degreeId

                // Get degree name
                const degreeData = degreesMap.get(degreeId)
                if (degreeData) {
                  degreeName = degreeData.name
                }
              }
            }
          }

          // Admin users don't have program or degree assignments
          // They're shown with default values ("-")

          return {
            id: profile.id,
            name: profile.full_name || "",
            email: profile.email || "",
            role: profile.role || "",
            status: profile.is_active ? "active" : "inactive",
            programName,
            degreeName,
            enrollmentYear,
          }
        })

        setUsers(transformedUsers)
        setFilteredUsers(transformedUsers)
        setTotalPages(Math.ceil(transformedUsers.length / itemsPerPage))
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load users data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [institution, supabase, toast])

  // Filter users based on search term and filters
  useEffect(() => {
    let result = users

    if (searchTerm) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter((user) => user.status === statusFilter)
    }

    setFilteredUsers(result)
    setTotalPages(Math.ceil(result.length / itemsPerPage))
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, roleFilter, statusFilter, users])

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }

  // Helper function to get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">{t("admin.users.admin")}</Badge>
        )
      case "manager":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
            {t("admin.users.manager")}
          </Badge>
        )
      case "student":
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
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", userId)

      if (error) throw error

      // Update local state
      setUsers(
        users.map((user) => (user.id === userId ? { ...user, status: newStatus ? "active" : "inactive" } : user)),
      )

      toast({
        title: "Success",
        description: newStatus ? "User has been activated" : "User has been deactivated",
      })
    } catch (error) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      })
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
                      <SelectItem value="admin">{t("admin.users.admin")}</SelectItem>
                      <SelectItem value="manager">{t("admin.users.manager")}</SelectItem>
                      <SelectItem value="student">{t("admin.users.student")}</SelectItem>
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
                    {isLoading ? (
                      // Skeleton loading state
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[180px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[100px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : getCurrentPageItems().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {t("admin.users.noUsersFound") || "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      getCurrentPageItems().map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{user.degreeName}</TableCell>
                          <TableCell>{user.programName}</TableCell>
                          <TableCell>{user.enrollmentYear}</TableCell>
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
                                {user.role === "manager" && (
                                  <DropdownMenuItem>
                                    <Link href={`/admin/users/${user.id}/assign`}>
                                      {t("admin.users.reassignProgram")}
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className={user.status === "active" ? "text-destructive" : "text-green-600"}
                                  onClick={() => handleStatusChange(user.id, user.status !== "active")}
                                >
                                  {user.status === "active" ? t("admin.users.deactivate") : t("admin.users.activate")}
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
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
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
