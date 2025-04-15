"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Eye, MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserRole } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/language-context"

// Move mock data outside the component to avoid recreating it on each render
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
]

// Mock data for exchange programs
const exchangePrograms = [
  {
    id: "1",
    title: "Fall 2023",
    program: "Master in Management",
    programCode: "MiM",
    status: "active",
    universities: 8,
    selections: 30,
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
    selections: 25,
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
    selections: 28,
    createdBy: "John Doe",
    createdAt: "2022-09-01",
  },
]

export default function ManageElectivesPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam === "exchange" ? "exchange" : "courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { t } = useLanguage()

  // Update activeTab when URL parameters change
  useEffect(() => {
    setActiveTab(tabParam === "exchange" ? "exchange" : "courses")
  }, [tabParam])

  // Use useMemo to avoid recalculating filtered data on every render
  const filteredCoursePacks = useMemo(() => {
    return courseElectivePacks.filter((pack) => {
      return (
        (searchTerm === "" ||
          pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pack.program.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (programFilter === "all" || pack.programCode === programFilter) &&
        (semesterFilter === "all" || pack.title === semesterFilter) &&
        (statusFilter === "all" || pack.status === statusFilter)
      )
    })
  }, [searchTerm, programFilter, semesterFilter, statusFilter])

  // Use useMemo for exchange programs as well
  const filteredExchangePrograms = useMemo(() => {
    return exchangePrograms.filter((pack) => {
      return (
        (searchTerm === "" ||
          pack.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pack.program.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (programFilter === "all" || pack.programCode === programFilter) &&
        (semesterFilter === "all" || pack.title === semesterFilter) &&
        (statusFilter === "all" || pack.status === statusFilter)
      )
    })
  }, [searchTerm, programFilter, semesterFilter, statusFilter])

  // Get status badge based on status - memoize this function to avoid recreating it on each render
  const getStatusBadge = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case "active":
          return (
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
              {t("manager.electives.active")}
            </Badge>
          )
        case "inactive":
          return (
            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
              {t("manager.electives.inactive")}
            </Badge>
          )
        case "draft":
          return (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
              {t("manager.electives.draft")}
            </Badge>
          )
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    }
  }, [t])

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchTerm("")
  }

  // Custom responsive grid class based on specific breakpoints
  const responsiveGridClass = "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("manager.electives.title")}</h1>
            <p className="text-muted-foreground mt-2">{t("manager.electives.subtitle")}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="courses">{t("manager.electives.courseElectives")}</TabsTrigger>
                  <TabsTrigger value="exchange">{t("manager.electives.exchangePrograms")}</TabsTrigger>
                </TabsList>

                {activeTab === "courses" ? (
                  <Link href="/manager/electives/course-builder">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("manager.electives.create")}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/manager/electives/exchange-builder">
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("manager.electives.create")}
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={
                        activeTab === "courses"
                          ? t("manager.electives.searchCourses")
                          : t("manager.electives.searchExchange")
                      }
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <Select value={programFilter} onValueChange={setProgramFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder={t("manager.electives.program")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("manager.electives.allPrograms")}</SelectItem>
                        <SelectItem value="MiM">Master in Management</SelectItem>
                        <SelectItem value="MiBA">Master in Business Analytics</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder={t("manager.electives.semester")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("manager.electives.allSemesters")}</SelectItem>
                        <SelectItem value="Fall 2023">Fall 2023</SelectItem>
                        <SelectItem value="Spring 2024">Spring 2024</SelectItem>
                        <SelectItem value="Spring 2023">Spring 2023</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder={t("manager.electives.status")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("manager.electives.allStatus")}</SelectItem>
                        <SelectItem value="active">{t("manager.electives.active")}</SelectItem>
                        <SelectItem value="inactive">{t("manager.electives.inactive")}</SelectItem>
                        <SelectItem value="draft">{t("manager.electives.draft")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="courses" className="mt-0">
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
                                <p className="text-sm text-muted-foreground">{t("manager.electives.courses")}</p>
                                <p className="text-lg font-medium">{pack.courses}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{t("manager.electives.selections")}</p>
                                <p className="text-lg font-medium">{pack.selections}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">{t("manager.electives.createdBy")}</p>
                                <p className="text-sm">
                                  {pack.createdBy} {t("manager.electives.on")}{" "}
                                  {new Date(pack.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button asChild variant="outline">
                                <Link href={`/manager/electives/course/${pack.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("manager.electives.viewDetails")}
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
                                    {pack.status === "active"
                                      ? t("manager.electives.inactive")
                                      : t("manager.electives.active")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manager/electives/course/${pack.id}/edit`}>
                                      {t("manager.electives.edit")}
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>{t("manager.electives.exportData")}</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">{t("manager.electives.noCourseElectives")}</p>
                      <Button asChild variant="outline" className="mt-4">
                        <Link href="/manager/electives/course-builder">
                          <Plus className="mr-2 h-4 w-4" />
                          {t("manager.electives.createNewElectivePack")}
                        </Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="exchange" className="mt-0">
                  {filteredExchangePrograms.length > 0 ? (
                    <div className={responsiveGridClass}>
                      {filteredExchangePrograms.map((pack) => (
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
                                <p className="text-sm text-muted-foreground">{t("manager.electives.universities")}</p>
                                <p className="text-lg font-medium">{pack.universities}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{t("manager.electives.selections")}</p>
                                <p className="text-lg font-medium">{pack.selections}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">{t("manager.electives.createdBy")}</p>
                                <p className="text-sm">
                                  {pack.createdBy} {t("manager.electives.on")}{" "}
                                  {new Date(pack.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <Button asChild variant="outline">
                                <Link href={`/manager/electives/exchange/${pack.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("manager.electives.viewDetails")}
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
                                    {pack.status === "active"
                                      ? t("manager.electives.inactive")
                                      : t("manager.electives.active")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manager/electives/exchange/${pack.id}/edit`}>
                                      {t("manager.electives.edit")}
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>{t("manager.electives.exportData")}</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">{t("manager.electives.noExchangePrograms")}</p>
                      <Button asChild variant="outline" className="mt-4">
                        <Link href="/manager/electives/exchange-builder">
                          <Plus className="mr-2 h-4 w-4" />
                          {t("manager.electives.createNewExchangeProgram")}
                        </Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
