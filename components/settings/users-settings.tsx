"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Search, MoreHorizontal, Filter, AlertCircle, Trash2 } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { UserRole } from "@/lib/types"

export function UsersSettings() {
  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const { users, isLoading, error, isInitialDataLoaded } = useCachedUsers(institution?.id)
  const { invalidateCache } = useDataCache()
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const { isOpen: isDeleteDialogOpen, openDialog: openDeleteDialog, closeDialog: closeDeleteDialog } = useDialogState()
  const [isDeleting, setIsDeleting] = useState(false)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    degreeId: "",
    groupId: "",
    year: "",
  })
  const [degrees, setDegrees] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Initialize filteredUsers with users data when it becomes available
  useEffect(() => {
    if (users && users.length > 0) {
      setFilteredUsers(users)
      setTotalPages(Math.ceil(users.length / itemsPerPage))
    }
  }, [users, itemsPerPage])

  // Filter users based on search term and filters
  useEffect(() => {
    if (!users || users.length === 0) return

    let result = [...users]

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

  // Handle user status change
  const handleStatusChange = async (userId: string, newStatus: boolean) => {
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

      // Update filtered users
      setFilteredUsers((prevFiltered) =>
        prevFiltered.map((user) => {
          if (user.id === userId) {
            return {
              ...user,
              status: newStatus ? "active" : "inactive",
            }
          }
          return user
        }),
      )

      // Invalidate the users cache
      if (institution?.id) {
        invalidateCache("users", institution.id)
      }

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
        invalidateCache("users", institution.id)
      }

      toast({
        title: "Success",
        description: "User has been deleted successfully",
      })

      // Update the filtered users list
      setFilteredUsers(filteredUsers.filter((user) => user.id !== userToDelete))

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

  // Show skeleton only for initial data load
  const showSkeleton = isLoading && !isInitialDataLoaded && (!users || users.length === 0)

  useEffect(() => {
    const fetchReferenceData = async () => {
      if (!institution?.id) return

      try {
        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (degreesError) throw degreesError

        // Fetch groups
        const { data: groupsData, error: groupsError } = await supabase
          .from("groups")
          .select("id, name, degree_id, program_id, academic_year_id")
          .eq("institution_id", institution.id)
          .eq("status", "active")

        if (groupsError) throw groupsError

        setDegrees(degreesData || [])
        setGroups(groupsData || [])
      } catch (error) {
        console.error("Error fetching reference data:", error)
        toast({
          title: "Error",
          description: "Failed to load reference data",
          variant: "destructive",
        })
      }
    }

    fetchReferenceData()
  }, [institution?.id, supabase, toast])

  // Add this useEffect to filter groups based on selected degree
  useEffect(() => {
    if (editFormData.degreeId) {
      const filtered = groups.filter((group) => group.degree_id === editFormData.degreeId)
      setFilteredGroups(filtered)
      // Reset group selection if current selection is not valid for new degree
      if (!filtered.find((g) => g.id === editFormData.groupId)) {
        setEditFormData((prev) => ({ ...prev, groupId: "" }))
      }
    } else {
      setFilteredGroups([])
      setEditFormData((prev) => ({ ...prev, groupId: "" }))
    }
  }, [editFormData.degreeId, groups, editFormData.groupId])

  // Add this function to handle opening the edit dialog
  const handleEditUser = async (userId: string) => {
    // Find the user in the filtered users
    const userToEdit = filteredUsers.find((user) => user.id === userId)

    if (!userToEdit) {
      toast({
        title: "Error",
        description: "User not found",
        variant: "destructive",
      })
      return
    }

    setEditingUser(userToEdit)

    // Fetch the complete user data from Supabase
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError

      // Set the form data
      setEditFormData({
        name: profileData.full_name || "",
        email: profileData.email || "",
        role: profileData.role || "",
        status: profileData.is_active ? "active" : "inactive",
        degreeId: profileData.degree_id || "",
        groupId: profileData.group_id || "",
        year: profileData.academic_year || "",
      })

      setIsEditDialogOpen(true)
    } catch (error: any) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: `Failed to load user data: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  // Add this function to handle form input changes
  const handleFormInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Add this function to handle form submission
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsSaving(true)

    try {
      // Update the user profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: editFormData.name,
          email: editFormData.email,
          role: editFormData.role,
          is_active: editFormData.status === "active",
          degree_id: editFormData.degreeId || null,
          group_id: editFormData.groupId || null,
          academic_year: editFormData.year || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingUser.id)

      if (updateError) throw updateError

      // Invalidate the users cache
      if (institution?.id) {
        invalidateCache("users", institution.id)
      }

      // Update the filtered users list
      setFilteredUsers(
        filteredUsers.map((user) => {
          if (user.id === editingUser.id) {
            return {
              ...user,
              name: editFormData.name,
              email: editFormData.email,
              role: editFormData.role,
              status: editFormData.status,
              degreeId: editFormData.degreeId,
              degreeName: degrees.find((d) => d.id === editFormData.degreeId)?.name || "",
              groupId: editFormData.groupId,
              groupName: groups.find((g) => g.id === editFormData.groupId)?.name || "",
              year: editFormData.year,
            }
          }
          return user
        }),
      )

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      // Close the dialog
      setIsEditDialogOpen(false)
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
                          <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                            {t("admin.users.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={user.status === "active" ? "text-destructive" : "text-green-600"}
                            onClick={() => handleStatusChange(user.id, user.status !== "active")}
                          >
                            {user.status === "active" ? t("admin.users.deactivate") : t("admin.users.activate")}
                          </DropdownMenuItem>
                          {/* Only show delete option for non-admin users or if current admin is viewing other admin users */}
                          {(user.role !== "admin" ||
                            (user.role === "admin" &&
                              user.id !== users.find((u) => u.role === "admin" && u.status === "active")?.id)) && (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteUser(user.id)}>
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

      {/* Edit User Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsEditDialogOpen(false)
        }}
      >
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.users.editUser")}</DialogTitle>
            <DialogDescription>{t("admin.users.editUserDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("admin.users.fullName")}</Label>
                  <Input
                    id="name"
                    value={editFormData.name}
                    onChange={(e) => handleFormInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("admin.users.emailAddress")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => handleFormInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">{t("admin.users.userRole")}</Label>
                  <Select value={editFormData.role} onValueChange={(value) => handleFormInputChange("role", value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder={t("admin.users.selectRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.STUDENT}>{t("admin.users.student")}</SelectItem>
                      <SelectItem value={UserRole.PROGRAM_MANAGER}>{t("admin.users.program_manager")}</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>{t("admin.users.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t("admin.users.status")}</Label>
                  <Select value={editFormData.status} onValueChange={(value) => handleFormInputChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder={t("admin.users.selectStatus")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t("admin.users.active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.users.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Student-specific fields */}
              {editFormData.role === UserRole.STUDENT && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degreeId">{t("admin.users.degree")}</Label>
                    <Select
                      value={editFormData.degreeId}
                      onValueChange={(value) => handleFormInputChange("degreeId", value)}
                    >
                      <SelectTrigger id="degreeId">
                        <SelectValue placeholder={t("admin.users.selectDegree")} />
                      </SelectTrigger>
                      <SelectContent>
                        {degrees.map((degree) => (
                          <SelectItem key={degree.id} value={degree.id.toString()}>
                            {degree.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupId">{t("admin.users.group")}</Label>
                    <Select
                      value={editFormData.groupId}
                      onValueChange={(value) => handleFormInputChange("groupId", value)}
                      disabled={!editFormData.degreeId || filteredGroups.length === 0}
                    >
                      <SelectTrigger id="groupId">
                        <SelectValue placeholder={t("admin.users.selectGroup")} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">{t("admin.users.year")}</Label>
                    <Select value={editFormData.year} onValueChange={(value) => handleFormInputChange("year", value)}>
                      <SelectTrigger id="year">
                        <SelectValue placeholder={t("admin.users.selectYear")} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Program Manager-specific fields */}
              {editFormData.role === UserRole.PROGRAM_MANAGER && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerDegree">{t("admin.users.degree")}</Label>
                    <Select
                      value={editFormData.degreeId}
                      onValueChange={(value) => handleFormInputChange("degreeId", value)}
                    >
                      <SelectTrigger id="managerDegree">
                        <SelectValue placeholder={t("admin.users.selectDegree")} />
                      </SelectTrigger>
                      <SelectContent>
                        {degrees.map((degree) => (
                          <SelectItem key={degree.id} value={degree.id.toString()}>
                            {degree.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="managerYear">{t("admin.users.year")}</Label>
                    <Select value={editFormData.year} onValueChange={(value) => handleFormInputChange("year", value)}>
                      <SelectTrigger id="managerYear">
                        <SelectValue placeholder={t("admin.users.selectYear")} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
                {t("admin.users.cancel")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("admin.users.saving") : t("admin.users.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
