"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Download,
  Trash2,
  Archive,
  ArchiveRestore,
  XCircle,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { formatDate } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useInstitution } from "@/lib/institution-context" // Import useInstitution hook

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
}

type StatusFilter = "all" | "draft" | "published" | "closed" | "archived"

export default function ExchangeProgramsPage() {
  const { t, language } = useLanguage()
  const { institution } = useInstitution() // Declare useInstitution hook
  const supabase = getSupabaseBrowserClient()
  const { toast } = useToast()

  const [exchangePrograms, setExchangePrograms] = useState<ExchangeProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<StatusFilter>("all")

  useEffect(() => {
    if (institution?.id) {
      loadExchangePrograms()
    }
  }, [institution?.id])

  const loadExchangePrograms = async () => {
    if (!institution?.id) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("institution_id", institution.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setExchangePrograms(data || [])
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

  // Filter programs based on search and status
  const filteredPrograms = exchangePrograms.filter((program) => {
    const matchesSearch =
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.name_ru && program.name_ru.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = activeTab === "all" || program.status === activeTab

    return matchesSearch && matchesStatus
  })

  // Get status counts
  const getStatusCounts = () => {
    const counts = {
      all: exchangePrograms.length,
      draft: exchangePrograms.filter((p) => p.status === "draft").length,
      published: exchangePrograms.filter((p) => p.status === "published").length,
      closed: exchangePrograms.filter((p) => p.status === "closed").length,
      archived: exchangePrograms.filter((p) => p.status === "archived").length,
    }
    return counts
  }

  const statusCounts = getStatusCounts()

  // Handle status change
  const handleStatusChange = async (programId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("elective_exchange")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", programId)

      if (error) throw error

      // Update local state
      setExchangePrograms((prev) =>
        prev.map((program) =>
          program.id === programId ? { ...program, status: newStatus, updated_at: new Date().toISOString() } : program,
        ),
      )

      toast({
        title: "Status updated",
        description: `Exchange program status changed to ${newStatus}`,
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
  const handleDelete = async (programId: string) => {
    if (!confirm("Are you sure you want to delete this exchange program? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("elective_exchange").delete().eq("id", programId)

      if (error) throw error

      // Update local state
      setExchangePrograms((prev) => prev.filter((program) => program.id !== programId))

      toast({
        title: "Program deleted",
        description: "Exchange program has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting program:", error)
      toast({
        title: "Error",
        description: "Failed to delete exchange program",
        variant: "destructive",
      })
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      published: "default",
      closed: "destructive",
      archived: "outline",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Get action items based on status
  const getActionItems = (program: ExchangeProgram) => {
    const baseActions = [
      {
        icon: Eye,
        label: "View Details",
        href: `/manager/electives/exchange/${program.id}`,
      },
      {
        icon: Edit,
        label: "Edit",
        href: `/manager/electives/exchange/${program.id}/edit`,
      },
      {
        icon: Copy,
        label: "Duplicate",
        action: () => {
          // Handle duplicate logic
          toast({
            title: "Feature coming soon",
            description: "Duplicate functionality will be available soon",
          })
        },
      },
      {
        icon: Download,
        label: "Export Data",
        action: () => {
          // Handle export logic
          toast({
            title: "Feature coming soon",
            description: "Export functionality will be available soon",
          })
        },
      },
    ]

    const statusActions = []

    // Add status-specific actions
    if (program.status === "draft") {
      statusActions.push({
        icon: CheckCircle,
        label: "Publish",
        action: () => handleStatusChange(program.id, "published"),
      })
    } else if (program.status === "published") {
      statusActions.push({
        icon: XCircle,
        label: "Close",
        action: () => handleStatusChange(program.id, "closed"),
      })
    } else if (program.status === "closed") {
      statusActions.push({
        icon: CheckCircle,
        label: "Reopen",
        action: () => handleStatusChange(program.id, "published"),
      })
    }

    // Archive/Unarchive actions
    if (program.status !== "archived") {
      statusActions.push({
        icon: Archive,
        label: "Archive",
        action: () => handleStatusChange(program.id, "archived"),
      })
    } else {
      statusActions.push({
        icon: ArchiveRestore,
        label: "Unarchive",
        action: () => handleStatusChange(program.id, "draft"),
      })
    }

    // Delete action (destructive)
    const deleteAction = {
      icon: Trash2,
      label: "Delete",
      action: () => handleDelete(program.id),
      destructive: true,
    }

    return [...baseActions, ...statusActions, deleteAction]
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
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  placeholder="Search exchange programs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StatusFilter)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                <TabsTrigger value="draft">Draft ({statusCounts.draft})</TabsTrigger>
                <TabsTrigger value="published">Published ({statusCounts.published})</TabsTrigger>
                <TabsTrigger value="closed">Closed ({statusCounts.closed})</TabsTrigger>
                <TabsTrigger value="archived">Archived ({statusCounts.archived})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        {/* Skeleton component should be imported */}
                        <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-[250px] bg-gray-200 animate-pulse"></div>
                          <div className="h-4 w-[200px] bg-gray-200 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredPrograms.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium mb-2">
                      {searchTerm
                        ? "No exchange programs found"
                        : activeTab === "all"
                          ? "No exchange programs yet"
                          : `No ${activeTab} exchange programs`}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm
                        ? "Try adjusting your search terms"
                        : "Create your first exchange program to get started"}
                    </p>
                    {!searchTerm && activeTab === "all" && (
                      <Button asChild>
                        <Link href="/manager/electives/exchange-builder">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Exchange Program
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Program Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Max Selections</TableHead>
                        <TableHead>Universities</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPrograms.map((program) => (
                        <TableRow key={program.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {language === "ru" && program.name_ru ? program.name_ru : program.name}
                              </div>
                              {program.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {language === "ru" && program.description_ru
                                    ? program.description_ru
                                    : program.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(program.status)}</TableCell>
                          <TableCell>{formatDate(program.deadline)}</TableCell>
                          <TableCell>{program.max_selections}</TableCell>
                          <TableCell>{program.universities?.length || 0}</TableCell>
                          <TableCell>{formatDate(program.created_at)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {getActionItems(program).map((item, index) => (
                                  <DropdownMenuItem
                                    key={index}
                                    className={item.destructive ? "text-destructive" : ""}
                                    onClick={item.action}
                                    asChild={!!item.href}
                                  >
                                    {item.href ? (
                                      <Link href={item.href}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                      </Link>
                                    ) : (
                                      <>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
