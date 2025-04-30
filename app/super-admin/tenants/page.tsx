"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"

// Dummy tenant data
const dummyTenants = [
  {
    id: "1",
    name: "University of Technology",
    subdomain: "unitech",
    created_at: "2023-01-15T00:00:00Z",
    subscription_end_date: "2024-01-15T00:00:00Z",
    is_active: true,
  },
  {
    id: "2",
    name: "City College",
    subdomain: "citycollege",
    created_at: "2023-02-20T00:00:00Z",
    subscription_end_date: "2024-02-20T00:00:00Z",
    is_active: true,
  },
  {
    id: "3",
    name: "Global University",
    subdomain: "globaluni",
    created_at: "2023-03-10T00:00:00Z",
    subscription_end_date: "2024-03-10T00:00:00Z",
    is_active: false,
  },
  {
    id: "4",
    name: "Technical Institute",
    subdomain: "techinst",
    created_at: "2023-04-05T00:00:00Z",
    subscription_end_date: null,
    is_active: true,
  },
  {
    id: "5",
    name: "Arts Academy",
    subdomain: "artsacad",
    created_at: "2023-05-12T00:00:00Z",
    subscription_end_date: "2024-05-12T00:00:00Z",
    is_active: true,
  },
]

export default function TenantsPage() {
  const [tenants, setTenants] = useState(dummyTenants)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTenants = tenants.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const toggleTenantStatus = (id: string, currentStatus: boolean) => {
    setTenants(tenants.map((tenant) => (tenant.id === id ? { ...tenant, is_active: !currentStatus } : tenant)))
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <Link href="/super-admin/tenants/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Tenant
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tenants..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subdomain</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Subscription End</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No tenants found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell className="font-medium">{tenant.name}</TableCell>
                        <TableCell>{tenant.subdomain}</TableCell>
                        <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {tenant.subscription_end_date
                            ? new Date(tenant.subscription_end_date).toLocaleDateString()
                            : "No end date"}
                        </TableCell>
                        <TableCell>
                          {tenant.is_active ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link href={`/super-admin/tenants/${tenant.id}`}>View Details</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Link href={`/super-admin/tenants/${tenant.id}/edit`}>Edit</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleTenantStatus(tenant.id, tenant.is_active)}>
                                {tenant.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
