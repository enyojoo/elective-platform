"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Eye, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AdminElectivesPage() {
  const [activeTab, setActiveTab] = useState("courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data for demonstration
  const courseElectivePacks = [
    {
      id: "1",
      title: "Fall 2023",
      program: "Master in Management",
      programCode: "MiM",
      status: "active",
      courses: 12,
      selections: 45,
      createdBy: "John Doe",
      createdAt: "2023-09-01",
    },
    {
      id: "2",
      title: "Spring 2024",
      program: "Master in Business Analytics",
      programCode: "MiBA",
      status: "active",
      courses: 8,
      selections: 32,
      createdBy: "Jane Smith",
      createdAt: "2023-09-02",
    },
    {
      id: "3",
      title: "Spring 2023",
      program: "Master in Management",
      programCode: "MiM",
      status: "inactive",
      courses: 10,
      selections: 38,
      createdBy: "John Doe",
      createdAt: "2022-09-01",
    },
    {
      id: "4",
      title: "Fall 2022",
      program: "Master in Business Analytics",
      programCode: "MiBA",
      status: "inactive",
      courses: 9,
      selections: 30,
      createdBy: "Jane Smith",
      createdAt: "2022-09-01",
    },
  ]

  const exchangePacks = [
    {
      id: "1",
      title: "Fall 2023",
      program: "Master in Management",
      programCode: "MiM",
      status: "active",
      universities: 8,
      selections: 28,
      createdBy: "John Doe",
      createdAt: "2023-09-01",
    },
    {
      id: "2",
      title: "Spring 2024",
      program: "Master in Business Analytics",
      programCode: "MiBA",
      status: "active",
      universities: 6,
      selections: 15,
      createdBy: "Jane Smith",
      createdAt: "2023-09-02",
    },
    {
      id: "3",
      title: "Spring 2023",
      program: "Master in Management",
      programCode: "MiM",
      status: "inactive",
      universities: 7,
      selections: 20,
      createdBy: "John Doe",
      createdAt: "2022-09-01",
    },
  ]

  // Filter packs based on search term and filters
  const filteredCoursePacks = courseElectivePacks.filter((pack) => {
    return (
      (searchTerm === "" ||
        pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.program.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (programFilter === "all" || pack.programCode === programFilter) &&
      (semesterFilter === "all" || pack.title === semesterFilter) &&
      (statusFilter === "all" || pack.status === statusFilter)
    )
  })

  const filteredExchangePacks = exchangePacks.filter((pack) => {
    return (
      (searchTerm === "" ||
        pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.program.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (programFilter === "all" || pack.programCode === programFilter) &&
      (semesterFilter === "all" || pack.title === semesterFilter) &&
      (statusFilter === "all" || pack.status === statusFilter)
    )
  })

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            Inactive
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            Draft
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Custom responsive grid class based on specific breakpoints
  const responsiveGridClass = "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"

  return (
    <DashboardLayout userRole="admin">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Elective Selections</h1>
            <p className="text-muted-foreground mt-2">Manage course elective and exchange selection packs</p>
          </div>
        </div>

        <Tabs defaultValue="courses" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="courses">Course Electives</TabsTrigger>
            <TabsTrigger value="exchange">Exchange Programs</TabsTrigger>
          </TabsList>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={`Search ${activeTab === "courses" ? "elective" : "exchange"} packs...`}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <Select value={programFilter} onValueChange={setProgramFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        <SelectItem value="MiM">Master in Management</SelectItem>
                        <SelectItem value="MiBA">Master in Business Analytics</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        <SelectItem value="Fall 2023">Fall 2023</SelectItem>
                        <SelectItem value="Spring 2024">Spring 2024</SelectItem>
                        <SelectItem value="Spring 2023">Spring 2023</SelectItem>
                        <SelectItem value="Fall 2022">Fall 2022</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="courses" className="mt-4">
                  {filteredCoursePacks.length > 0 ? (
                    <div className={responsiveGridClass}>
                      {filteredCoursePacks.map((pack) => (
                        <Card key={pack.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-xl">{pack.title}</CardTitle>
                              {getStatusBadge(pack.status)}
                            </div>
                            <CardDescription>
                              {pack.program} ({pack.programCode})
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Courses</p>
                                <p className="text-lg font-medium">{pack.courses}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Selections</p>
                                <p className="text-lg font-medium">{pack.selections}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Created by</p>
                                <p className="text-sm">
                                  {pack.createdBy} on {new Date(pack.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button asChild variant="outline">
                                <Link href={`/admin/electives/course/${pack.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    {pack.status === "active" ? "Deactivate" : "Activate"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No elective packs found.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="exchange" className="mt-4">
                  {filteredExchangePacks.length > 0 ? (
                    <div className={responsiveGridClass}>
                      {filteredExchangePacks.map((pack) => (
                        <Card key={pack.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-xl">{pack.title}</CardTitle>
                              {getStatusBadge(pack.status)}
                            </div>
                            <CardDescription>
                              {pack.program} ({pack.programCode})
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Universities</p>
                                <p className="text-lg font-medium">{pack.universities}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Selections</p>
                                <p className="text-lg font-medium">{pack.selections}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">Created by</p>
                                <p className="text-sm">
                                  {pack.createdBy} on {new Date(pack.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button asChild variant="outline">
                                <Link href={`/admin/electives/exchange/${pack.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    {pack.status === "active" ? "Deactivate" : "Activate"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">No exchange packs found.</p>
                    </div>
                  )}
                </TabsContent>
              </div>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
