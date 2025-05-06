"use client"

import { useState, useEffect, useRef } from "react"
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
import { Search, MoreHorizontal, Filter, UserPlus, AlertCircle } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useDataCache } from "@/lib/data-cache-context"

export default function UsersPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const isMounted = useRef(true)
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()

  // Component lifecycle management
  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch users from Supabase with caching
  useEffect(() => {
    const fetchUsers = async () => {
      if (!institution?.id) return

      try {
        setIsLoading(true)
        setError(null)

        // Try to get data from cache first
        const cachedUsers = getCachedData<any[]>("users", institution.id)

        if (cachedUsers) {
          console.log("Using cached users data")
          setUsers(cachedUsers)
          setFilteredUsers(cachedUsers)
          setTotalPages(Math.ceil(cachedUsers.length / itemsPerPage))
          setIsLoading(false)
          return
        }

        // Fetch profiles with role information
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, is_active, group_id, program_id, degree_id, enrollment_year, institution_id",
          )
          .eq("institution_id", institution.id)
          .order("full_name")

        if (profilesError) throw profilesError

        if (!profilesData) {
          setUsers([])
          setFilteredUsers([])
          setTotalPages(0)
          setIsLoading(false)
          return
        }

        // Fetch related data for programs and degrees
        const programIds = [...new Set(profilesData.map((p) => p.program_id).filter(Boolean))]
        const degreeIds = [...new Set(profilesData.map((p) => p.degree_id).filter(Boolean))]
        const groupIds = [...new Set(profilesData.map((p) => p.group_id).filter(Boolean))]

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name")
          .in("id", programIds.length > 0 ? programIds : [0])

        if (programsError) throw programsError

        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .in("id", degreeIds.length > 0 ? degreeIds : [0])

        if (degreesError) throw degreesError

        // Create maps for quick lookups
        const programMap = new Map()
        if (programsData) {
          programsData.forEach((program) => {
            programMap.set(program.id, program.name)
          })
        }

        const degreeMap = new Map()
        if (degreesData) {
          degreesData.forEach((degree) => {
            degreeMap.set(degree.id, degree.name)
          })
        }

        // Format the users data
        const formattedUsers = profilesData.map((profile) => ({
          id: profile.id,
          name: profile.full_name || "Unknown",
          email: profile.email || "",
          role: profile.role || "unknown",
          programId: profile.program_id,
          programName: programMap.get(profile.program_id) || "",
          degreeId: profile.degree_id,
          degreeName: degreeMap.get(profile.degree_id) || "",
          enrollmentYear: profile.enrollment_year || "",
          groupId: profile.group_id,
          status: profile.is_active ? "active" : "inactive",
        }))

        // Save to cache
        setCachedData("users", institution.id, formattedUsers)

        if (isMounted.current) {
          setUsers(formattedUsers)
          setFilteredUsers(formattedUsers)
          setTotalPages(Math.ceil(formattedUsers.length / itemsPerPage))
        }
      } catch (error: any) {
        console.error("Failed to fetch users:", error)
        if (isMounted.current) {
          setError(error.message || t("admin.users.errorFetching"))
          toast({
            title: t("admin.users.error"),
            description: error.message || t("admin.users.errorFetching"),
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchUsers()
  }, [t, toast, institution?.id, getCachedData, setCachedData, itemsPerPage])

  // Filter users based on search term and filters
  useEffect(() => {
    let result = users || []

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
  }, [searchTerm, roleFilter, statusFilter, users, itemsPerPage])

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
    if (!institution?.id) return

    try {
      const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", userId)

      if (error) throw error

      // Update local state
      const updatedUsers = users.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            status: newStatus ? "active" : "inactive",
          }
        }
        return user
      })

      setUsers(updatedUsers)

      // Update cache
      setCachedData("users", institution.id, updatedUsers)

      toast({
        title: "Success",
        description: newStatus ? "User has been activated" : "User has been deactivated",
      })
    } catch (error: any) {
      console.error("Error updating user status:", error)
      toast({
        title: "Error",
        description: `Failed to update user status: ${error.message}`,
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
