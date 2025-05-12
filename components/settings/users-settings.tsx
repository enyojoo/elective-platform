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
import Link from "next/link"
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

  const [userToEdit, setUserToEdit] = useState<any | null>(null)
  const { isOpen: isEditDialogOpen, openDialog: openEditDialog, closeDialog: closeEditDialog } = useDialogState()
  const [isUpdating, setIsUpdating] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "",
    status: "",
    degreeId: "",
    groupId: "",
    year: "",
  })
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])

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

  const handleEditUser = (user: any) => {
    setUserToEdit(user)
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      degreeId: user.degreeId || "",
      groupId: user.groupId || "",
      year: user.year || "",
    })
    openEditDialog()
  }

  const handleCloseEditDialog = () => {
    closeEditDialog()
    setTimeout(() => {
      setUserToEdit(null)
      cleanupDialogEffects()
    }, 300)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))

    // If degree changes, filter groups
    if (name === "degreeId" && value) {
      const filtered = users
        .filter((user) => user.groupId)
        .filter((user) => user.degreeId === value)
        .map((user) => ({ id: user.groupId, name: user.groupName }))
        .filter((group, index, self) => index === self.findIndex((g) => g.id === group.id))
      setFilteredGroups(filtered)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editFormData.name,
          email: editFormData.email,
          role: editFormData.role,
          is_active: editFormData.status === "active",
        })
        .eq("id", userToEdit.id)

      if (profileError) throw profileError

      // Handle student-specific data
      if (editFormData.role === "student") {
        // Check if student profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("student_profiles")
          .select("profile_id")
          .eq("profile_id", userToEdit.id)
          .maybeSingle()

        if (checkError) throw checkError

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("student_profiles")
            .update({
              group_id: editFormData.groupId,
              year: editFormData.year,
              degree_id: editFormData.degreeId,
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", userToEdit.id)

          if (updateError) throw updateError
        } else if (editFormData.groupId && editFormData.year && editFormData.degreeId) {
          // Create new profile
          const { error: insertError } = await supabase.from("student_profiles").insert({
            profile_id: userToEdit.id,
            group_id: editFormData.groupId,
            year: editFormData.year,
            degree_id: editFormData.degreeId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) throw insertError
        }
      }

      // Handle manager-specific data
      if (editFormData.role === "program_manager") {
        // Check if manager profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from("manager_profiles")
          .select("profile_id")
          .eq("profile_id", userToEdit.id)
          .maybeSingle()

        if (checkError) throw checkError

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabase
            .from("manager_profiles")
            .update({
              degree_id: editFormData.degreeId,
              updated_at: new Date().toISOString(),
            })
            .eq("profile_id", userToEdit.id)

          if (updateError) throw updateError
        } else if (editFormData.degreeId) {
          // Create new profile
          const { error: insertError } = await supabase.from("manager_profiles").insert({
            profile_id: userToEdit.id,
            degree_id: editFormData.degreeId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) throw insertError
        }
      }

      // Invalidate the users cache
      if (institution?.id) {
        invalidateCache("users", institution.id)
      }

      toast({
        title: t("admin.users.updateSuccess"),
        description: t("admin.users.updateSuccessDesc"),
      })

      handleCloseEditDialog()
    } catch (error: any) {
      console.error("Error updating user:", error)
      toast({
        title: t("admin.users.updateError"),
        description: error.message || t("admin.users.updateErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
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
                          <DropdownMenuItem>
                            <Link
                              href={`/admin/users/${user.id}`}
                              onClick={(e) => {
                                e.preventDefault()
                                handleEditUser(user)
                              }}
                            >
                              {t("admin.users.edit")}
                            </Link>
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
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("admin.users.editUserTitle")}</DialogTitle>
            <DialogDescription>{t("admin.users.editUserDescription")}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateUser} className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("admin.users.name")}</Label>
                <Input id="name" name="name" value={editFormData.name} onChange={handleEditFormChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("admin.users.email")}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t("admin.users.role")}</Label>
                <Select
                  name="role"
                  value={editFormData.role}
                  onValueChange={(value) => handleEditFormChange({ target: { name: "role", value } } as any)}
                >
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
                <Select
                  name="status"
                  value={editFormData.status}
                  onValueChange={(value) => handleEditFormChange({ target: { name: "status", value } } as any)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t("admin.users.selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.users.active")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.users.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student-specific fields */}
              {editFormData.role === UserRole.STUDENT && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="degreeId">{t("admin.users.degree")}</Label>
                    <Select
                      name="degreeId"
                      value={editFormData.degreeId}
                      onValueChange={(value) => handleEditFormChange({ target: { name: "degreeId", value } } as any)}
                    >
                      <SelectTrigger id="degreeId">
                        <SelectValue placeholder={t("admin.users.selectDegree")} />
                      </SelectTrigger>
                      <SelectContent>
                        {users
                          .filter((user) => user.degreeId)
                          .map((user) => ({ id: user.degreeId, name: user.degreeName }))
                          .filter((degree, index, self) => index === self.findIndex((d) => d.id === degree.id))
                          .map((degree) => (
                            <SelectItem key={degree.id} value={degree.id}>
                              {degree.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupId">{t("admin.users.group")}</Label>
                    <Select
                      name="groupId"
                      value={editFormData.groupId}
                      onValueChange={(value) => handleEditFormChange({ target: { name: "groupId", value } } as any)}
                      disabled={!editFormData.degreeId}
                    >
                      <SelectTrigger id="groupId">
                        <SelectValue
                          placeholder={
                            editFormData.degreeId ? t("admin.users.selectGroup") : t("admin.users.selectDegreeFirst")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">{t("admin.users.year")}</Label>
                    <Select
                      name="year"
                      value={editFormData.year}
                      onValueChange={(value) => handleEditFormChange({ target: { name: "year", value } } as any)}
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder={t("admin.users.selectYear")} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Program Manager-specific fields */}
              {editFormData.role === UserRole.PROGRAM_MANAGER && (
                <div className="space-y-2">
                  <Label htmlFor="degreeId">{t("admin.users.degree")}</Label>
                  <Select
                    name="degreeId"
                    value={editFormData.degreeId}
                    onValueChange={(value) => handleEditFormChange({ target: { name: "degreeId", value } } as any)}
                  >
                    <SelectTrigger id="degreeId">
                      <SelectValue placeholder={t("admin.users.selectDegree")} />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((user) => user.degreeId)
                        .map((user) => ({ id: user.degreeId, name: user.degreeName }))
                        .filter((degree, index, self) => index === self.findIndex((d) => d.id === degree.id))
                        .map((degree) => (
                          <SelectItem key={degree.id} value={degree.id}>
                            {degree.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleCloseEditDialog} disabled={isUpdating}>
                {t("admin.users.cancel")}
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? t("admin.users.updating") : t("admin.users.update")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
