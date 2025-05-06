"use client"

import { useState, useEffect, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Eye } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { useCachedElectives } from "@/hooks/use-cached-electives"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"

// Move mock data outside the component to avoid recreating it on each render
const courseElectivePacksMock = [
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
    deadline: "2023-09-15",
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
    deadline: "2023-12-15",
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
    deadline: "2022-12-15",
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
    deadline: "2022-09-15",
  },
]

const exchangePacksMock = [
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
    deadline: "2023-09-10",
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
    deadline: "2023-12-10",
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
    deadline: "2022-12-10",
  },
]

export default function AdminElectivesPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam === "exchange" ? "exchange" : "courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { t } = useLanguage()
  const { institution } = useInstitution()

  // Use cached electives data
  const { data: electivesData, isLoading, isInitialized } = useCachedElectives(institution?.id)

  // Use the mock data as fallback until we have real data
  const courseElectivePacks = electivesData?.coursePacks || courseElectivePacksMock

  const exchangePacks = electivesData?.exchangePacks || exchangePacksMock

  // Update activeTab when URL parameters change
  useEffect(() => {
    setActiveTab(tabParam === "exchange" ? "exchange" : "courses")
  }, [tabParam])

  // Use useMemo to avoid recalculating filtered data on every render
  const filteredCoursePacks = useMemo(() => {
    return courseElectivePacks.filter((selection) => {
      return (
        (searchTerm === "" ||
          selection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          selection.program.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (programFilter === "all" || selection.programCode === programFilter) &&
        (semesterFilter === "all" || selection.title === semesterFilter) &&
        (statusFilter === "all" || selection.status === statusFilter)
      )
    })
  }, [searchTerm, programFilter, semesterFilter, statusFilter, courseElectivePacks])

  const filteredExchangePacks = useMemo(() => {
    return exchangePacks.filter((program) => {
      return (
        (searchTerm === "" ||
          program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.program.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (programFilter === "all" || program.programCode === programFilter) &&
        (semesterFilter === "all" || program.title === semesterFilter) &&
        (statusFilter === "all" || program.status === statusFilter)
      )
    })
  }, [searchTerm, programFilter, semesterFilter, statusFilter, exchangePacks])

  // Get status badge based on status
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

  if (!isInitialized) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-4 w-[350px] mt-2" />
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-10 w-[250px]" />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[180px]" />
                    <Skeleton className="h-10 w-[130px]" />
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-2">
                        <Skeleton className="h-6 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                        <Skeleton className="h-10 w-[150px] mx-auto" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="admin">
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
                        <SelectItem value="Fall 2022">Fall 2022</SelectItem>
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
                                <p className="text-sm text-muted-foreground">{t("manager.electives.deadline")}:</p>
                                <p className="text-sm">{new Date(pack.deadline).toLocaleDateString()}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">{t("manager.electives.createdBy")}:</p>
                                <p className="text-sm">
                                  {pack.createdBy} on {new Date(pack.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-center">
                              <Button asChild variant="outline">
                                <Link href={`/admin/electives/course/${pack.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("manager.electives.viewDetails")}
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">{t("manager.electives.noCourseElectives")}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="exchange" className="mt-0">
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
                                <p className="text-sm text-muted-foreground">{t("manager.electives.universities")}</p>
                                <p className="text-lg font-medium">{pack.universities}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{t("manager.electives.selections")}</p>
                                <p className="text-lg font-medium">{pack.selections}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">{t("manager.electives.deadline")}:</p>
                                <p className="text-sm">{new Date(pack.deadline).toLocaleDateString()}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-sm text-muted-foreground">{t("manager.electives.createdBy")}:</p>
                                <p className="text-sm">
                                  {pack.createdBy} on {new Date(pack.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-center">
                              <Button asChild variant="outline">
                                <Link href={`/admin/electives/exchange/${pack.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("manager.electives.viewDetails")}
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">{t("manager.electives.noExchangePrograms")}</p>
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
