"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Plus, MoreHorizontal, Eye, Pencil, Trash2, Power } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { formatDate } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { SafeDialog } from "@/components/safe-dialog"

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
}

export default function ManagerExchangeElectivesPage() {
  const [electivePacks, setElectivePacks] = useState<ElectivePack[]>([])
  const [filteredPacks, setFilteredPacks] = useState<ElectivePack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedPack, setSelectedPack] = useState<ElectivePack | null>(null)
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()
  const router = useRouter()

  useEffect(() => {
    const fetchElectivePacks = async () => {
      if (!institution?.id) return

      try {
        setIsLoading(true)

        // Fetch elective exchange programs
        const { data: packs, error } = await supabase
          .from("elective_exchange")
          .select("*")
          .eq("institution_id", institution.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching exchange programs:", error)
          throw error
        }

        // Process the data to include university count
        const processedPacks = (packs || []).map((pack) => {
          // Get university count from the universities array
          const universityCount = pack.universities ? pack.universities.length : 0

          return {
            ...pack,
            university_count: universityCount,
          }
        })

        setElectivePacks(processedPacks)
        setFilteredPacks(processedPacks)
      } catch (error) {
        console.error("Error fetching elective packs:", error)
        toast({
          title: t("manager.electives.error", "Error"),
          description: t("manager.electives.errorFetching", "Failed to fetch elective packs"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElectivePacks()
  }, [supabase, institution?.id, toast, t])

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

  // Handle status toggle
  const handleStatusToggle = async () => {
    if (!selectedPack) return

    try {
      const newStatus = selectedPack.status === "published" ? "closed" : "published"

      const { error } = await supabase.from("elective_exchange").update({ status: newStatus }).eq("id", selectedPack.id)

      if (error) throw error

      // Update local state
      const updatedPacks = electivePacks.map((pack) =>
        pack.id === selectedPack.id ? { ...pack, status: newStatus } : pack,
      )

      setElectivePacks(updatedPacks)

      toast({
        title: t("manager.electives.statusUpdated", "Status Updated"),
        description: t(
          "manager.electives.statusUpdateSuccess",
          `Exchange program has been ${newStatus === "published" ? "activated" : "deactivated"}`,
        ),
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: t("manager.electives.error", "Error"),
        description: t("manager.electives.statusUpdateFailed", "Failed to update status"),
        variant: "destructive",
      })
    } finally {
      setStatusDialogOpen(false)
      setSelectedPack(null)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!selectedPack) return

    try {
      const { error } = await supabase.from("elective_exchange").delete().eq("id", selectedPack.id)

      if (error) throw error

      // Update local state
      const updatedPacks = electivePacks.filter((pack) => pack.id !== selectedPack.id)
      setElectivePacks(updatedPacks)

      toast({
        title: t("manager.electives.deleted", "Deleted"),
        description: t("manager.electives.deleteSuccess", "Exchange program has been deleted"),
      })
    } catch (error) {
      console.error("Error deleting exchange program:", error)
      toast({
        title: t("manager.electives.error", "Error"),
        description: t("manager.electives.deleteFailed", "Failed to delete exchange program"),
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedPack(null)
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
              {t("manager.electives.subtitle", "Manage exchange programs for student mobility")}
            </p>
          </div>
          <Link href="/manager/electives/exchange-builder">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("manager.electives.create", "Create Exchange")}
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
                      <TableHead className="text-right w-[100px]">{t("manager.electives.action", "Action")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton columns={5} rows={5} />
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
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/manager/electives/exchange/${pack.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("common.view", "View")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/manager/electives/exchange/${pack.id}/edit`)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  {t("common.edit", "Edit")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPack(pack)
                                    setStatusDialogOpen(true)
                                  }}
                                >
                                  <Power className="mr-2 h-4 w-4" />
                                  {pack.status === "published"
                                    ? t("manager.electives.deactivate", "Deactivate")
                                    : t("manager.electives.activate", "Activate")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedPack(pack)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  {t("common.delete", "Delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
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

      {/* Delete Confirmation Dialog */}
      <SafeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("manager.electives.deleteConfirmTitle", "Delete Exchange Program")}
        description={t(
          "manager.electives.deleteConfirmDescription",
          "Are you sure you want to delete this exchange program? This action cannot be undone.",
        )}
        confirmText={t("common.delete", "Delete")}
        cancelText={t("common.cancel", "Cancel")}
        onConfirm={handleDelete}
        variant="destructive"
      />

      {/* Status Change Dialog */}
      <SafeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={
          selectedPack?.status === "published"
            ? t("manager.electives.deactivateTitle", "Deactivate Exchange Program")
            : t("manager.electives.activateTitle", "Activate Exchange Program")
        }
        description={
          selectedPack?.status === "published"
            ? t(
                "manager.electives.deactivateDescription",
                "Are you sure you want to deactivate this exchange program? Students will no longer be able to select it.",
              )
            : t(
                "manager.electives.activateDescription",
                "Are you sure you want to activate this exchange program? It will become visible to students.",
              )
        }
        confirmText={
          selectedPack?.status === "published"
            ? t("manager.electives.deactivate", "Deactivate")
            : t("manager.electives.activate", "Activate")
        }
        cancelText={t("common.cancel", "Cancel")}
        onConfirm={handleStatusToggle}
      />
    </DashboardLayout>
  )
}
