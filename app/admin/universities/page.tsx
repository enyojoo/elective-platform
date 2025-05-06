"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal, Filter, Plus, Globe } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { Skeleton } from "@/components/ui/skeleton"

export default function UniversitiesPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const { toast } = useToast()

  const [universities, setUniversities] = useState<any[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const itemsPerPage = 10

  // Fetch universities data
  useEffect(() => {
    if (!institution?.id) return

    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Try to get universities from cache first
        const cachedUniversities = getCachedData<any[]>("universities", institution.id)

        if (cachedUniversities) {
          setUniversities(cachedUniversities)

          // Extract unique countries from cached data
          const uniqueCountries = Array.from(
            new Set(cachedUniversities.map((uni) => uni.country).filter(Boolean)),
          ) as string[]

          setCountries(uniqueCountries)
          setIsLoading(false)
          return
        }

        // If not in cache, fetch from Supabase
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

        const { data: universitiesData, error: universitiesError } = await supabase
          .from("partner_universities")
          .select("*")
          .eq("institution_id", institution.id)

        if (universitiesError) throw universitiesError

        setUniversities(universitiesData || [])
        setCachedData("universities", institution.id, universitiesData || [])

        // Extract unique countries
        const uniqueCountries = Array.from(
          new Set(universitiesData?.map((uni) => uni.country).filter(Boolean)),
        ) as string[]

        setCountries(uniqueCountries)
      } catch (error: any) {
        console.error("Error fetching universities:", error)
        toast({
          title: "Error",
          description: "Failed to load universities data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [institution?.id, getCachedData, setCachedData, toast])

  // Function to toggle university status
  const toggleUniversityStatus = async (universityId: string, currentStatus: string) => {
    if (!institution?.id || isUpdating) return

    setIsUpdating(true)

    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"

      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error } = await supabase.from("partner_universities").update({ status: newStatus }).eq("id", universityId)

      if (error) throw error

      // Update local state
      setUniversities((prevUniversities) =>
        prevUniversities.map((university) =>
          university.id === universityId ? { ...university, status: newStatus } : university,
        ),
      )

      // Update cache
      invalidateCache("universities", institution.id)
      setCachedData(
        "universities",
        institution.id,
        universities.map((university) =>
          university.id === universityId ? { ...university, status: newStatus } : university,
        ),
      )

      toast({
        title: "Success",
        description: `University ${newStatus === "active" ? "activated" : "deactivated"} successfully.`,
      })
    } catch (error: any) {
      console.error("Error updating university status:", error)
      toast({
        title: "Error",
        description: "Failed to update university status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Function to delete a university
  const deleteUniversity = async (universityId: string) => {
    if (!institution?.id || isUpdating) return

    if (!confirm(t("admin.universities.confirmDelete", "Are you sure you want to delete this university?"))) return

    setIsUpdating(true)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      const { error } = await supabase.from("partner_universities").delete().eq("id", universityId)

      if (error) throw error

      // Update local state
      setUniversities((prevUniversities) => prevUniversities.filter((university) => university.id !== universityId))

      // Update cache
      invalidateCache("universities", institution.id)
      setCachedData(
        "universities",
        institution.id,
        universities.filter((university) => university.id !== universityId),
      )

      toast({
        title: "Success",
        description: "University deleted successfully.",
      })
    } catch (error: any) {
      console.error("Error deleting university:", error)
      toast({
        title: "Error",
        description: "Failed to delete university. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Filter universities based on search term and filters
  const filteredUniversities = universities.filter((university) => {
    const matchesSearch =
      searchTerm === "" ||
      university.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      university.city?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || university.status === statusFilter

    const matchesCountry = countryFilter === "all" || university.country === countryFilter

    return matchesSearch && matchesStatus && matchesCountry
  })

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUniversities.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUniversities.length / itemsPerPage)

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("admin.universities.status.active", "Active")}
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("admin.universities.status.inactive", "Inactive")}
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            {t("admin.universities.status.draft", "Draft")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("admin.universities.title", "Partner Universities")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("admin.universities.subtitle", "Manage partner universities for student exchange programs")}
            </p>
          </div>
          <Link href="/admin/universities/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.universities.addUniversity", "Add University")}
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("admin.universities.search", "Search universities...")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.universities.status.label", "Status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.universities.allStatus", "All Status")}</SelectItem>
                      <SelectItem value="active">{t("admin.universities.active", "Active")}</SelectItem>
                      <SelectItem value="inactive">{t("admin.universities.inactive", "Inactive")}</SelectItem>
                      <SelectItem value="draft">{t("admin.universities.draft", "Draft")}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={countryFilter}
                    onValueChange={(value) => {
                      setCountryFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Globe className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("admin.universities.country", "Country")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("admin.universities.allCountries", "All Countries")}</SelectItem>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">{t("admin.universities.name", "Name")}</TableHead>
                      <TableHead>{t("admin.universities.country", "Country")}</TableHead>
                      <TableHead>{t("admin.universities.city", "City")}</TableHead>
                      <TableHead>{t("admin.universities.exchangePrograms", "Exchange Programs")}</TableHead>
                      <TableHead>{t("admin.universities.status.label", "Status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.universities.action", "Action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      // Show skeleton rows while loading
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : currentItems.length > 0 ? (
                      currentItems.map((university) => (
                        <TableRow key={university.id}>
                          <TableCell className="font-medium">{university.name}</TableCell>
                          <TableCell>{university.country}</TableCell>
                          <TableCell>{university.city}</TableCell>
                          <TableCell>{university.exchange_programs_count || 0}</TableCell>
                          <TableCell>{getStatusBadge(university.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Link href={`/admin/universities/${university.id}`} className="w-full">
                                    {t("admin.universities.view", "View Details")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Link href={`/admin/universities/${university.id}/edit`} className="w-full">
                                    {t("admin.universities.edit", "Edit")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    toggleUniversityStatus(university.id, university.status)
                                  }}
                                >
                                  {university.status === "active"
                                    ? t("admin.universities.deactivate", "Deactivate")
                                    : t("admin.universities.activate", "Activate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    deleteUniversity(university.id)
                                  }}
                                >
                                  {t("admin.universities.delete", "Delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {t("admin.universities.noUniversitiesFound", "No universities found matching your criteria")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredUniversities.length > itemsPerPage && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) setCurrentPage(currentPage - 1)
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === 1}
                        aria-label={t("pagination.previous", "Previous")}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault()
                            setCurrentPage(page)
                          }}
                          aria-label={`${t("pagination.page", "Page")} ${page}`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        aria-disabled={currentPage === totalPages}
                        aria-label={t("pagination.next", "Next")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
