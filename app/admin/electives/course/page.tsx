"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Eye } from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useLanguage } from "@/lib/language-context"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"
import { useInstitutionContext } from "@/lib/institution-context"

export default function AdminCourseElectivesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [programFilter, setProgramFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { t } = useLanguage()
  const { toast } = useToast()
  const { institution } = useInstitutionContext()
  const { getCachedData, setCachedData } = useDataCache()

  const [courseElectivePacks, setCourseElectivePacks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [programs, setPrograms] = useState<any[]>([])
  const [semesters, setSemesters] = useState<string[]>([])

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
          setIsLoading(false)
        } else {
          setIsLoading(true)

          // Fetch course elective packs
          const { data: courseData, error: courseError } = await supabase
            .from("elective_packs")
            .select(`
              id, 
              title, 
              status, 
              created_at, 
              deadline,
              program:program_id(id, name, code),
              courses:elective_courses(id),
              selections:student_course_selections(id)
            `)
            .eq("institution_id", institution.id)
            .eq("type", "course")
            .order("created_at", { ascending: false })

          if (courseError) throw courseError

          if (courseData) {
            // Format the data
            const formattedCourseData = courseData.map((pack) => ({
              id: pack.id,
              title: pack.title,
              program: pack.program?.name || "Unknown",
              programCode: pack.program?.code || "N/A",
              status: pack.status,
              courses: pack.courses?.length || 0,
              selections: pack.selections?.length || 0,
              createdAt: pack.created_at,
              deadline: pack.deadline,
            }))

            setCourseElectivePacks(formattedCourseData)
            setCachedData("courseElectives", institution.id, formattedCourseData)

            // Extract unique semesters
            const semesterList = [...new Set(formattedCourseData.map((pack) => pack.title))]
            setSemesters(semesterList)
          }

          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching elective packs:", error)
        toast({
          title: "Error",
          description: "Failed to load elective packs data",
          variant: "destructive",
        })
        setIsLoading(false)
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

  // Custom responsive grid class based on specific breakpoints
  const responsiveGridClass = "grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"

  // Render skeleton cards for loading state
  const renderSkeletonCards = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <Card key={`skeleton-${index}`} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 pb-2">
            <div className="flex justify-between items-start">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
          <div className="p-6 pt-2">
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
            <h1 className="text-3xl font-bold tracking-tight">{t("manager.electives.courseElectives")}</h1>
            <p className="text-muted-foreground mt-2">{t("manager.electives.subtitle")}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("manager.electives.searchCourses")}
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

              {isLoading ? (
                <div className={responsiveGridClass}>{renderSkeletonCards()}</div>
              ) : filteredCoursePacks.length > 0 ? (
                <div className={responsiveGridClass}>
                  {filteredCoursePacks.map((pack) => (
                    <Card key={pack.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6 pb-2">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-medium">{pack.title}</h3>
                            {getStatusBadge(pack.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pack.program} ({pack.programCode})
                          </p>
                        </div>
                        <div className="p-6 pt-2">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
