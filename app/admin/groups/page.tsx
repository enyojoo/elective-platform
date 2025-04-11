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
import { Search, Plus, MoreHorizontal, Pencil, Trash2, Users, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock groups data
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
  {
    id: "4",
    name: "24.M01-vshm",
    displayName: "M01",
    program: "Management",
    degree: "Master's",
    year: "2024",
    students: 18,
    status: "active",
  },
  {
    id: "5",
    name: "23.B11-vshm",
    displayName: "B11",
    program: "International Management",
    degree: "Bachelor's",
    year: "2023",
    students: 22,
    status: "inactive",
  },
]

// Mock programs data
const mockPrograms = [
  { id: "1", name: "Management", degree: "Bachelor's" },
  { id: "2", name: "Management", degree: "Master's" },
  { id: "3", name: "International Management", degree: "Bachelor's" },
  { id: "4", name: "Business Analytics and Big Data", degree: "Master's" },
  { id: "5", name: "Public Administration", degree: "Bachelor's" },
]

interface GroupFormData {
  id?: string
  name: string
  displayName: string
  program: string
  degree: string
  year: string
  status: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState(initialGroups)
  const [filteredGroups, setFilteredGroups] = useState(initialGroups)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentGroup, setCurrentGroup] = useState<GroupFormData>({
    name: "",
    displayName: "",
    program: "",
    degree: "",
    year: "",
    status: "active",
  })
  const [isEditing, setIsEditing] = useState(false)

  // Filters
  const [programFilter, setProgramFilter] = useState("")
  const [yearFilter, setYearFilter] = useState("")
  const [degreeFilter, setDegreeFilter] = useState("")

  // Get unique values for filters
  const programs = [...new Set(groups.map((group) => group.program))]
  const years = [...new Set(groups.map((group) => group.year))].sort((a, b) => b.localeCompare(a)) // Sort descending
  const degrees = [...new Set(groups.map((group) => group.degree))]

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
  }, [groups, searchTerm, programFilter, yearFilter, degreeFilter])

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
        program: programs[0] || "",
        degree: degrees[0] || "",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      // Update existing group
      setGroups(
        groups.map((group) =>
          group.id === currentGroup.id ? { ...group, ...currentGroup, students: group.students } : group,
        ),
      )
    } else {
      // Add new group
      const newGroup = {
        ...currentGroup,
        id: Math.random().toString(36).substring(2, 9),
        students: 0,
      }
      setGroups([...groups, newGroup])
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this group?")) {
      setGroups(groups.filter((group) => group.id !== id))
    }
  }

  const toggleStatus = (id: string) => {
    setGroups(
      groups.map((group) => {
        if (group.id === id) {
          return {
            ...group,
            status: group.status === "active" ? "inactive" : "active",
          }
        }
        return group
      }),
    )
  }

  const resetFilters = () => {
    setProgramFilter("")
    setYearFilter("")
    setDegreeFilter("")
    setSearchTerm("")
  }

  // Helper function to get degree badge
  const getDegreeBadge = (degree: string) => {
    switch (degree) {
      case "Bachelor's":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">{degree}</Badge>
      case "Master's":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">{degree}</Badge>
      default:
        return <Badge>{degree}</Badge>
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{status}</Badge>
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">{status}</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Groups</h1>
            <p className="text-muted-foreground mt-2">Manage student groups across all programs and years</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Group
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
                      placeholder="Search groups..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <Select value={programFilter || "all"} onValueChange={setProgramFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programs.map((program) => (
                          <SelectItem key={program} value={program}>
                            {program}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={yearFilter || "all"} onValueChange={setYearFilter}>
                      <SelectTrigger className="w-[130px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
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
                        <SelectValue placeholder="Degree" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Degrees</SelectItem>
                        {degrees.map((degree) => (
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
                      <TableHead>Group Code</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Degree</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No groups found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGroups.map((group) => (
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
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(group.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatus(group.id)}>
                                  {group.status === "active" ? "Deactivate" : "Activate"}
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
            <DialogTitle>{isEditing ? "Edit Group" : "Add New Group"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Code</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentGroup.name}
                  onChange={handleInputChange}
                  placeholder="e.g., 24.B01-vshm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={currentGroup.displayName}
                  onChange={handleInputChange}
                  placeholder="e.g., B01"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <select
                id="program"
                name="program"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={currentGroup.program}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Program</option>
                {mockPrograms.map((program) => (
                  <option key={program.id} value={program.name}>
                    {program.name} ({program.degree})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="degree">Degree</Label>
                <select
                  id="degree"
                  name="degree"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={currentGroup.degree}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Degree</option>
                  {degrees.map((degree) => (
                    <option key={degree} value={degree}>
                      {degree}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <select
                  id="year"
                  name="year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={currentGroup.year}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={currentGroup.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
