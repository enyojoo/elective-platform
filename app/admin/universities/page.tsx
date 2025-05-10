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
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"

// Define the University type
interface University {
  id: string
  name: string
  name_ru: string | null
  country: string
  city: string
  city_ru: string | null
  website: string | null
  status: string
  created_at: string
  updated_at: string
  university_languages: string[] | null
  university_programs: string[] | null
}

// Define the Country type
interface Country {
  id: string
  code: string
  name: string
  name_ru: string | null
  created_at: string
}

export default function UniversitiesPage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [filteredUniversities, setFilteredUniversities] = useState<University[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution() // Moved hook call outside useEffect

  // Fetch countries from Supabase
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const { data, error } = await supabase.from("countries").select("*").order("name", { ascending: true })

        if (error) {
          throw error
        }

        if (data) {
          setCountries(data)
        }
      } catch (error) {
        console.error("Error fetching countries:", error)
        toast({
          title: t("admin.universities.error", "Error"),
          description: t("admin.universities.errorFetchingCountries", "Failed to fetch countries"),
          variant: "destructive",
        })
      }
    }

    fetchCountries()
  }, [supabase, toast, t])

  // Fetch universities from Supabase
  useEffect(() => {
    const fetchUniversities = async () => {
      setIsLoading(true)
      try {
        if (!institution?.id) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("universities")
          .select("*")
          .eq("institution_id", institution.id)
          .order("name", { ascending: true })

        if (error) {
          throw error
        }

        if (data) {
          setUniversities(data)
          setFilteredUniversities(data)
        }
      } catch (error) {
        console.error("Error fetching universities:", error)
        toast({
          title: t("admin.universities.error", "Error"),
          description: t("admin.universities.errorFetching", "Failed to fetch universities"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUniversities()
  }, [supabase, toast, t, institution?.id])

  // Filter universities based on search term and filters
  useEffect(() => {
    let result = [...universities]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (university) =>
          (university.name && university.name.toLowerCase().includes(term)) ||
          (university.name_ru && university.name_ru.toLowerCase().includes(term)) ||
          (university.city && university.city.toLowerCase().includes(term)) ||
          (university.city_ru && university.city_ru.toLowerCase().includes(term)),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((university) => university.status === statusFilter)
    }

    if (countryFilter !== "all") {
      result = result.filter((university) => university.country === countryFilter)
    }

    setFilteredUniversities(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchTerm, statusFilter, countryFilter, universities])

  // Get localized name based on current language
  const getLocalizedName = (university: University) => {
    if (language === "ru" && university.name_ru) {
      return university.name_ru
    }
    return university.name
  }

  // Get localized city based on current language
  const getLocalizedCity = (university: University) => {
    if (language === "ru" && university.city_ru) {
      return university.city_ru
    }
    return university.city
  }

  // Get localized country name based on current language
  const getLocalizedCountry = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode)
    if (!country) return countryCode

    if (language === "ru" && country.name_ru) {
      return country.name_ru
    }
    return country.name
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

  // Handle status change
  const handleStatusChange = async (universityId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from("universities").update({ status: newStatus }).eq("id", universityId)

      if (error) {
        throw error
      }

      // Update local state
      setUniversities((prev) =>
        prev.map((university) => (university.id === universityId ? { ...university, status: newStatus } : university)),
      )

      toast({
        title: t("admin.universities.statusUpdated", "Status updated"),
        description: t("admin.universities.statusUpdatedDesc", "University status has been updated"),
      })
    } catch (error) {
      console.error("Error updating university status:", error)
      toast({
        title: t("admin.universities.error", "Error"),
        description: t("admin.universities.errorUpdatingStatus", "Failed to update university status"),
        variant: "destructive",
      })
    }
  }

  // Handle university deletion
  const handleDeleteUniversity = async (universityId: string) => {
    if (
      window.confirm(
        t(
          "admin.universities.deleteConfirmMessage",
          "Are you sure you want to delete this university? This action cannot be undone.",
        ),
      )
    ) {
      try {
        const { error } = await supabase.from("universities").delete().eq("id", universityId)

        if (error) {
          throw error
        }

        // Update local state
        setUniversities((prev) => prev.filter((university) => university.id !== universityId))

        toast({
          title: t("admin.universities.deleteSuccess", "University deleted"),
          description: t("admin.universities.deleteSuccessDesc", "University has been deleted successfully"),
        })
      } catch (error) {
        console.error("Error deleting university:", error)
        toast({
          title: t("admin.universities.error", "Error"),
          description: t("admin.universities.errorDeleting", "Failed to delete university"),
          variant: "destructive",
        })
      }
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUniversities.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUniversities.length / itemsPerPage)

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
                        <SelectItem key={country.id} value={country.code}>
                          {language === "ru" && country.name_ru ? country.name_ru : country.name}
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
                      <TableHead>{t("admin.universities.status.label", "Status")}</TableHead>
                      <TableHead className="w-[80px]">{t("admin.universities.action", "Action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {t("admin.universities.loading", "Loading universities...")}
                        </TableCell>
                      </TableRow>
                    ) : currentItems.length > 0 ? (
                      currentItems.map((university) => (
                        <TableRow key={university.id}>
                          <TableCell className="font-medium">{getLocalizedName(university)}</TableCell>
                          <TableCell>{getLocalizedCountry(university.country)}</TableCell>
                          <TableCell>{getLocalizedCity(university)}</TableCell>
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
                                {university.status === "active" ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(university.id, "inactive")}>
                                    {t("admin.universities.deactivate", "Deactivate")}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleStatusChange(university.id, "active")}>
                                    {t("admin.universities.activate", "Activate")}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDeleteUniversity(university.id)}
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
                        <TableCell colSpan={5} className="h-24 text-center">
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
