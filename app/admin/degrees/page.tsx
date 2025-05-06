"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
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

export default function DegreesPage() {
  const { t } = useLanguage()
  // Initialize state variables outside the useEffect hook
  const [degrees, setDegrees] = useState<any[]>([])
  const [filteredDegrees, setFilteredDegrees] = useState<any[]>([])
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentDegree, setCurrentDegree] = useState<DegreeFormData>({
    name: "",
    nameRu: "",
    code: "",
    durationYears: 2,
    status: "active",
  })
  const [isEditing, setIsEditing] = useState(false)

  // Fetch degrees from Supabase
  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        const { data, error } = await supabase
          .from("degrees")
          .select("*")
          .eq("institution_id", 1) // In a real app, you would get the institution_id from context
          .order("name")

        if (error) throw error

        if (data) {
          const formattedDegrees = data.map((degree) => ({
            id: degree.id.toString(),
            name: degree.name,
            nameRu: degree.name_ru,
            code: degree.code,
            durationYears: degree.duration_years,
            status: degree.status,
          }))

          setDegrees(formattedDegrees)
          setFilteredDegrees(formattedDegrees)
        }
      } catch (error) {
        console.error("Failed to fetch degrees:", error)
        toast({
          title: t("admin.degrees.error"),
          description: t("admin.degrees.errorFetching"),
          variant: "destructive",
        })
      }
    }

    fetchDegrees()
  }, [t, toast])

  interface DegreeFormData {
    id?: string
    name: string
    nameRu: string
    code: string
    durationYears: number
    status: string
  }

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

  const handleOpenDialog = (degree?: (typeof degrees)[0]) => {
    if (degree) {
      setCurrentDegree(degree)
      setIsEditing(true)
    } else {
      setCurrentDegree({
        name: "",
        nameRu: "",
        code: "",
        durationYears: 2,
        status: "active",
      })
      setIsEditing(false)
    }
    setIsDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentDegree({
      ...currentDegree,
      [name]: name === "durationYears" ? Number.parseFloat(value) : value,
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
            duration_years: currentDegree.durationYears,
            status: currentDegree.status,
          })
          .eq("id", currentDegree.id)

        if (error) throw error

        // Update local state
        setDegrees(degrees.map((degree) => (degree.id === currentDegree.id ? { ...currentDegree } : degree)))

        toast({
          title: t("admin.degrees.success"),
          description: t("admin.degrees.degreeUpdated"),
        })
      } else {
        // Add new degree
        const { data, error } = await supabase
          .from("degrees")
          .insert({
            name: currentDegree.name,
            name_ru: currentDegree.nameRu,
            code: currentDegree.code,
            duration_years: currentDegree.durationYears,
            status: currentDegree.status,
            institution_id: 1, // In a real app, you would get the institution_id from context
          })
          .select()

        if (error) throw error

        if (data && data[0]) {
          const newDegree = {
            id: data[0].id.toString(),
            name: data[0].name,
            nameRu: data[0].name_ru,
            code: data[0].code,
            durationYears: data[0].duration_years,
            status: data[0].status,
          }

          setDegrees([...degrees, newDegree])

          toast({
            title: t("admin.degrees.success"),
            description: t("admin.degrees.degreeCreated"),
          })
        }
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error saving degree:", error)
      toast({
        title: t("admin.degrees.error"),
        description: error.message || t("admin.degrees.errorSaving"),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("admin.degrees.deleteConfirm"))) {
      try {
        const { error } = await supabase.from("degrees").delete().eq("id", id)

        if (error) throw error

        setDegrees(degrees.filter((degree) => degree.id !== id))

        toast({
          title: t("admin.degrees.success"),
          description: t("admin.degrees.degreeDeleted"),
        })
      } catch (error: any) {
        console.error("Error deleting degree:", error)
        toast({
          title: t("admin.degrees.error"),
          description: error.message || t("admin.degrees.errorDeleting"),
          variant: "destructive",
        })
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

      setDegrees(
        degrees.map((degree) => {
          if (degree.id === id) {
            return {
              ...degree,
              status: newStatus,
            }
          }
          return degree
        }),
      )

      toast({
        title: t("admin.degrees.success"),
        description: t("admin.degrees.statusUpdated"),
      })
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: t("admin.degrees.error"),
        description: error.message || t("admin.degrees.errorUpdatingStatus"),
        variant: "destructive",
      })
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
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.degrees.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.degrees.subtitle")}</p>
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
                      <TableHead>{t("admin.degrees.duration")}</TableHead>
                      <TableHead>{t("admin.degrees.status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.degrees.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDegrees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t("admin.degrees.noDegreesFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDegrees.map((degree) => (
                        <TableRow key={degree.id}>
                          <TableCell className="font-medium">{degree.name}</TableCell>
                          <TableCell>{degree.nameRu}</TableCell>
                          <TableCell>{degree.code}</TableCell>
                          <TableCell>{degree.durationYears}</TableCell>
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
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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
                <Label htmlFor="durationYears">{t("admin.degrees.duration")}</Label>
                <Input
                  id="durationYears"
                  name="durationYears"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={currentDegree.durationYears}
                  onChange={handleInputChange}
                  required
                />
              </div>
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
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("admin.degrees.cancel")}
              </Button>
              <Button type="submit">{isEditing ? t("admin.degrees.update") : t("admin.degrees.create")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
