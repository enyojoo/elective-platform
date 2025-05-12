"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Search, MoreHorizontal, Filter, AlertCircle, Trash2, Save } from "lucide-react"
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
import { useCachedDegrees } from "@/hooks/use-cached-degrees"
import { useCachedGroups } from "@/hooks/use-cached-groups"

export function UsersSettings() {
  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const { users: cachedUsers, isLoading, error, isInitialDataLoaded } = useCachedUsers(institution?.id)
  const { degrees } = useCachedDegrees(institution?.id)
  const { groups } = useCachedGroups(institution?.id)
  const { invalidateCache } = useDataCache()

  // Create a local copy of users that we can modify directly
  const [users, setUsers] = useState<any[]>([])
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // User deletion state
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const { isOpen: isDeleteDialogOpen, openDialog: openDeleteDialog, closeDialog: closeDeleteDialog } = useDialogState()
  const [isDeleting, setIsDeleting] = useState(false)

  // User edit state
  const { isOpen: isEditDialogOpen, openDialog: openEditDialog, closeDialog: closeEditDialog } = useDialogState()
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString())

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Initialize local users state from cached users
  useEffect(() => {
    if (cachedUsers && cachedUsers.length > 0) {
      setUsers([...cachedUsers])
    }
  }, [cachedUsers])

  // Apply filters to users whenever users or filter criteria change
  const applyFilters = useCallback(() => {
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

    // Adjust current page if it's now out of bounds
    if (currentPage > Math.ceil(result.length / itemsPerPage) && result.length > 0) {
      setCurrentPage(1)
    }
  }, [users, searchTerm, roleFilter, statusFilter, itemsPerPage, currentPage])

  // Apply filters whenever relevant state changes
  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, roleFilter, statusFilter, applyFilters])

  // Filter groups based on selected degree
  useEffect(() => {
    if (editingUser?.degreeId && groups && groups.length > 0) {
      const filtered = groups.filter((group) => group.degreeId === editingUser.degreeId)
      setFilteredGroups(filtered)

      // Reset group selection if current selection is not valid for new degree
      if (editingUser.groupId && !filtered.find((g) => g.id === editingUser.groupId)) {
        setEditingUser((prev) => ({ ...prev, groupId: "" }))
      }
    } else {
      setFilteredGroups([])
    }
  }, [editingUser?.degreeId, groups])

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
      // Update local state immediately before API call for better UX
      const updatedUsers = users.map((user) => {
        if (user.id === userId) {
          return {
            ...user,
            status: newStatus ? "active" : "inactive",
          }
        }
        return user
      })

      // Update the users state with the new array
      setUsers(updatedUsers)

      // Make the API call
      const { error } = await supabase.from("profiles").update({ is_active: newStatus }).eq("id", userId)

      if (error) throw error

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

      // Revert the UI changes on error by resetting to cached users
      if (cachedUsers) {
        setUsers([...cachedUsers])
      }
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
      // Update local state immediately before API call for better UX
      const updatedUsers = users.filter((user) => user.id !== userToDelete)
      setUsers(updatedUsers)

      // Close dialog immediately for better UX
      handleCloseDeleteDialog()

      // Make the API call
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
    } catch (error: any) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message}`,
        variant: "destructive",
      })

      // Revert the UI changes on error by resetting to cached users
      if (cachedUsers) {
        setUsers([...cachedUsers])
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle opening edit dialog
  const handleEditUser = (userId: string) => {
    const userToEdit = users.find((user) => user.id === userId)
    if (userToEdit) {
      setEditingUser({
        id: userToEdit.id,
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        status: userToEdit.status,
        degreeId: userToEdit.degreeId || "",
        groupId: userToEdit.groupId || "",
        year: userToEdit.year || "",
      })
      openEditDialog()
    }
  }

  const handleCloseEditDialog = () => {
    closeEditDialog()
    setTimeout(() => {
      setEditingUser(null)
      cleanupDialogEffects()
    }, 300)
  }

  const handleEditInputChange = (field: string, value: string) => {
    setEditingUser((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    setIsSaving(true)
    try {
      // Prepare update data
      const updateData = {
        full_name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        is_active: editingUser.status === "active",
        updated_at: new Date().toISOString(),
      }

      // Add role-specific fields
      if (editingUser.role === UserRole.STUDENT || editingUser.role === UserRole.PROGRAM_MANAGER) {
        updateData.degree_id = editingUser.degreeId || null
        updateData.academic_year = editingUser.year || null

        // Only add group_id for students
        if (editingUser.role === UserRole.STUDENT) {
          updateData.group_id = editingUser.groupId || null
        }
      }

      // Update local state immediately for better UX
      const updatedUsers = users.map((user) => {
        if (user.id === editingUser.id) {
          const updatedUser = {
            ...user,
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
            status: editingUser.status,
            degreeId: editingUser.degreeId || "",
            groupId: editingUser.role === UserRole.STUDENT ? editingUser.groupId || "" : "",
            year: editingUser.year || "",
            // Update related display fields
            degreeName: degrees.find((d) => d.id === editingUser.degreeId)?.name || "",
            groupName:
              editingUser.role === UserRole.STUDENT ? groups.find((g) => g.id === editingUser.groupId)?.name || "" : "",
          }
          return updatedUser
        }
        return user
      })

      // Update the users state with the new array
      setUsers(updatedUsers)

      // Close dialog immediately for better UX
      handleCloseEditDialog()

      // Make the API call
      const { error } = await supabase.from("profiles").update(updateData).eq("id", editingUser.id)

      if (error) throw error

      // Invalidate the users cache
      if (institution?.id) {
        invalidateCache("users", institution.id)
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      })

      // Revert the UI changes on error by resetting to cached users
      if (cachedUsers) {
        setUsers([...cachedUsers])
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Show skeleton only for initial data load
  const showSkeleton = isLoading && !isInitialDataLoaded && (!users || users.length === 0)

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
          if (!open) handleCloseEditDialog()
        }}
      >
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t("admin.users.edit")}</DialogTitle>
            <DialogDescription>{t("admin.settings.subtitle")}</DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("admin.users.name")}</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => handleEditInputChange("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">{t("admin.users.email")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => handleEditInputChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">{t("admin.users.role")}</Label>
                <Select value={editingUser.role} onValueChange={(value) => handleEditInputChange("role", value)}>
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder={t("admin.users.role")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.STUDENT}>{t("admin.users.student")}</SelectItem>
                    <SelectItem value={UserRole.PROGRAM_MANAGER}>{t("admin.users.program_manager")}</SelectItem>
                    <SelectItem value={UserRole.ADMIN}>{t("admin.users.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">{t("admin.users.status")}</Label>
                <Select value={editingUser.status} onValueChange={(value) => handleEditInputChange("status", value)}>
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder={t("admin.users.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.users.active")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.users.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student-specific fields */}
              {editingUser.role === UserRole.STUDENT && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-degree">{t("admin.users.degree")}</Label>
                    <Select
                      value={editingUser.degreeId}
                      onValueChange={(value) => handleEditInputChange("degreeId", value)}
                    >
                      <SelectTrigger id="edit-degree">
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
                    <Label htmlFor="edit-group">{t("admin.users.group")}</Label>
                    <Select
                      value={editingUser.groupId}
                      onValueChange={(value) => handleEditInputChange("groupId", value)}
                      disabled={!editingUser.degreeId || filteredGroups.length === 0}
                    >
                      <SelectTrigger id="edit-group">
                        <SelectValue placeholder={t("admin.users.group")} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredGroups.length > 0 ? (
                          filteredGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name || group.displayName}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            {t("admin.groups.noGroups")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-year">{t("admin.users.year")}</Label>
                    <Select value={editingUser.year} onValueChange={(value) => handleEditInputChange("year", value)}>
                      <SelectTrigger id="edit-year">
                        <SelectValue placeholder={t("admin.users.selectYear")} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Program Manager specific fields */}
              {editingUser.role === UserRole.PROGRAM_MANAGER && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-manager-degree">{t("admin.users.degree")}</Label>
                    <Select
                      value={editingUser.degreeId}
                      onValueChange={(value) => handleEditInputChange("degreeId", value)}
                    >
                      <SelectTrigger id="edit-manager-degree">
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
                    <Label htmlFor="edit-manager-year">{t("admin.users.year")}</Label>
                    <Select value={editingUser.year} onValueChange={(value) => handleEditInputChange("year", value)}>
                      <SelectTrigger id="edit-manager-year">
                        <SelectValue placeholder={t("admin.users.selectYear")} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCloseEditDialog} disabled={isSaving}>
              {t("admin.users.cancel")}
            </Button>
            <Button type="button" onClick={handleSaveUser} disabled={isSaving}>
              {isSaving ? (
                <span className="mr-2">{t("settings.branding.saving")}</span>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("settings.branding.save")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
