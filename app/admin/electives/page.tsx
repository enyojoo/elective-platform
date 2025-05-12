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
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"
import { useInstitutionContext } from "@/lib/institution-context"

export default function AdminElectivesPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState(tabParam === "exchange" ? "exchange" : "courses")
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { t } = useLanguage()
  const { toast } = useToast()
  const { institution } = useInstitutionContext()
  const { getCachedData, setCachedData } = useDataCache()

  const [courseElectivePacks, setCourseElectivePacks] = useState<any[]>([])
  const [exchangePacks, setExchangePacks] = useState<any[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [isLoadingExchange, setIsLoadingExchange] = useState(true)
  const [programs, setPrograms] = useState<any[]>([])
  const [semesters, setSemesters] = useState<string[]>([])

  // Update activeTab when URL parameters change
  useEffect(() => {
    setActiveTab(tabParam === "exchange" ? "exchange" : "courses")
  }, [tabParam])

  // Fetch programs for filtering
  useEffect(() => {
    if (!institution?.id) return

    const fetchPrograms = async () => {
      try {
        // Try to get programs from cache
        const cachedPrograms = getCachedData<any[]>("programs", institution.id)

        if (cachedPrograms) {
          setPrograms(cachedPrograms)
          return
        }

        const { data, error } = await supabase
          .from("programs")
          .select("id, name, code")
          .eq("institution_id", institution.id)
          .order("name")

        if (error) throw error

        if (data) {
          setPrograms(data)
          setCachedData("programs", institution.id, data)
        }
      } catch (error) {
        console.error("Error fetching programs:", error)
        toast({
          title: "Error",
          description: "Failed to load programs data",
          variant: "destructive",
        })
      }
    }

    fetchPrograms()
  }, [institution?.id, getCachedData, setCachedData, toast])

  // Fetch elective packs data
  useEffect(() => {
    if (!institution?.id) return

    const fetchElectivePacks = async () => {
      try {
        // Try to get course electives from cache
        const cachedCourseElectives = getCachedData<any[]>("courseElectives", institution.id)

        if (cachedCourseElectives) {
          setCourseElectivePacks(cachedCourseElectives)
          setIsLoadingCourses(false)
        } else {
          setIsLoadingCourses(true)

          // Fetch course elective packs
          const { data: courseData, error: courseError } = await supabase
            .from("elective_packs")
            .select(`
    id, 
    name,
    name_ru,
    description,
    description_ru,
    status, 
    created_at,
    academic_year_id,
    academic_year:academic_year_id(id, year),
    courses:courses(id)
  `)
            .eq("institution_id", institution.id)
            .eq("type", "course")
            .order("created_at", { ascending: false })

          if (courseError) throw courseError

          if (courseData) {
            // Format the data
            const formattedCourseData = courseData.map((pack) => ({
              id: pack.id,
              title: pack.name || "Untitled",
              program: pack.academic_year?.year || "Unknown",
              programCode: "N/A",
              status: pack.status,
              courses: pack.courses?.length || 0,
              selections: 0, // We'll need to update this separately if needed
              createdAt: pack.created_at,
              deadline: null, // Update if there's a deadline field
            }))

            setCourseElectivePacks(formattedCourseData)
            setCachedData("courseElectives", institution.id, formattedCourseData)

            // Extract unique semesters/academic years
            const semesterList = [...new Set(formattedCourseData.map((pack) => pack.title))]
            setSemesters(semesterList)
          }

          setIsLoadingCourses(false)
        }

        // Try to get exchange programs from cache
        const cachedExchangePrograms = getCachedData<any[]>("exchangePrograms", institution.id)

        if (cachedExchangePrograms) {
          setExchangePacks(cachedExchangePrograms)
          setIsLoadingExchange(false)
        } else {
          setIsLoadingExchange(true)

          // Fetch exchange programs
          const { data: exchangeData, error: exchangeError } = await supabase
            .from("elective_packs")
            .select(`
    id, 
    name,
    name_ru,
    description,
    description_ru,
    status, 
    created_at,
    academic_year_id,
    academic_year:academic_year_id(id, year)
  `)
            .eq("institution_id", institution.id)
            .eq("type", "exchange")
            .order("created_at", { ascending: false })

          if (exchangeError) throw exchangeError

          if (exchangeData) {
            // Format the data
            const formattedExchangeData = exchangeData.map((pack) => ({
              id: pack.id,
              title: pack.name || "Untitled",
              program: pack.academic_year?.year || "Unknown",
              programCode: "N/A",
              status: pack.status,
              universities: 0, // Update if there's a way to count universities
              selections: 0, // Update if there's a way to count selections
              createdAt: pack.created_at,
              deadline: null, // Update if there's a deadline field
            }))

            setExchangePacks(formattedExchangeData)
            setCachedData("exchangePrograms", institution.id, formattedExchangeData)

            // Update semesters if needed
            if (semesters.length === 0) {
              const semesterList = [...new Set(formattedExchangeData.map((pack) => pack.title))]
              setSemesters(semesterList)
            }
          }

          setIsLoadingExchange(false)
        }
      } catch (error) {
        console.error("Error fetching elective packs:", error)
        toast({
          title: "Error",
          description: "Failed to load elective packs data",
          variant: "destructive",
        })
        setIsLoadingCourses(false)
        setIsLoadingExchange(false)
      }
    }

    fetchElectivePacks()
  }, [institution?.id, getCachedData, setCachedData, toast])

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
  }, [courseElectivePacks, searchTerm, programFilter, semesterFilter, statusFilter])

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
  }, [exchangePacks, searchTerm, programFilter, semesterFilter, statusFilter])

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
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

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchTerm("")
  }

  // Custom responsive grid class based on specific breakpoints
  const responsiveGridClass = "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"

  // Render skeleton cards for loading state
  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <Card key={`skeleton-${index}`} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-8" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-8" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>
    ))
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
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.code}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder={t("manager.electives.semester")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("manager.electives.allSemesters")}</SelectItem>
                        {semesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
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
                  {isLoadingCourses ? (
                    <div className={responsiveGridClass}>{renderSkeletonCards()}</div>
                  ) : filteredCoursePacks.length > 0 ? (
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
                                <p className="text-sm text-muted-foreground">{t("manager.electives.createdAt")}:</p>
                                <p className="text-sm">{new Date(pack.createdAt).toLocaleDateString()}</p>
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
                  {isLoadingExchange ? (
                    <div className={responsiveGridClass}>{renderSkeletonCards()}</div>
                  ) : filteredExchangePacks.length > 0 ? (
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
                                <p className="text-sm text-muted-foreground">{t("manager.electives.createdAt")}:</p>
                                <p className="text-sm">{new Date(pack.createdAt).toLocaleDateString()}</p>
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
