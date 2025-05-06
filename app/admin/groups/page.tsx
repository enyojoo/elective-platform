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

// Mock groups data for initial state
const initialGroups = [
  {
    id: "1",
    name: "24.B01-vshm",
    displayName: "B01",
    program: "Management",
    degree: "Bachelor's",
    year: "2024",
    students: 25,
    status: "active",
  },
  {
    id: "2",
    name: "24.B02-vshm",
    displayName: "B02",
    program: "Management",
    degree: "Bachelor's",
    year: "2024",
    students: 23,
    status: "active",
  },
  {
    id: "3",
    name: "23.B01-vshm",
    displayName: "B01",
    program: "Management",
    degree: "Bachelor's",
    year: "2023",
    students: 24,
    status: "active",
  },
]

interface GroupFormData {
  id?: string
  name: string
  displayName: string
  programId: string
  degreeId: string
  year: string
  status: string
}

export default function GroupsPage() {
  const { t } = useLanguage()
  const [groups, setGroups] = useState(initialGroups)
  const [filteredGroups, setFilteredGroups] = useState(initialGroups)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<GroupFormData>({
    name: "",
    displayName: "",
    programId: "",
    degreeId: "",
    year: "",
    status: "active",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [programs, setPrograms] = useState<any[]>([])
  const [degrees, setDegrees] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        setIsLoading(true)

        // First, fetch the groups
        const { data: groupsData, error: groupsError } = await supabase.from("groups").select("*").order("name")

        if (groupsError) throw groupsError

        if (!groupsData) {
          setGroups([])
          setFilteredGroups([])
          return
        }

        // Fetch program and degree information separately
        const programIds = [...new Set(groupsData.map((g) => g.program_id).filter(Boolean))]
        const degreeIds = [...new Set(groupsData.map((g) => g.degree_id).filter(Boolean))]

        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name")
          .in("id", programIds)

        if (programsError) throw programsError

        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .in("id", degreeIds)

        if (degreesError) throw degreesError

        // Create maps for quick lookups
        const programMap = new Map()
        if (programsData) {
          programsData.forEach((program) => {
            programMap.set(program.id, program.name)
          })
        }

        const degreeMap = new Map()
        if (degreesData) {
          degreesData.forEach((degree) => {
            degreeMap.set(degree.id, degree.name)
          })
        }

        // Count students in each group using a different approach
        const studentCountMap = new Map()
        for (const group of groupsData) {
          const { count, error: countError } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)
            .eq("role", "student")

          if (countError) {
            console.error("Error counting students for group", group.id, countError)
            studentCountMap.set(group.id, 0)
          } else {
            studentCountMap.set(group.id, count || 0)
          }
        }

        // Format the groups data
        const formattedGroups = groupsData.map((group) => ({
          id: group.id.toString(),
          name: group.name,
          displayName: group.display_name,
          program: programMap.get(group.program_id) || "Unknown",
          programId: group.program_id,
          degree: degreeMap.get(group.degree_id) || "Unknown",
          degreeId: group.degree_id,
          year: group.year,
          students: studentCountMap.get(group.id) || 0,
          status: group.status,
        }))

        setGroups(formattedGroups)
        setFilteredGroups(formattedGroups)
      } catch (error) {
        console.error("Failed to fetch groups:", error)
        toast({
          title: t("admin.groups.error"),
          description: t("admin.groups.errorFetching"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [t, toast])

  // Fetch reference data (programs and degrees)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch programs
        const { data: programsData, error: programsError } = await supabase
          .from("programs")
          .select("id, name, degree_id")
          .order("name")

        if (programsError) throw programsError

        if (programsData) {
          setPrograms(programsData)
        }

        // Fetch degrees
        const { data: degreesData, error: degreesError } = await supabase
          .from("degrees")
          .select("id, name")
          .order("name")

        if (degreesError) throw degreesError

        if (degreesData) {
          setDegrees(degreesData)
        }
      } catch (error) {
        console.error("Failed to fetch reference data:", error)
        toast({
          title: t("admin.groups.error"),
          description: t("admin.groups.errorFetchingReferenceData"),
          variant: "destructive",
        })
      }
    }

    fetchReferenceData()
  }, [t, toast])

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
        programId: group.programId?.toString() || "",
        degreeId: group.degreeId?.toString() || "",
        year: group.year,
        status: group.status,
      })
      setIsEditing(true)
    } else {
      setCurrentGroup({
        name: "",
        displayName: "",
        programId: programs[0]?.id.toString() || "",
        degreeId: degrees[0]?.id.toString() || "",
        year: new Date().getFullYear().toString(),
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
            program_id: Number.parseInt(currentGroup.programId),
            degree_id: Number.parseInt(currentGroup.degreeId),
            year: currentGroup.year,
            status: currentGroup.status,
          })
          .eq("id", currentGroup.id)

        if (error) throw error

        // Refresh the groups list to get updated data
        const { data, error: fetchError } = await supabase.from("groups").select("*").eq("id", currentGroup.id).single()

        if (fetchError) throw fetchError

        // Get program and degree names
        const program = programs.find((p) => p.id === Number.parseInt(currentGroup.programId))
        const degree = degrees.find((d) => d.id === Number.parseInt(currentGroup.degreeId))

        if (data) {
          const updatedGroup = {
            ...groups.find((g) => g.id === currentGroup.id),
            id: data.id.toString(),
            name: data.name,
            displayName: data.display_name,
            program: program?.name || "Unknown",
            programId: data.program_id,
            degree: degree?.name || "Unknown",
            degreeId: data.degree_id,
            year: data.year,
            status: data.status,
          }

          setGroups(groups.map((group) => (group.id === currentGroup.id ? updatedGroup : group)))

          toast({
            title: t("admin.groups.success"),
            description: t("admin.groups.groupUpdated"),
          })
        }
      } else {
        // Add new group
        const { data, error } = await supabase
          .from("groups")
          .insert({
            name: currentGroup.name,
            display_name: currentGroup.displayName,
            program_id: Number.parseInt(currentGroup.programId),
            degree_id: Number.parseInt(currentGroup.degreeId),
            year: currentGroup.year,
            status: currentGroup.status,
          })
          .select()

        if (error) throw error

        if (data && data[0]) {
          // Get program and degree names
          const program = programs.find((p) => p.id === Number.parseInt(currentGroup.programId))
          const degree = degrees.find((d) => d.id === Number.parseInt(currentGroup.degreeId))

          const newGroup = {
            id: data[0].id.toString(),
            name: data[0].name,
            displayName: data[0].display_name,
            program: program?.name || "Unknown",
            programId: data[0].program_id,
            degree: degree?.name || "Unknown",
            degreeId: data[0].degree_id,
            year: data[0].year,
            students: 0,
            status: data[0].status,
          }

          setGroups([...groups, newGroup])

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
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {t("common.loading")}
                        </TableCell>
                      </TableRow>
                    ) : currentItems.length === 0 ? (
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
              <Label htmlFor="programId">{t("admin.groups.program")}</Label>
              <select
                id="programId"
                name="programId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={currentGroup.programId}
                onChange={handleInputChange}
                required
              >
                <option value="">{t("admin.groups.selectProgram")}</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degreeId">{t("admin.groups.degree")}</Label>
                <select
                  id="degreeId"
                  name="degreeId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={currentGroup.degreeId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t("admin.groups.selectDegree")}</option>
                  {degrees.map((degree) => (
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
