"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, Users, BookOpen, Calendar, Activity } from "lucide-react"
import Link from "next/link"

export default function InstitutionDetailsPage({ params }) {
  const router = useRouter()
  const { id } = params
  const [institution, setInstitution] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setInstitution({
        id,
        name: "University of Technology",
        domain: "unitech.edu",
        customDomain: "electives.unitech.edu",
        plan: "Enterprise",
        status: "active",
        createdAt: "2023-01-15T00:00:00Z",
        subscriptionEndDate: "2024-01-15T00:00:00Z",
        maxUsers: 2000,
        maxPrograms: 30,
        stats: {
          totalUsers: 1500,
          totalPrograms: 18,
          totalCourses: 124,
          activeElectivePacks: 8,
        },
      })
      setIsLoading(false)
    }, 500)
  }, [id])

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading institution details...</div>
  }

  if (!institution) {
    return <div className="flex items-center justify-center h-64">Institution not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/super-admin/institutions")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{institution.name}</h1>
          <p className="text-muted-foreground">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                institution.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {institution.status === "active" ? "Active" : "Pending"}
            </span>
            <span className="mx-2">•</span>
            <span>{institution.plan} Plan</span>
          </p>
        </div>
        <div className="ml-auto">
          <Link href={`/super-admin/institutions/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Institution
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{institution.stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-purple-100">
                <BookOpen className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Programs</p>
                <p className="text-2xl font-bold">{institution.stats.totalPrograms}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-amber-100">
                <Calendar className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Courses</p>
                <p className="text-2xl font-bold">{institution.stats.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-green-100">
                <Activity className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Elective Packs</p>
                <p className="text-2xl font-bold">{institution.stats.activeElectivePacks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="usage">Usage & Limits</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Institution Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{institution.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Domain</p>
                      <p className="font-medium">{institution.domain}</p>
                    </div>
                    {institution.customDomain && (
                      <div>
                        <p className="text-sm text-muted-foreground">Custom Domain</p>
                        <p className="font-medium">{institution.customDomain}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Subscription Information</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="font-medium">{institution.plan}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created On</p>
                      <p className="font-medium">{new Date(institution.createdAt).toLocaleDateString()}</p>
                    </div>
                    {institution.subscriptionEndDate && (
                      <div>
                        <p className="text-sm text-muted-foreground">Subscription Ends</p>
                        <p className="font-medium">{new Date(institution.subscriptionEndDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      User data will be loaded here from the database
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Users</span>
                    <span className="text-sm text-muted-foreground">
                      {institution.stats.totalUsers} / {institution.maxUsers}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(institution.stats.totalUsers / institution.maxUsers) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Programs</span>
                    <span className="text-sm text-muted-foreground">
                      {institution.stats.totalPrograms} / {institution.maxPrograms}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(institution.stats.totalPrograms / institution.maxPrograms) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Activity logs will be loaded here from the database
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
