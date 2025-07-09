"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit, Eye, MoreVertical, Plus, Search } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface ExchangeProgram {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  deadline: string
  max_selections: number
  status: string
  universities: string[]
  created_at: string
  updated_at: string
  institution_id: string
}

export default function ExchangeProgramsPage() {
  const [exchangePrograms, setExchangePrograms] = useState<ExchangeProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadExchangePrograms()
  }, [institution?.id])

  const loadExchangePrograms = async () => {
    if (!institution?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("institution_id", institution.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching exchange programs:", error)
        toast({
          title: "Error",
          description: "Failed to load exchange programs",
          variant: "destructive",
        })
        return
      }

      setExchangePrograms(data || [])
    } catch (error) {
      console.error("Error loading exchange programs:", error)
      toast({
        title: "Error",
        description: "Failed to load exchange programs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (programId: string, newStatus: string, programName: string) => {
    try {
      const { error } = await supabase.from("elective_exchange").update({ status: newStatus }).eq("id", programId)

      if (error) {
        console.error("Error updating program status:", error)
        toast({
          title: "Error",
          description: "Failed to update program status",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setExchangePrograms((prev) =>
        prev.map((program) => (program.id === programId ? { ...program, status: newStatus } : program)),
      )

      toast({
        title: "Success",
        description: `Program "${programName}" ${newStatus === "closed" ? "closed" : "reopened"} successfully`,
      })
    } catch (error) {
      console.error("Error updating program status:", error)
      toast({
        title: "Error",
        description: "Failed to update program status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (programId: string, programName: string) => {
    if (!confirm(`Are you sure you want to delete "${programName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase.from("elective_exchange").delete().eq("id", programId)

      if (error) {
        console.error("Error deleting program:", error)
        toast({
          title: "Error",
          description: "Failed to delete program",
          variant: "destructive",
        })
        return
      }

      // Update local state
      setExchangePrograms((prev) => prev.filter((program) => program.id !== programId))

      toast({
        title: "Success",
        description: `Program "${programName}" deleted successfully`,
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
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.name_ru && program.name_ru.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (program.description_ru && program.description_ru.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab = activeTab === "all" || program.status === activeTab

    return matchesSearch && matchesTab
  })

  // Get counts for each status
  const statusCounts = {
    all: exchangePrograms.length,
    draft: exchangePrograms.filter((p) => p.status === "draft").length,
    published: exchangePrograms.filter((p) => p.status === "published").length,
    closed: exchangePrograms.filter((p) => p.status === "closed").length,
    archived: exchangePrograms.filter((p) => p.status === "archived").length,
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Programs</h1>
          <p className="text-muted-foreground">Manage student exchange programs and university partnerships</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search programs..."
                className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/manager/electives/exchange/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Exchange Program
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all" className="relative">
                  All
                  {statusCounts.all > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.all}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="draft" className="relative">
                  Draft
                  {statusCounts.draft > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.draft}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="published" className="relative">
                  Published
                  {statusCounts.published > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.published}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="closed" className="relative">
                  Closed
                  {statusCounts.closed > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.closed}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="archived" className="relative">
                  Archived
                  {statusCounts.archived > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                      {statusCounts.archived}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredPrograms.length === 0 ? (
                  <div className="text-center py-8">
                    {searchTerm ? (
                      <div>
                        <p className="text-muted-foreground mb-4">No programs found matching your search</p>
                        <Button variant="outline" onClick={() => setSearchTerm("")}>
                          Clear search
                        </Button>
                      </div>
                    ) : exchangePrograms.length === 0 ? (
                      <div>
                        <p className="text-muted-foreground mb-4">No exchange programs yet</p>
                        <Button asChild>
                          <Link href="/manager/electives/exchange/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create your first exchange program
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No programs in this category</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">Program Name</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Deadline</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Universities</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Status</th>
                          <th className="py-3 px-4 text-left text-sm font-medium">Created</th>
                          <th className="py-3 px-4 text-center text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPrograms.map((program) => (
                          <tr key={program.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">
                                  {language === "ru" && program.name_ru ? program.name_ru : program.name}
                                </div>
                                {program.description && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {language === "ru" && program.description_ru
                                      ? program.description_ru
                                      : program.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">{formatDate(program.deadline)}</td>
                            <td className="py-3 px-4 text-sm">
                              {program.universities ? program.universities.length : 0}
                            </td>
                            <td className="py-3 px-4 text-sm">{getStatusBadge(program.status)}</td>
                            <td className="py-3 px-4 text-sm">{formatDate(program.created_at)}</td>
                            <td className="py-3 px-4 text-center">
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
                                      View
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
                                      onClick={() =>
                                        handleStatusChange(
                                          program.id,
                                          "closed",
                                          language === "ru" && program.name_ru ? program.name_ru : program.name,
                                        )
                                      }
                                    >
                                      Close
                                    </DropdownMenuItem>
                                  )}
                                  {program.status === "closed" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(
                                          program.id,
                                          "published",
                                          language === "ru" && program.name_ru ? program.name_ru : program.name,
                                        )
                                      }
                                    >
                                      Reopen
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      handleDelete(
                                        program.id,
                                        language === "ru" && program.name_ru ? program.name_ru : program.name,
                                      )
                                    }
                                  >
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

      <Toaster />
    </DashboardLayout>
  )
}
