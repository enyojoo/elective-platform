"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { formatDate } from "@/lib/utils"
import { useDataCache } from "@/lib/data-cache-context"

interface ElectivePack {
  id: string
  name: string
  name_ru: string | null
  status: string
  deadline: string | null
  created_at: string
  updated_at: string
  max_selections: number
  university_count?: number
  created_by: string | null
  creator_name?: string
}

export default function ExchangeElectivesPage() {
  const [electivePacks, setElectivePacks] = useState<ElectivePack[]>([])
  const [filteredPacks, setFilteredPacks] = useState<ElectivePack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData } = useDataCache()

  useEffect(() => {
    const fetchElectivePacks = async () => {
      if (!institution?.id) return

      try {
        setIsLoading(true)

        // Try to get data from cache first
        const cachedData = getCachedData<{
          packs: ElectivePack[]
          filters: { searchTerm: string; statusFilter: string }
        }>("adminExchangePrograms", institution.id)

        if (
          cachedData &&
          cachedData.filters.searchTerm === searchTerm &&
          cachedData.filters.statusFilter === statusFilter
        ) {
          console.log("Using cached admin exchange programs data")
          setElectivePacks(cachedData.packs)
          setFilteredPacks(cachedData.packs)
          setIsLoading(false)
          return
        }

        console.log("Fetching admin exchange programs from API")
        // Fetch elective exchange programs
        const { data: packs, error } = await supabase
          .from("elective_exchange")
          .select(`
            *,
            creator:profiles(full_name)
          `)
          .eq("institution_id", institution.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching exchange programs:", error)
          throw error
        }

        // Process the data to include university count and creator name
        const processedPacks = (packs || []).map((pack) => {
          // Get university count from the universities array
          const universityCount = pack.universities ? pack.universities.length : 0

          // Get creator name from the joined profiles data
          const creatorName = pack.creator?.full_name || "Unknown"

          return {
            ...pack,
            university_count: universityCount,
            creator_name: creatorName,
          }
        })

        // Save to cache
        setCachedData("adminExchangePrograms", institution.id, {
          packs: processedPacks,
          filters: { searchTerm, statusFilter },
        })

        setElectivePacks(processedPacks)
        setFilteredPacks(processedPacks)
      } catch (error) {
        console.error("Error fetching elective packs:", error)
        toast({
          title: t("admin.electives.error", "Error"),
          description: t("admin.electives.errorFetching", "Failed to fetch elective packs"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElectivePacks()
  }, [supabase, institution?.id, toast, t, searchTerm, statusFilter, getCachedData, setCachedData])

  // Filter elective packs based on search term and status filter
  useEffect(() => {
    let result = [...electivePacks]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (pack) =>
          (pack.name && pack.name.toLowerCase().includes(term)) ||
          (pack.name_ru && pack.name_ru.toLowerCase().includes(term)),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((pack) => pack.status === statusFilter)
    }

    setFilteredPacks(result)
  }, [searchTerm, statusFilter, electivePacks])

  // Get localized name based on current language
  const getLocalizedName = (pack: ElectivePack) => {
    if (language === "ru" && pack.name_ru) {
      return pack.name_ru
    }
    return pack.name
  }

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("manager.status.published", "Published")}
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            {t("manager.status.draft", "Draft")}
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("manager.status.closed", "Closed")}
          </Badge>
        )
      case "archived":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
            {t("manager.status.archived", "Archived")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("manager.electives.exchangePrograms", "Exchange Programs")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t("admin.electives.subtitle", "Manage exchange programs for student mobility")}
            </p>
          </div>
          <Link href="/admin/electives/exchange/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("manager.electives.addExchange", "Add Exchange")}
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
                    placeholder={t("manager.electives.searchExchange", "Search exchange programs...")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("manager.electives.status", "Status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("manager.electives.allStatus", "All Status")}</SelectItem>
                      <SelectItem value="published">{t("manager.electives.active", "Active")}</SelectItem>
                      <SelectItem value="draft">{t("manager.electives.draft", "Draft")}</SelectItem>
                      <SelectItem value="closed">{t("manager.electives.inactive", "Inactive")}</SelectItem>
                      <SelectItem value="archived">{t("manager.status.archived", "Archived")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">{t("manager.electives.name", "Name")}</TableHead>
                      <TableHead>{t("manager.electives.deadline", "Deadline")}</TableHead>
                      <TableHead>{t("manager.electives.universities", "Universities")}</TableHead>
                      <TableHead>{t("manager.electives.status", "Status")}</TableHead>
                      <TableHead>{t("manager.electives.createdBy", "Created by")}</TableHead>
                      <TableHead className="text-right">{t("manager.electives.action", "Action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton columns={6} rows={5} />
                    ) : filteredPacks.length > 0 ? (
                      filteredPacks.map((pack) => (
                        <TableRow key={pack.id}>
                          <TableCell className="font-medium">{getLocalizedName(pack)}</TableCell>
                          <TableCell>
                            {pack.deadline ? (
                              formatDate(pack.deadline)
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>{pack.university_count || 0}</TableCell>
                          <TableCell>{getStatusBadge(pack.status)}</TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">{pack.creator_name || "Admin"}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/electives/exchange/${pack.id}`}>
                              <Button variant="outline" size="sm">
                                {t("manager.electives.viewDetails", "View Details")}
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          {t("manager.electives.noExchangePrograms", "No exchange programs found.")}
                        </TableCell>
                      </TableRow>
                    )}
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
