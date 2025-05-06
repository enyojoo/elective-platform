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
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Users, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function GroupsPage() {
  const { t } = useLanguage()
  // Initialize state variables with useState hook
  const [groups, setGroups] = useState<any[]>([])
  const [filteredGroups, setFilteredGroups] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<any>({
    name: "",
    displayName: "",
    program: "",
    degree: "",
    year: "",
    status: "active",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [degreesData, setDegreesData] = useState<any[]>([])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filters
  const [programFilter, setProgramFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [degreeFilter, setDegreeFilter] = useState("")

  const { toast } = useToast()

  // Fetch groups from Supabase
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from("groups")
          .select(`
            id, 
            name, 
            display_name, 
            year, 
            status,
            programs (id, name),
            degrees (id, name)
          `)
          .eq("institution_id", 1) // In a real app, you would get the institution_id from context
          .order("name")

        if (error) throw error

        if (data) {
          // Count students in each group
          const groupIds = data.map((group) => group.id)
          const { data: studentCounts, error: countError } = await supabase
            .from("profiles")
            .select("group_id, count")
            .in("group_id", groupIds)
            .eq("role", "student")
            .group("group_id")

          if (countError) throw countError

          // Create a map of group_id to student count
          const studentCountMap = new Map()
          if (studentCounts) {
            studentCounts.forEach((item) => {
              studentCountMap.set(item.group_id, Number.parseInt(item.count))
            })
          }

          const formattedGroups = data.map((group) => ({
            id: group.id.toString(),
            name: group.name,
            displayName: group.display_name,
            program: group.programs?.name || "",
            degree: group.degrees?.name || "",
            year: group.year,
            students: studentCountMap.get(group.id) || 0,
            status: group.status,
          }))

          setGroups(formattedGroups)
          setFilteredGroups(formattedGroups)
        }
      } catch (error) {
        console.error("Failed to fetch groups:", error)
        toast({
          title: t("admin.groups.error"),
          description: t("admin.groups.errorFetching"),
          variant: "destructive",
        })
      }
    }

    fetchGroups()
  }, [t, toast])

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name, degree_id, degrees(id, name)")
          .eq("institution_id", 1) // In a real app, you would get the institution_id from context
          .order("name")

        if (programsError) throw programsError

        if (programsData) {
          setPrograms(
            programsData.map((program) => ({
              id: program.id.toString(),
              name: program.name,
              degreeId: program.degree_id,
              degreeName: program.degrees?.name || "",
            })),
          )
        }

        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .eq("institution_id", 1) // In a real app, you would get the institution_id from context
          .order("name")

        if (degreesError) throw degreesError

        if (degreesData) {
          setDegreesData(
            degreesData.map((degree) => ({
              id: degree.id.toString(),
              name: degree.name,
            })),
          )
        }
      } catch (error) {
        console.error("Failed to fetch reference data:", error)
      }
    }

    fetchReferenceData()
  }, [])

  interface GroupFormData {
    id?: string
    name: string
    displayName: string
    program: string
    degree: string
    year: string
    status: string
  }

  // Get unique values for filters
  const programsList = [...new Set(groups.map((group) => group.program))]
  const years = [...new Set(groups.map((group) => group.year))].sort((a, b) => b.localeCompare(a)) // Sort descending
  const degreesList = [...new Set(groups.map((group) => group.degree))]

  // Apply filters and search
  useEffect(() => {
    let result = groups

    // Apply program filter
    if (programFilter && programFilter !== "all") {
      result = result.filter((group) => group.program === programFilter)
    }

    // Apply year filter
    if (yearFilter && yearFilter !== "all") {
      result = result.filter((group) => group.year === yearFilter)
    }

    // Apply degree filter
    if (degreeFilter && degreeFilter !== "all") {
      result = result.filter((group) => group.degree === degreeFilter)
    }

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.displayName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredGroups(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [groups, searchTerm, programFilter, yearFilter, degreeFilter])

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredGroups.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage)

  const handleOpenDialog = (group?: (typeof groups)[0]) => {
    if (group) {
      setCurrentGroup({
        id: group.id,
        name: group.name,
        displayName: group.displayName,
        program: group.program,
        degree: group.degree,
        year: group.year,
        status: group.status,
      })
      setIsEditing(true)
    } else {
      setCurrentGroup({
        name: "",
        displayName: "",
        program: programs[0]?.id || "",
        degree: degreesData[0]?.id || "",
        year: years[0] || "",
        status: "active",
      })
      setIsEditing(false)
    }
    setIsDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCurrentGroup({
      ...currentGroup,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isEditing) {
        // Update existing group
        const { error } = await supabase
          .from("groups")
          .update({
            name: currentGroup.name,
            display_name: currentGroup.displayName,
            program_id: Number.parseInt(currentGroup.program),
            degree_id: Number.parseInt(currentGroup.degree),
            year: currentGroup.year,
            status: currentGroup.status,
          })
          .eq("id", currentGroup.id)

        if (error) throw error

        // Refresh the groups list
        const { data, error: fetchError } = await supabase
          .from("groups")
          .select(`
            id, 
            name, 
            display_name, 
            year, 
            status,
            programs (id, name),
            degrees (id, name)
          `)
          .eq("id", currentGroup.id)
          .single()

        if (fetchError) throw fetchError

        if (data) {
          const updatedGroup = {
            id: data.id.toString(),
            name: data.name,
            displayName: data.display_name,
            program: data.programs?.name || "",
            degree: data.degrees?.name || "",
            year: data.year,
            students: groups.find((g) => g.id === currentGroup.id)?.students || 0,
            status: data.status,
          }

          setGroups(groups.map((group) => (group.id === currentGroup.id ? updatedGroup : group)))
        }

        toast({
          title: t("admin.groups.success"),
          description: t("admin.groups.groupUpdated"),
        })
      } else {
        // Add new group
        const { data, error } = await supabase
          .from("groups")
          .insert({
            name: currentGroup.name,
            display_name: currentGroup.displayName,
            program_id: Number.parseInt(currentGroup.program),
            degree_id: Number.parseInt(currentGroup.degree),
            year: currentGroup.year,
            status: currentGroup.status,
            institution_id: 1, // In a real app, you would get the institution_id from context
          })
          .select()

        if (error) throw error

        if (data && data[0]) {
          // Fetch the complete group data with related entities
          const { data: groupData, error: fetchError } = await supabase
            .from("groups")
            .select(`
              id, 
              name, 
              display_name, 
              year, 
              status,
              programs (id, name),
              degrees (id, name)
            `)
            .eq("id", data[0].id)
            .single()

          if (fetchError) throw fetchError

          if (groupData) {
            const newGroup = {
              id: groupData.id.toString(),
              name: groupData.name,
              displayName: groupData.display_name,
              program: groupData.programs?.name || "",
              degree: groupData.degrees?.name || "",
              year: groupData.year,
              students: 0,
              status: groupData.status,
            }

            setGroups([...groups, newGroup])
          }

          toast({
            title: t("admin.groups.success"),
            description: t("admin.groups.groupCreated"),
          })
        }
      }

      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error saving group:", error)
      toast({
        title: t("admin.groups.error"),
        description: error.message || t("admin.groups.errorSaving"),
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm(t("admin.groups.deleteConfirm"))) {
      try {
        const { error } = await supabase.from("groups").delete().eq("id", id)

        if (error) throw error

        setGroups(groups.filter((group) => group.id !== id))

        toast({
          title: t("admin.groups.success"),
          description: t("admin.groups.groupDeleted"),
        })
      } catch (error: any) {
        console.error("Error deleting group:", error)
        toast({
          title: t("admin.groups.error"),
          description: error.message || t("admin.groups.errorDeleting"),
          variant: "destructive",
        })
      }
    }
  }

  const toggleStatus = async (id: string) => {
    try {
      const group = groups.find((g) => g.id === id)
      if (!group) return

      const newStatus = group.status === "active" ? "inactive" : "active"

      const { error } = await supabase.from("groups").update({ status: newStatus }).eq("id", id)

      if (error) throw error

      setGroups(
        groups.map((group) => {
          if (group.id === id) {
            return {
              ...group,
              status: newStatus,
            }
          }
          return group
        }),
      )

      toast({
        title: t("admin.groups.success"),
        description: t("admin.groups.statusUpdated"),
      })
    } catch (error: any) {
      console.error("Error updating status:", error)
      toast({
        title: t("admin.groups.error"),
        description: error.message || t("admin.groups.errorUpdatingStatus"),
        variant: "destructive",
      })
    }
  }

  const resetFilters = () => {
    setProgramFilter("")
    setYearFilter("")
    setDegreeFilter("")
    setSearchTerm("")
  }

  // Helper function to get degree badge
  const getDegreeBadge = (degree: string) => {
    // Map the English degree names to translation keys
    const degreeKey = degree === "Bachelor's" ? "degree.bachelor" : degree === "Master's" ? "degree.master" : ""

    // Get the translated degree name
    const translatedDegree = degreeKey ? t(degreeKey) : degree

    switch (degree) {
      case "Bachelor's":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">
            {translatedDegree}
          </Badge>
        )
      case "Master's":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">{translatedDegree}</Badge>
      default:
        return <Badge>{translatedDegree}</Badge>
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("admin.groups.active")}
          </Badge>
        )
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("admin.groups.inactive")}
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
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.groups.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("admin.groups.subtitle")}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.groups.addGroup")}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={t("admin.groups.searchGroups")}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <Select value={programFilter || "all"} onValueChange={setProgramFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder={t("admin.groups.program")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.groups.allPrograms")}</SelectItem>
                        {programsList.map((program) => (
                          <SelectItem key={program} value={program}>
                            {program}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={yearFilter || "all"} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-[130px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder={t("admin.groups.year")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.groups.allYears")}</SelectItem>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={degreeFilter || "all"} onValueChange={setDegreeFilter}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder={t("admin.groups.degree")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("admin.groups.allDegrees")}</SelectItem>
                        {degreesList.map((degree) => (
                          <SelectItem key={degree} value={degree}>
                            {degree}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.groups.groupCode")}</TableHead>
                      <TableHead>{t("admin.groups.displayName")}</TableHead>
                      <TableHead>{t("admin.groups.program")}</TableHead>
                      <TableHead>{t("admin.groups.degree")}</TableHead>
                      <TableHead>{t("admin.groups.year")}</TableHead>
                      <TableHead>{t("admin.groups.students")}</TableHead>
                      <TableHead>{t("admin.groups.status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.groups.action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {t("admin.groups.noGroups")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentItems.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.displayName}</TableCell>
                          <TableCell>{group.program}</TableCell>
                          <TableCell>{getDegreeBadge(group.degree)}</TableCell>
                          <TableCell>{group.year}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {group.students}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(group.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(group)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t("admin.groups.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(group.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("admin.groups.delete")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatus(group.id)}>
                                  {group.status === "active"
                                    ? t("admin.groups.deactivate")
                                    : t("admin.groups.activate")}
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

              {/* Pagination */}
              {filteredGroups.length > itemsPerPage && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label={t("pagination.previous")}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {t("pagination.previous")}
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">
                      {currentPage} / {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label={t("pagination.next")}
                  >
                    {t("pagination.next")}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? t("admin.groups.editGroup") : t("admin.groups.addNewGroup")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("admin.groups.groupCodeLabel")}</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentGroup.name}
                  onChange={handleInputChange}
                  placeholder={t("admin.groups.groupCodePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("admin.groups.displayNameLabel")}</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={currentGroup.displayName}
                  onChange={handleInputChange}
                  placeholder={t("admin.groups.displayNamePlaceholder")}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">{t("admin.groups.program")}</Label>
              <select
                id="program"
                name="program"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={currentGroup.program}
                onChange={handleInputChange}
                required
              >
                <option value="">{t("admin.groups.selectProgram")}</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program.degreeName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degree">{t("admin.groups.degree")}</Label>
                <select
                  id="degree"
                  name="degree"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={currentGroup.degree}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t("admin.groups.selectDegree")}</option>
                  {degreesData.map((degree) => (
                    <option key={degree.id} value={degree.id}>
                      {degree.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">{t("admin.groups.year")}</Label>
                <Input
                  id="year"
                  name="year"
                  type="text"
                  value={currentGroup.year}
                  onChange={handleInputChange}
                  placeholder="2024"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t("admin.groups.status")}</Label>
              <select
                id="status"
                name="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={currentGroup.status}
                onChange={handleInputChange}
              >
                <option value="active">{t("admin.groups.active")}</option>
                <option value="inactive">{t("admin.groups.inactive")}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("admin.groups.cancel")}
              </Button>
              <Button type="submit">{isEditing ? t("admin.groups.update") : t("admin.groups.create")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
