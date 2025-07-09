"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreVertical, Edit, Eye, Trash2, Archive, CheckCircle, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataCache } from "@/lib/data-cache-context"
import { formatDate } from "@/lib/utils"

interface ExchangeProgram {
  id: string
  name: string
  name_ru: string | null
  status: string
  deadline: string
  max_selections: number
  universities: string[]
  created_at: string
  updated_at: string
}

export default function ExchangeProgramsPage() {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()

  const [exchangePrograms, setExchangePrograms] = useState<ExchangeProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (institution?.id) {
      loadExchangePrograms()
    }
  }, [institution?.id])

  const loadExchangePrograms = async () => {
    if (!institution?.id) return

    setIsLoading(true)
    try {
      // Try to get cached data first
      const cacheKey = `exchangePrograms_${institution.id}`
      const cachedData = getCachedData(cacheKey)

      if (cachedData) {
        setExchangePrograms(cachedData)
        setIsLoading(false)
        return
      }

      console.log("Fetching exchange programs for institution:", institution.id)

      const { data, error } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("institution_id", institution.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching exchange programs:", error)
        throw error
      }

      console.log("Exchange programs loaded:", data)
      setExchangePrograms(data || [])
      setCachedData(cacheKey, data || [])
    } catch (error) {
      console.error("Error loading exchange programs:", error)
      toast({
        title: "Error",
        description: "Failed to load exchange programs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "published":
        return <Badge variant="secondary">Published</Badge>
      case "closed":
        return <Badge variant="destructive">Closed</Badge>
      case "archived":
        return <Badge variant="default">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handle status change
  const handleStatusChange = async (programId: string, newStatus: string, programName: string) => {
    try {
      const { error } = await supabase
        .from("elective_exchange")
        .update({ status: newStatus })
        .eq("id", programId)
        .eq("institution_id", institution?.id)

      if (error) throw error

      // Update local state
      setExchangePrograms((prev) =>
        prev.map((program) => (program.id === programId ? { ...program, status: newStatus } : program)),
      )

      // Invalidate cache
      if (institution?.id) {
        invalidateCache(`exchangePrograms_${institution.id}`)
      }

      toast({
        title: "Status updated",
        description: `${programName} status changed to ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update program status",
        variant: "destructive",
      })
    }
  }

  // Handle delete
  const handleDelete = async (programId: string, programName: string) => {
    if (!confirm(`Are you sure you want to delete "${programName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from("elective_exchange")
        .delete()
        .eq("id", programId)
        .eq("institution_id", institution?.id)

      if (error) throw error

      // Update local state
      setExchangePrograms((prev) => prev.filter((program) => program.id !== programId))

      // Invalidate cache
      if (institution?.id) {
        invalidateCache(`exchangePrograms_${institution.id}`)
      }

      toast({
        title: "Program deleted",
        description: `${programName} has been deleted`,
      })
    } catch (error) {
      console.error("Error deleting program:", error)
      toast({
        title: "Error",
        description: "Failed to delete program",
        variant: "destructive",
      })
    }
  }

  // Filter programs based on search term and active tab
  const filteredPrograms = exchangePrograms.filter((program) => {
    const matchesSearch =
      !searchTerm ||
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.name_ru && program.name_ru.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "draft" && program.status === "draft") ||
      (activeTab === "published" && program.status === "published") ||
      (activeTab === "closed" && program.status === "closed") ||
      (activeTab === "archived" && program.status === "archived")

    return matchesSearch && matchesTab
  })

  // Get program counts for tabs
  const programCounts = {
    all: exchangePrograms.length,
    draft: exchangePrograms.filter((p) => p.status === "draft").length,
    published: exchangePrograms.filter((p) => p.status === "published").length,
    closed: exchangePrograms.filter((p) => p.status === "closed").length,
    archived: exchangePrograms.filter((p) => p.status === "archived").length,
  }

  const getLocalizedName = (program: ExchangeProgram) => {
    if (language === "ru" && program.name_ru) {
      return program.name_ru
    }
    return program.name
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Programs</h1>
          <p className="text-muted-foreground">Manage student exchange programs and university partnerships</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search programs..."
                  className="pl-8 md:w-[200px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button asChild>
                <Link href="/manager/electives/exchange-builder">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Exchange Program
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({programCounts.all})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({programCounts.draft})</TabsTrigger>
                <TabsTrigger value="published">Published ({programCounts.published})</TabsTrigger>
                <TabsTrigger value="closed">Closed ({programCounts.closed})</TabsTrigger>
                <TabsTrigger value="archived">Archived ({programCounts.archived})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredPrograms.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm ? "No programs found" : "No exchange programs yet"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first exchange program to get started"}
                    </p>
                    {!searchTerm && (
                      <Button asChild>
                        <Link href="/manager/electives/exchange-builder">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Exchange Program
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">Program Name</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Deadline</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Universities</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Max Selections</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Created</th>
                          <th className="py-3 px-4 text-center text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrograms.map((program) => (
                          <tr key={program.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 text-sm">
                              <Link
                                href={`/manager/electives/exchange/${program.id}`}
                                className="font-medium hover:underline"
                              >
                                {getLocalizedName(program)}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-sm">{getStatusBadge(program.status)}</td>
                            <td className="py-3 px-4 text-sm">{formatDate(program.deadline)}</td>
                            <td className="py-3 px-4 text-sm">{program.universities?.length || 0}</td>
                            <td className="py-3 px-4 text-sm">{program.max_selections}</td>
                            <td className="py-3 px-4 text-sm">{formatDate(program.created_at)}</td>
                            <td className="py-3 px-4 text-sm text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manager/electives/exchange/${program.id}`}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={`/manager/electives/exchange/${program.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                  {program.status === "published" && (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        handleStatusChange(program.id, "closed", getLocalizedName(program))
                                      }
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Close Program
                                    </DropdownMenuItem>
                                  )}
                                  {program.status === "closed" && (
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() =>
                                        handleStatusChange(program.id, "published", getLocalizedName(program))
                                      }
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Reopen Program
                                    </DropdownMenuItem>
                                  )}
                                  {(program.status === "draft" || program.status === "closed") && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(program.id, "archived", getLocalizedName(program))
                                      }
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleDelete(program.id, getLocalizedName(program))}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
