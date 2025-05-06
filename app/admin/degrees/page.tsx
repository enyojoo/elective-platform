"use client"

import { Label } from "@/components/ui/label"

import { DialogTitle } from "@/components/ui/dialog"

import { DialogHeader } from "@/components/ui/dialog"

import { DialogContent } from "@/components/ui/dialog"

import { Dialog } from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"

import type React from "react"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Plus } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useCachedDegrees } from "@/hooks/use-cached-degrees"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

// Mock degree data
const initialDegrees = [
  {
    id: "1",
    name: "Bachelor's",
    nameRu: "Бакалавриат",
    code: "bachelor",
    durationYears: 4,
    status: "active",
  },
  {
    id: "2",
    name: "Master's",
    nameRu: "Магистратура",
    code: "master",
    durationYears: 2,
    status: "active",
  },
  {
    id: "3",
    name: "Executive MBA",
    nameRu: "Исполнительный MBA",
    code: "emba",
    durationYears: 1.5,
    status: "inactive",
  },
]

interface DegreeFormData {
  id?: string
  name: string
  nameRu: string
  code: string
  durationYears: number
  status: string
}

export default function DegreesPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const { data: degrees, isLoading, error, isInitialized } = useCachedDegrees(institution?.id)
  const { invalidateCache } = useDataCache()
  const [filteredDegrees, setFilteredDegrees] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Filter degrees based on search term
  useEffect(() => {
    if (!degrees) return

    let result = [...degrees]

    if (searchTerm) {
      result = result.filter(
        (degree) =>
          degree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          degree.code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredDegrees(result)
    setTotalPages(Math.ceil(result.length / itemsPerPage))
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, degrees])

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredDegrees.slice(startIndex, endIndex)
  }

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentDegree, setCurrentDegree] = useState<DegreeFormData>({
    name: "",
    nameRu: "",
    code: "",
    durationYears: 2,
    status: "active",
  })
  const [isEditing, setIsEditing] = useState(false)

  // Filter degrees based on search term
  // useEffect(() => {
  //   if (!searchTerm) {
  //     setFilteredDegrees(degrees)
  //     return
  //   }

  //   const filtered = degrees.filter(
  //     (degree) =>
  //       degree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       degree.nameRu.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       degree.code.toLowerCase().includes(searchTerm.toLowerCase()),
  //   )

  //   setFilteredDegrees(filtered)
  // }, [degrees, searchTerm])

  const handleOpenDialog = (degree?: (typeof initialDegrees)[0]) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      // Update existing degree
      // setDegrees(degrees.map((degree) => (degree.id === currentDegree.id ? { ...currentDegree } : degree)))
    } else {
      // Add new degree
      const newDegree = {
        ...currentDegree,
        id: Math.random().toString(36).substring(2, 9),
      }
      // setDegrees([...degrees, newDegree])
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm(t("admin.degrees.deleteConfirm"))) {
      // setDegrees(degrees.filter((degree) => degree.id !== id))
    }
  }

  const toggleStatus = (id: string) => {
    // setDegrees(
    //   degrees.map((degree) => {
    //     if (degree.id === id) {
    //       return {
    //         ...degree,
    //         status: degree.status === "active" ? "inactive" : "active",
    //       }
    //     }
    //     return degree
    //   }),
    // )
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

  if (!isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-4 w-[350px] mt-2" />
            </div>
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-10 flex-1" />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[180px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
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
                      getCurrentPageItems().map((degree) => (
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
                                  {/* <Pencil className="mr-2 h-4 w-4" /> */}
                                  {t("admin.degrees.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(degree.id)}>
                                  {/* <Trash2 className="mr-2 h-4 w-4" /> */}
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
