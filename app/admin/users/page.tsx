"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Search, MoreHorizontal, Filter, AlertCircle, Trash2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useCachedUsers } from "@/hooks/use-cached-users"
import { useDataCache } from "@/lib/data-cache-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cleanupDialogEffects } from "@/lib/dialog-utils"
import { useDialogState } from "@/hooks/use-dialog-state"
import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function UsersPage() {
  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const { users, isLoading, error, refreshUsers } = useCachedUsers(institution?.id)
  const { invalidateCache } = useDataCache()

  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const { isOpen: isDeleteDialogOpen, openDialog: openDeleteDialog, closeDialog: closeDeleteDialog } = useDialogState()
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Use useMemo for filtered users to avoid unnecessary recalculations
  const filteredUsers = useMemo(() => {
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

    return result
  }, [users, searchTerm, roleFilter, statusFilter])

  // Calculate total pages based on filtered users
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage))

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  // Ensure current page is valid
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Get current page items
  const currentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }, [filteredUsers, currentPage, itemsPerPage])

  // Helper function to get role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">{t("admin.users.admin")}</Badge>
        )
      case "program_manager":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
            {t("admin.users.program_manager")}
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

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      await refreshUsers()
      toast({
        title: "Success",
        description: "User data refreshed successfully",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", userId)

      if (error) throw error

      // Invalidate the users cache
      if (institution?.id) {
        invalidateCache(`users-${institution.id}`)
      }

      // Refresh the data
      await refreshUsers()

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

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId)
    openDeleteDialog()
  }

  const handleCloseDeleteDialog = () => {
    closeDeleteDialog()
    setTimeout(() => {
      setUserToDelete(null)
      cleanupDialogEffects()
    }, 300)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    setIsDeleting(true)
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userToDelete)

      if (error) throw error

      // Invalidate the users cache
      if (institution?.id) {
        invalidateCache(`users-${institution.id}`)
      }

      // Refresh the data
      await refreshUsers()

      toast({
        title: "Success",
        description: "User has been deleted successfully",
      })

      handleCloseDeleteDialog()
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Determine if we should show the skeleton
  const showSkeleton = isLoading && users.length === 0

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.users.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.users.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {t("admin.users.refresh")}
            </Button>
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
                      <SelectItem value="program_manager">{t("admin.users.program_manager")}</SelectItem>
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
                      <TableHead>{t("admin.users.group")}</TableHead>
                      <TableHead>{t("admin.users.year")}</TableHead>
                      <TableHead>{t("admin.users.status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.users.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {showSkeleton ? (
                      <TableSkeleton columns={8} rows={5} />
                    ) : currentPageItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {t("admin.users.noUsersFound") || "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentPageItems.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>{user.degreeName}</TableCell>
                          <TableCell>{user.groupName}</TableCell>
                          <TableCell>{user.year}</TableCell>
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
                                {user.role === "program_manager" && (
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
                                {/* Only show delete option for non-admin users or if current admin is viewing other admin users */}
                                {(user.role !== "admin" ||
                                  (user.role === "admin" &&
                                    user.id !==
                                      users.find((u) => u.role === "admin" && u.status === "active")?.id)) && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDeleteUser(user.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t("admin.users.delete")}
                                  </DropdownMenuItem>
                                )}
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

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around the current page
                      let pageToShow = currentPage
                      if (currentPage <= 3) {
                        // At the beginning, show first 5 pages
                        pageToShow = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        // At the end, show last 5 pages
                        pageToShow = totalPages - 4 + i
                      } else {
                        // In the middle, show 2 before and 2 after current page
                        pageToShow = currentPage - 2 + i
                      }

                      // Ensure page is within valid range
                      if (pageToShow > 0 && pageToShow <= totalPages) {
                        return (
                          <PaginationItem key={pageToShow}>
                            <PaginationLink
                              href="#"
                              isActive={pageToShow === currentPage}
                              onClick={(e) => {
                                e.preventDefault()
                                setCurrentPage(pageToShow)
                              }}
                            >
                              {pageToShow}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }
                      return null
                    })}

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
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog()
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("admin.users.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("admin.users.deleteConfirmMessage")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCloseDeleteDialog} disabled={isDeleting}>
              {t("admin.users.cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <span className="mr-2">{t("admin.users.deleting")}</span>
                </>
              ) : (
                t("admin.users.confirmDelete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
