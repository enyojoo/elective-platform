"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Plus, Search, Edit, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Badge } from "@/components/ui/badge"
import { useInstitution } from "@/lib/institution-context"
import { useCachedUsers } from "@/hooks/use-cached-users"
import { EditUserDialog } from "./edit-user-dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { useLanguage } from "@/lib/language-context"

export function UsersSettings() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { users, isLoading, isInitialDataLoaded } = useCachedUsers(institution?.id)
  const { toast } = useToast()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<any[]>([])
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Filter users based on search term
  useEffect(() => {
    if (!users) return

    if (!searchTerm) {
      setFilteredUsers(users)
      return
    }

    const lowercasedSearch = searchTerm.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowercasedSearch) ||
        user.email.toLowerCase().includes(lowercasedSearch) ||
        t(`roles.${user.role.toLowerCase()}`).toLowerCase().includes(lowercasedSearch),
    )

    setFilteredUsers(filtered)
  }, [users, searchTerm, t])

  const handleEditUser = (userId: string) => {
    setEditUserId(userId)
    setIsEditDialogOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t("admin.settings.users.confirmDelete"))) return

    try {
      // First check if this is the only admin
      if (users.find((u) => u.id === userId)?.role === "admin") {
        const adminCount = users.filter((u) => u.role === "admin").length
        if (adminCount <= 1) {
          toast({
            title: t("common.error"),
            description: t("admin.settings.users.lastAdminError"),
            variant: "destructive",
          })
          return
        }
      }

      // Deactivate user instead of deleting
      const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", userId)

      if (error) throw error

      toast({
        title: t("common.success"),
        description: t("admin.settings.users.deactivateSuccess"),
      })

      // Refresh the user list
      window.location.reload()
    } catch (error) {
      console.error("Error deactivating user:", error)
      toast({
        title: t("common.error"),
        description: t("admin.settings.users.deactivateError"),
        variant: "destructive",
      })
    }
  }

  const handleUserUpdated = () => {
    // Refresh the user list
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("admin.settings.users.search")}
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.settings.users.addUser")}
        </Button>
      </div>

      {isLoading && !isInitialDataLoaded ? (
        <TableSkeleton columns={5} rows={5} />
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.settings.users.name")}</TableHead>
                <TableHead>{t("admin.settings.users.email")}</TableHead>
                <TableHead>{t("admin.settings.users.role")}</TableHead>
                <TableHead>{t("admin.settings.users.status")}</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchTerm ? t("admin.settings.users.noResults") : t("admin.settings.users.noUsers")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{t(`roles.${user.role.toLowerCase()}`)}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>
                        {t(`status.${user.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">{t("common.openMenu")}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("common.delete")}
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
      )}

      {/* Edit User Dialog */}
      {editUserId && (
        <EditUserDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          userId={editUserId}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  )
}
