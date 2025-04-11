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
  const [degrees, setDegrees] = useState(initialDegrees)
  const [filteredDegrees, setFilteredDegrees] = useState(initialDegrees)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEditing) {
      // Update existing degree
      setDegrees(degrees.map((degree) => (degree.id === currentDegree.id ? { ...currentDegree } : degree)))
    } else {
      // Add new degree
      const newDegree = {
        ...currentDegree,
        id: Math.random().toString(36).substring(2, 9),
      }
      setDegrees([...degrees, newDegree])
    }

    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this degree?")) {
      setDegrees(degrees.filter((degree) => degree.id !== id))
    }
  }

  const toggleStatus = (id: string) => {
    setDegrees(
      degrees.map((degree) => {
        if (degree.id === id) {
          return {
            ...degree,
            status: degree.status === "active" ? "inactive" : "active",
          }
        }
        return degree
      }),
    )
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
            <h1 className="text-3xl font-bold tracking-tight">Degree Management</h1>
            <p className="text-muted-foreground mt-2">Manage academic degrees offered by the institution</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Degree
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search degrees..."
                  className="pl-8 max-w-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name (English)</TableHead>
                      <TableHead>Name (Russian)</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Duration (Years)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDegrees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No degrees found
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
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(degree.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatus(degree.id)}>
                                  {degree.status === "active" ? "Deactivate" : "Activate"}
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
            <DialogTitle>{isEditing ? "Edit Degree" : "Add New Degree"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (English)</Label>
                <Input id="name" name="name" value={currentDegree.name} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nameRu">Name (Russian)</Label>
                <Input id="nameRu" name="nameRu" value={currentDegree.nameRu} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" value={currentDegree.code} onChange={handleInputChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationYears">Duration (Years)</Label>
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
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={currentDegree.status}
                onChange={(e) => setCurrentDegree({ ...currentDegree, status: e.target.value })}
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
