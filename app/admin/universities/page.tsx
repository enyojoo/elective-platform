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
import { useCachedUniversities, type University } from "@/hooks/use-cached-universities"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataCache } from "@/lib/data-cache-context"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

// Mock universities data
const mockUniversities = [
  {
    id: 1,
    name: "Harvard University",
    country: "United States",
    city: "Cambridge",
    website: "https://www.harvard.edu",
    exchangePrograms: 5,
    status: "active",
  },
  {
    id: 2,
    name: "University of Oxford",
    country: "United Kingdom",
    city: "Oxford",
    website: "https://www.ox.ac.uk",
    exchangePrograms: 3,
    status: "active",
  },
  {
    id: 3,
    name: "ETH Zurich",
    country: "Switzerland",
    city: "Zurich",
    website: "https://ethz.ch",
    exchangePrograms: 2,
    status: "inactive",
  },
  {
    id: 4,
    name: "National University of Singapore",
    country: "Singapore",
    city: "Singapore",
    website: "https://www.nus.edu.sg",
    exchangePrograms: 4,
    status: "active",
  },
  {
    id: 5,
    name: "University of Tokyo",
    country: "Japan",
    city: "Tokyo",
    website: "https://www.u-tokyo.ac.jp",
    exchangePrograms: 1,
    status: "draft",
  },
  {
    id: 6,
    name: "Sorbonne University",
    country: "France",
    city: "Paris",
    website: "https://www.sorbonne-universite.fr",
    exchangePrograms: 3,
    status: "active",
  },
  {
    id: 7,
    name: "Tsinghua University",
    country: "China",
    city: "Beijing",
    website: "https://www.tsinghua.edu.cn",
    exchangePrograms: 2,
    status: "inactive",
  },
  {
    id: 8,
    name: "University of Melbourne",
    country: "Australia",
    city: "Melbourne",
    website: "https://www.unimelb.edu.au",
    exchangePrograms: 3,
    status: "active",
  },
]

// Mock countries for filtering
const countriesMock = [
  "United States",
  "United Kingdom",
  "Switzerland",
  "Singapore",
  "Japan",
  "France",
  "China",
  "Australia",
]

export default function UniversitiesPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const { data: universities, isLoading, error, isInitialized } = useCachedUniversities(institution?.id)
  const { invalidateCache } = useDataCache()
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  // Get unique countries for filtering
  const countries = universities
    ? [...new Set(universities.map((uni) => uni.country))].sort()
    : ["United States", "United Kingdom", "Switzerland", "Singapore", "Japan", "France", "China", "Australia"]

  // Filter universities based on search term and filters
  useEffect(() => {
    if (!universities) return

    let result = [...universities]

    if (searchTerm) {
      result = result.filter(
        (university) =>
          university.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          university.city.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((university) => university.status === statusFilter)
    }

    if (countryFilter !== "all") {
      result = result.filter((university) => university.country === countryFilter)
    }

    setFilteredUniversities(result)
    setTotalPages(Math.ceil(result.length / itemsPerPage))
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, statusFilter, countryFilter, universities])

  const getCurrentPageItems = () => {
    if (!filteredUniversities) return []
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUniversities.slice(startIndex, endIndex)
  }

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("admin.universities.status.active")}
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("admin.universities.status.inactive")}
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            {t("admin.universities.status.draft")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = universities.slice(indexOfFirstItem, indexOfLastItem)
  const totalPagesOld = universities ? Math.ceil(universities.length / itemsPerPage) : 1

  if (!isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-[250px]" />
              <Skeleton className="h-4 w-[350px] mt-2" />
            </div>
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-[130px]" />
                    <Skeleton className="h-10 w-[180px]" />
                  </div>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                        <TableHead>
                          <Skeleton className="h-5 w-full" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={`skeleton-${index}`}>
                          <TableCell>
                            <Skeleton className="h-5 w-[120px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[60px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-[80px]" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
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
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
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

                  <Select value={countryFilter} onValueChange={setCountryFilter}>
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
                    {getCurrentPageItems().length > 0 ? (
                      getCurrentPageItems().map((university) => (
                        <TableRow key={university.id}>
                          <TableCell className="font-medium">{university.name}</TableCell>
                          <TableCell>{university.country}</TableCell>
                          <TableCell>{university.city}</TableCell>
                          <TableCell>{university.exchangePrograms}</TableCell>
                          <TableCell>{getStatusBadge(university.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
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
                                <DropdownMenuItem>
                                  {university.status === "active"
                                    ? t("admin.universities.deactivate", "Deactivate")
                                    : t("admin.universities.activate", "Activate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
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
