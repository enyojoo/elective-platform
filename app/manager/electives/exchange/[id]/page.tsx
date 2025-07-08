"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Users, Edit, Eye, CheckCircle, XCircle, AlertCircle, Globe, MapPin } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useCachedManagerProfile } from "@/hooks/use-cached-manager-profile"
import { useSession } from "@/lib/session"

interface University {
  id: string
  name: string
  country: string
  city: string
  description: string
  max_students: number
  current_students: number
}

interface ExchangePack {
  id: string
  name: string
  description: string
  universities: University[]
  max_selections: number
  selection_deadline: string
  status: string
  created_at: string
  updated_at: string
}

interface StudentSelection {
  id: string
  student_id: string
  selected_ids: string[]
  status: string
  created_at: string
  updated_at: string
  student: {
    full_name: string
    email: string
    group: {
      name: string
    }
  }
}

export default function ManagerExchangePackDetailPage() {
  const params = useParams()
  const router = useRouter()
  const packId = params.id as string
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { user } = useSession()
  const { profile } = useCachedManagerProfile(user?.id)

  const [pack, setPack] = useState<ExchangePack | null>(null)
  const [selections, setSelections] = useState<StudentSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectionsLoading, setSelectionsLoading] = useState(true)

  useEffect(() => {
    if (packId && profile?.institution_id) {
      fetchPackDetails()
      fetchSelections()
    }
  }, [packId, profile?.institution_id])

  const fetchPackDetails = async () => {
    try {
      setLoading(true)

      // Fetch elective exchange pack details
      const { data: packData, error: packError } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("id", packId)
        .eq("institution_id", profile?.institution_id)
        .single()

      if (packError) throw packError

      if (!packData) {
        toast({
          title: "Error",
          description: "Exchange pack not found",
          variant: "destructive",
        })
        router.push("/manager/electives/exchange")
        return
      }

      // Fetch universities with enrollment counts
      const universitiesWithEnrollment = await Promise.all(
        (packData.universities || []).map(async (university: any) => {
          // Count pending and approved selections for this university
          const { count, error: countError } = await supabase
            .from("exchange_selections")
            .select("*", { count: "exact", head: true })
            .eq("elective_exchange_id", packId)
            .contains("selected_ids", [university.id])
            .in("status", ["pending", "approved"])

          if (countError) {
            console.error("Error counting enrollments:", countError)
            return { ...university, current_students: 0 }
          }

          return {
            ...university,
            current_students: count || 0,
          }
        }),
      )

      setPack({
        ...packData,
        universities: universitiesWithEnrollment,
      })
    } catch (error: any) {
      console.error("Error fetching pack details:", error)
      toast({
        title: "Error",
        description: "Failed to load exchange pack details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSelections = async () => {
    try {
      setSelectionsLoading(true)

      const { data: selectionsData, error: selectionsError } = await supabase
        .from("exchange_selections")
        .select(`
          *,
          student:profiles!exchange_selections_student_id_fkey(
            full_name,
            email,
            group:groups(name)
          )
        `)
        .eq("elective_exchange_id", packId)
        .order("created_at", { ascending: false })

      if (selectionsError) throw selectionsError

      setSelections(selectionsData || [])
    } catch (error: any) {
      console.error("Error fetching selections:", error)
      toast({
        title: "Error",
        description: "Failed to load student selections",
        variant: "destructive",
      })
    } finally {
      setSelectionsLoading(false)
    }
  }

  const updateSelectionStatus = async (selectionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("exchange_selections")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectionId)

      if (error) throw error

      toast({
        title: "Success",
        description: `Selection ${newStatus} successfully`,
      })

      // Refresh data to update counts
      fetchSelections()
      fetchPackDetails()
    } catch (error: any) {
      console.error("Error updating selection status:", error)
      toast({
        title: "Error",
        description: "Failed to update selection status",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="default" className="bg-green-500">
            Approved
          </Badge>
        )
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!pack) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Exchange Pack Not Found</h1>
          <Button onClick={() => router.push("/manager/electives/exchange")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exchange Electives
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/manager/electives/exchange")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Exchange Electives
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/manager/electives/exchange/${pack.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Pack
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{pack.name}</CardTitle>
              <CardDescription className="mt-2">{pack.description}</CardDescription>
            </div>
            <Badge variant={pack.status === "published" ? "default" : "secondary"}>{pack.status}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div>
              <span className="text-muted-foreground">Max Selections:</span>
              <p className="font-medium">{pack.max_selections}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Selection Deadline:</span>
              <p className="font-medium">{new Date(pack.selection_deadline).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-medium">{new Date(pack.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Updated:</span>
              <p className="font-medium">{new Date(pack.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="universities" className="space-y-6">
        <TabsList>
          <TabsTrigger value="universities">Universities ({pack.universities.length})</TabsTrigger>
          <TabsTrigger value="selections">Student Selections ({selections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="universities" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {pack.universities.map((university) => {
              const isFull = university.current_students >= university.max_students
              const utilizationPercentage = (university.current_students / university.max_students) * 100

              return (
                <Card key={university.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{university.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4" />
                        <span className={isFull ? "text-red-500 font-medium" : ""}>
                          {university.current_students}/{university.max_students}
                        </span>
                      </div>
                    </div>
                    <CardDescription>{university.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>
                            <strong>Country:</strong> {university.country}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            <strong>City:</strong> {university.city}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Enrollment</span>
                          <span>{utilizationPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              utilizationPercentage >= 100
                                ? "bg-red-500"
                                : utilizationPercentage >= 80
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <Badge variant={isFull ? "destructive" : "outline"}>{isFull ? "Full" : "Available"}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="selections" className="space-y-4">
          {selectionsLoading ? (
            <div className="text-center py-8">Loading selections...</div>
          ) : selections.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p>No student selections yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Student Selections</CardTitle>
                <CardDescription>Manage and review student exchange selections</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Selected Universities</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selections.map((selection) => (
                      <TableRow key={selection.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{selection.student.full_name}</div>
                            <div className="text-sm text-muted-foreground">{selection.student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{selection.student.group?.name || "N/A"}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {selection.selected_ids.map((universityId) => {
                              const university = pack.universities.find((u) => u.id === universityId)
                              return university ? (
                                <Badge key={universityId} variant="outline" className="mr-1">
                                  {university.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(selection.status)}
                            {getStatusBadge(selection.status)}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(selection.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {selection.status === "pending" && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateSelectionStatus(selection.id, "approved")}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateSelectionStatus(selection.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
