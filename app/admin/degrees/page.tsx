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
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useToast } from "@/hooks/use-toast"
import { createDegree, deleteDegree, getDegrees, updateDegree, type DegreeFormData } from "@/app/actions/degrees"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { supabase } from "@/lib/supabase"

interface Degree {
  id: string
  name: string
  name_ru: string | null
  code: string
  duration_years: number
  status: string
  institution_id: string
  created_at: string
  updated_at: string
}

export default function DegreesPage() {
  const { t } = useLanguage()
  const { institution, isLoading: isInstitutionLoading } = useInstitution()
  const { toast } = useToast()

  const [degrees, setDegrees] = useState<Degree[]>([])
  const [filteredDegrees, setFilteredDegrees] = useState<Degree[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentDegree, setCurrentDegree] = useState<DegreeFormData>({
    name: "",
    nameRu: "",
    code: "",
    durationYears: 2,
    status: "active",
    institution_id: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // For direct Supabase query (fallback if server action fails)
  const fetchDegreesDirectly = async (institutionId: string) => {
    try {
      console.log("Fetching degrees directly for institution:", institutionId)
      const { data, error } = await supabase
        .from("degrees")
        .select("*")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Direct query error:", error)
        return { degrees: [], error: error.message }
      }

      console.log("Direct query result:", data)
      return { degrees: data || [], error: null }
    } catch (err) {
      console.error("Exception in direct query:", err)
      return { degrees: [], error: "Failed to fetch degrees directly" }
    }
  }

  // Fetch degrees on component mount
  useEffect(() => {
    async function fetchDegrees() {
      if (isInstitutionLoading) {
        console.log("Institution is still loading, waiting...")
        return
      }

      if (!institution?.id) {
        console.log("No institution ID available")
        setIsLoading(false)
        return
      }

      console.log("Institution loaded, ID:", institution.id)
      setIsLoading(true)

      try {
        // Try server action first
        const { degrees: serverDegrees, error: serverError } = await getDegrees(institution.id)

        if (serverError || !Array.isArray(serverDegrees)) {
          console.warn("Server action failed, trying direct query:", serverError)

          // Fallback to direct query
          const { degrees: directDegrees, error: directError } = await fetchDegreesDirectly(institution.id)

          if (directError) {
            console.error("Both methods failed to fetch degrees")
            toast({
              title: t("common.error"),
              description: directError,
              variant: "destructive",
            })
            setDegrees([])
            setFilteredDegrees([])
          } else {
            console.log("Degrees fetched via direct query:", directDegrees)
            setDegrees(directDegrees)
            setFilteredDegrees(directDegrees)
          }
        } else {
          console.log("Degrees fetched via server action:", serverDegrees)
          setDegrees(serverDegrees)
          setFilteredDegrees(serverDegrees)
        }
      } catch (err) {
        console.error("Exception in fetchDegrees:", err)
        toast({
          title: t("common.error"),
          description: "Failed to fetch degrees",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDegrees()
  }, [institution?.id, isInstitutionLoading, toast, t])

  // Filter degrees based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredDegrees(degrees)
      return
    }

    const filtered = degrees.filter(
      (degree) =>
        degree.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (degree.name_ru && degree.name_ru.toLowerCase().includes(searchTerm.toLowerCase())) ||
        degree.code.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    setFilteredDegrees(filtered)
  }, [degrees, searchTerm])

  const handleOpenDialog = (degree?: Degree) => {
    if (!institution?.id) {
      toast({
        title: t("common.error"),
        description: t("admin.degrees.institutionRequired"),
        variant: "destructive",
      })
      return
    }

    if (degree) {
      setCurrentDegree({
        id: degree.id,
        name: degree.name,
        nameRu: degree.name_ru,
        code: degree.code,
        durationYears: degree.duration_years,
        status: degree.status,
        institution_id: degree.institution_id,
      })
      setIsEditing(true)
    } else {
      setCurrentDegree({
        name: "",
        nameRu: "",
        code: "",
        durationYears: 2,
        status: "active",
        institution_id: institution.id,
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
    setIsSubmitting(true)

    try {
      if (isEditing) {
        // Update existing degree
        const result = await updateDegree(currentDegree)
        if (result.success) {
          toast({
            title: t("admin.degrees.updateSuccess"),
            description: t("admin.degrees.degreeUpdated"),
          })

          // Update local state
          setDegrees(
            degrees.map((degree) =>
              degree.id === currentDegree.id
                ? {
                    ...degree,
                    name: currentDegree.name,
                    name_ru: currentDegree.nameRu,
                    code: currentDegree.code,
                    duration_years: currentDegree.durationYears,
                    status: currentDegree.status,
                  }
                : degree,
            ),
          )
        } else {
          toast({
            title: t("common.error"),
            description: result.error || t("admin.degrees.updateError"),
            variant: "destructive",
          })
        }
      } else {
        // Add new degree
        const result = await createDegree(currentDegree)
        if (result.success) {
          toast({
            title: t("admin.degrees.createSuccess"),
            description: t("admin.degrees.degreeCreated"),
          })

          // Add to local state
          if (result.data) {
            setDegrees([result.data, ...degrees])
          } else {
            // Refetch if we don't have the data
            const { degrees: updatedDegrees } = await getDegrees(institution!.id)
            setDegrees(updatedDegrees)
          }
        } else {
          toast({
            title: t("common.error"),
            description: result.error || t("admin.degrees.createError"),
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error submitting degree:", error)
      toast({
        title: t("common.error"),
        description: t("admin.degrees.submissionError"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsDialogOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("admin.degrees.deleteConfirm"))) {
      const result = await deleteDegree(id)

      if (result.success) {
        toast({
          title: t("admin.degrees.deleteSuccess"),
          description: t("admin.degrees.degreeDeleted"),
        })

        // Update local state
        setDegrees(degrees.filter((degree) => degree.id !== id))
      } else {
        toast({
          title: t("common.error"),
          description: result.error || t("admin.degrees.deleteError"),
          variant: "destructive",
        })
      }
    }
  }

  const toggleStatus = async (degree: Degree) => {
    const newStatus = degree.status === "active" ? "inactive" : "active"

    const updateData: DegreeFormData = {
      id: degree.id,
      name: degree.name,
      nameRu: degree.name_ru,
      code: degree.code,
      durationYears: degree.duration_years,
      status: newStatus,
      institution_id: degree.institution_id,
    }

    const result = await updateDegree(updateData)

    if (result.success) {
      toast({
        title: t("admin.degrees.statusUpdateSuccess"),
        description: t(`admin.degrees.${newStatus}Success`),
      })

      // Update local state
      setDegrees(degrees.map((d) => (d.id === degree.id ? { ...d, status: newStatus } : d)))
    } else {
      toast({
        title: t("common.error"),
        description: result.error || t("admin.degrees.statusUpdateError"),
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

  // Determine if we're in a loading state
  const showLoading = isInstitutionLoading || isLoading

  // Determine if the Add Degree button should be disabled
  const addButtonDisabled = isInstitutionLoading || !institution?.id

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.degrees.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.degrees.subtitle")}</p>
            {isInstitutionLoading && <p className="text-sm text-amber-500 mt-1">Loading institution data...</p>}
            {!isInstitutionLoading && !institution?.id && (
              <p className="text-sm text-red-500 mt-1">No institution found. Please check your configuration.</p>
            )}
          </div>
          <Button onClick={() => handleOpenDialog()} disabled={addButtonDisabled}>
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
                    {showLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0 border-0">
                          <PageSkeleton type="table" itemCount={5} />
                        </TableCell>
                      </TableRow>
                    ) : !institution?.id ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No institution selected. Please check your configuration.
                        </TableCell>
                      </TableRow>
                    ) : filteredDegrees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? t("admin.degrees.noDegreesFound") : t("admin.degrees.noDegreesYet")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDegrees.map((degree) => (
                        <TableRow key={degree.id}>
                          <TableCell className="font-medium">{degree.name}</TableCell>
                          <TableCell>{degree.name_ru}</TableCell>
                          <TableCell>{degree.code}</TableCell>
                          <TableCell>{degree.duration_years}</TableCell>
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
                                <DropdownMenuItem onClick={() => toggleStatus(degree)}>
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
                <Input id="nameRu" name="nameRu" value={currentDegree.nameRu || ""} onChange={handleInputChange} />
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
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                {t("admin.degrees.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.processing")}
                  </>
                ) : isEditing ? (
                  t("admin.degrees.update")
                ) : (
                  t("admin.degrees.create")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
