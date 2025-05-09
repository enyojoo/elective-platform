"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { cleanupDialogEffects } from "@/lib/dialog-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataCache } from "@/lib/data-cache-context"
import { useInstitution } from "@/lib/institution-context"

interface DegreeFormData {
  id?: string
  name: string
  nameRu: string
  code: string
  status: string
}

export function DegreesSettings() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const [degrees, setDegrees] = useState<any[]>([])
  const [filteredDegrees, setFilteredDegrees] = useState<any[]>([])
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentDegree, setCurrentDegree] = useState<DegreeFormData>({
    name: "",
    nameRu: "",
    code: "",
    status: "active",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const isMounted = useRef(true)
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dataFetchedRef = useRef(false)

  // Component lifecycle management
  useEffect(() => {
    isMounted.current = true
    dataFetchedRef.current = false

    return () => {
      isMounted.current = false

      // Clear any pending timeouts
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }

      // Force cleanup on unmount
      cleanupDialogEffects()
    }
  }, [])

  // Fetch degrees from cache or Supabase
  useEffect(() => {
    if (!institution?.id || dataFetchedRef.current) return

    const fetchDegrees = async () => {
      try {
        setIsLoading(true)

        // Try to get data from cache first
        const cachedDegrees = getCachedData<any[]>("degrees", institution.id)

        if (cachedDegrees && cachedDegrees.length > 0) {
          console.log("Using cached degrees data")
          const formattedDegrees = cachedDegrees.map((degree) => ({
            id: degree.id.toString(),
            name: degree.name,
            nameRu: degree.name_ru || "",
            code: degree.code,
            status: degree.status,
          }))

          setDegrees(formattedDegrees)
          setFilteredDegrees(formattedDegrees)
          setIsLoading(false)
          dataFetchedRef.current = true
          return
        }

        // If not in cache, fetch from API
        console.log("Fetching degrees data from API")
        const { data, error } = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", institution.id)
          .order("name")

        if (error) throw error

        if (data && isMounted.current) {
          const formattedDegrees = data.map((degree) => ({
            id: degree.id.toString(),
            name: degree.name,
            nameRu: degree.name_ru || "",
            code: degree.code,
            status: degree.status,
          }))

          // Save to cache
          setCachedData("degrees", institution.id, data)

          setDegrees(formattedDegrees)
          setFilteredDegrees(formattedDegrees)
          dataFetchedRef.current = true
        }
      } catch (error: any) {
        console.error("Failed to fetch degrees:", error)
        if (isMounted.current) {
          toast({
            title: t("admin.degrees.error"),
            description: t("admin.degrees.errorFetching"),
            variant: "destructive",
          })
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    fetchDegrees()
  }, [institution?.id, getCachedData, setCachedData, t, toast])

  // Filter degrees based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDegrees(degrees)
      return
    }

    const filtered = degrees.filter(
      (degree) =>
        degree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        degree.nameRu.toLowerCase().includes(searchTerm.toLowerCase()) ||
        degree.code.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    setFilteredDegrees(filtered)
  }, [degrees, searchTerm])

  // Function to safely open the dialog
  const handleOpenDialog = (degree?: (typeof degrees)[0]) => {
    // Ensure body is in normal state before opening dialog
    cleanupDialogEffects()

    if (degree) {
      setCurrentDegree(degree)
      setIsEditing(true)
    } else {
      setCurrentDegree({
        name: "",
        nameRu: "",
        code: "",
        status: "active",
      })
      setIsEditing(false)
    }

    // Small delay to ensure DOM is ready
    setTimeout(() => {
      if (isMounted.current) {
        setIsDialogOpen(true)
      }
    }, 50)
  }

  // Function to safely close the dialog
  const handleCloseDialog = () => {
    if (isMounted.current) {
      setIsDialogOpen(false)

      // Schedule cleanup after animation completes
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current)
      }

      cleanupTimeoutRef.current = setTimeout(() => {
        cleanupDialogEffects()
      }, 300) // 300ms should be enough for most animations
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentDegree({
      ...currentDegree,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing) {
        // Update existing degree
        const { error } = await supabase
          .from("degrees")
          .update({
            name: currentDegree.name,
            name_ru: currentDegree.nameRu,
            code: currentDegree.code,
            status: currentDegree.status,
          })
          .eq("id", currentDegree.id)

        if (error) throw error

        // Update local state
        if (isMounted.current) {
          const updatedDegrees = degrees.map((degree) =>
            degree.id === currentDegree.id ? { ...currentDegree } : degree,
          )

          setDegrees(updatedDegrees)

          // Update cache with the new data
          const rawDegrees = await supabase
            .from("degrees")
            .select("*")
            .eq("institution_id", institution?.id)
            .order("name")

          if (!rawDegrees.error && rawDegrees.data) {
            setCachedData("degrees", institution?.id || "", rawDegrees.data)
          }

          toast({
            title: t("admin.degrees.success"),
            description: t("admin.degrees.degreeUpdated"),
          })
        }
      } else {
        // Add new degree
        const { data, error } = await supabase
          .from("degrees")
          .insert({
            name: currentDegree.name,
            name_ru: currentDegree.nameRu,
            code: currentDegree.code,
            status: currentDegree.status,
            institution_id: institution?.id,
          })
          .select()

        if (error) throw error

        if (data && data[0] && isMounted.current) {
          const newDegree = {
            id: data[0].id.toString(),
            name: data[0].name,
            nameRu: data[0].name_ru || "",
            code: data[0].code,
            status: data[0].status,
          }

          const updatedDegrees = [...degrees, newDegree]
          setDegrees(updatedDegrees)

          // Update cache with the new data
          const rawDegrees = await supabase
            .from("degrees")
            .select("*")
            .eq("institution_id", institution?.id)
            .order("name")

          if (!rawDegrees.error && rawDegrees.data) {
            setCachedData("degrees", institution?.id || "", rawDegrees.data)
          }

          toast({
            title: t("admin.degrees.success"),
            description: t("admin.degrees.degreeCreated"),
          })
        }
      }

      handleCloseDialog()
    } catch (error: any) {
      console.error("Error saving degree:", error)
      if (isMounted.current) {
        toast({
          title: t("admin.degrees.error"),
          description: error.message || t("admin.degrees.errorSaving"),
          variant: "destructive",
        })
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("admin.degrees.deleteConfirm"))) {
      try {
        const { error } = await supabase.from("degrees").delete().eq("id", id)

        if (error) throw error

        if (isMounted.current) {
          const updatedDegrees = degrees.filter((degree) => degree.id !== id)
          setDegrees(updatedDegrees)

          // Update cache with the new data
          const rawDegrees = await supabase
            .from("degrees")
            .select("*")
            .eq("institution_id", institution?.id)
            .order("name")

          if (!rawDegrees.error && rawDegrees.data) {
            setCachedData("degrees", institution?.id || "", rawDegrees.data)
          }

          toast({
            title: t("admin.degrees.success"),
            description: t("admin.degrees.degreeDeleted"),
          })
        }
      } catch (error: any) {
        console.error("Error deleting degree:", error)
        if (isMounted.current) {
          toast({
            title: t("admin.degrees.error"),
            description: error.message || t("admin.degrees.errorDeleting"),
            variant: "destructive",
          })
        }
      }
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      const degree = degrees.find((d) => d.id === id)
      if (!degree) return

      const newStatus = degree.status === "active" ? "inactive" : "active"

      const { error } = await supabase.from("degrees").update({ status: newStatus }).eq("id", id)

      if (error) throw error

      if (isMounted.current) {
        const updatedDegrees = degrees.map((degree) => {
          if (degree.id === id) {
            return {
              ...degree,
              status: newStatus,
            }
          }
          return degree
        })

        setDegrees(updatedDegrees)

        // Update cache with the new data
        const rawDegrees = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", institution?.id)
          .order("name")

        if (!rawDegrees.error && rawDegrees.data) {
          setCachedData("degrees", institution?.id || "", rawDegrees.data)
        }

        toast({
          title: t("admin.degrees.success"),
          description: t("admin.degrees.statusUpdated"),
        })
      }
    } catch (error: any) {
      console.error("Error updating status:", error)
      if (isMounted.current) {
        toast({
          title: t("admin.degrees.error"),
          description: error.message || t("admin.degrees.errorUpdatingStatus"),
          variant: "destructive",
        })
      }
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t(`admin.degrees.${status}`)}
          </Badge>
        )
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t(`admin.degrees.${status}`)}
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{t("admin.degrees.title")}</h2>
          <p className="text-muted-foreground mt-1">{t("admin.degrees.subtitle")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          {t("admin.degrees.addDegree")}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("admin.degrees.searchDegrees")}
                className="pl-8 max-w-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.degrees.nameEn")}</TableHead>
                    <TableHead>{t("admin.degrees.nameRu")}</TableHead>
                    <TableHead>{t("admin.degrees.code")}</TableHead>
                    <TableHead>{t("admin.degrees.status")}</TableHead>
                    <TableHead className="w-[80px]">{t("admin.degrees.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <>
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Skeleton className="w-full h-10" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Skeleton className="w-full h-10" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Skeleton className="w-full h-10" />
                        </TableCell>
                      </TableRow>
                    </>
                  ) : filteredDegrees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {t("admin.degrees.noDegreesFound")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDegrees.map((degree) => (
                      <TableRow key={degree.id}>
                        <TableCell className="font-medium">{degree.name}</TableCell>
                        <TableCell>{degree.nameRu}</TableCell>
                        <TableCell>{degree.code}</TableCell>
                        <TableCell>{getStatusBadge(degree.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(degree)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                {t("admin.degrees.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(degree.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("admin.degrees.delete")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleStatus(degree.id)}>
                                {degree.status === "active"
                                  ? t("admin.degrees.deactivate")
                                  : t("admin.degrees.activate")}
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
          </div>
        </CardContent>
      </Card>

      {/* Only render dialog when it's open to avoid issues */}
      {isDialogOpen && (
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseDialog()
            }
          }}
        >
          <DialogContent
            className="sm:max-w-[500px]"
            onEscapeKeyDown={() => handleCloseDialog()}
            onInteractOutside={() => handleCloseDialog()}
            onPointerDownOutside={(e) => {
              e.preventDefault()
              handleCloseDialog()
            }}
          >
            <DialogHeader>
              <DialogTitle>{isEditing ? t("admin.degrees.editDegree") : t("admin.degrees.addNewDegree")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("admin.degrees.nameEn")}</Label>
                  <Input id="name" name="name" value={currentDegree.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameRu">{t("admin.degrees.nameRu")}</Label>
                  <Input id="nameRu" name="nameRu" value={currentDegree.nameRu} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t("admin.degrees.code")}</Label>
                  <Input id="code" name="code" value={currentDegree.code} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("admin.degrees.status")}</Label>
                  <select
                    id="status"
                    name="status"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    value={currentDegree.status}
                    onChange={(e) => setCurrentDegree({ ...currentDegree, status: e.target.value })}
                  >
                    <option value="active">{t("admin.degrees.active")}</option>
                    <option value="inactive">{t("admin.degrees.inactive")}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCloseDialog()
                  }}
                >
                  {t("admin.degrees.cancel")}
                </Button>
                <Button type="submit">{isEditing ? t("admin.degrees.update") : t("admin.degrees.create")}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
