"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"

export default function InstitutionsPage() {
  const [institutions] = useState([
    {
      subdomain: "unitech",
      name: "University of Technology and Applied Sciences with Extended Name",
      domain: "unitech.edu",
      plan: "Enterprise",
      totalUsers: 1500,
      status: "active",
    },
    {
      subdomain: "citycollege",
      name: "City College",
      domain: "citycollege.edu",
      plan: "Professional",
      totalUsers: 950,
      status: "active",
    },
    {
      subdomain: "globaluni",
      name: "Global University",
      domain: "globaluni.edu",
      plan: "Standard",
      totalUsers: 750,
      status: "pending",
    },
    {
      subdomain: "techinst",
      name: "Technical Institute",
      domain: "techinst.edu",
      plan: "Professional",
      totalUsers: 600,
      status: "active",
    },
    {
      subdomain: "artsacad",
      name: "Arts Academy",
      domain: "artsacad.edu",
      plan: "Standard",
      totalUsers: 420,
      status: "active",
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institutions</h1>
          <p className="text-muted-foreground">Manage all institutions using ElectivePRO</p>
        </div>
        <Button asChild>
          <Link href="/super-admin/institutions/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Institution
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-muted/50 px-4 py-3 text-sm font-medium">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Subdomain</div>
              <div className="col-span-2">Plan</div>
              <div className="col-span-1 text-center">Users</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y">
              {institutions.map((institution) => (
                <div key={institution.subdomain} className="grid grid-cols-12 items-center px-4 py-3">
                  <div className="col-span-4 font-medium truncate pr-4">{institution.name}</div>
                  <div className="col-span-2 text-sm">{institution.subdomain}</div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        institution.plan === "Enterprise"
                          ? "bg-purple-100 text-purple-800"
                          : institution.plan === "Professional"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {institution.plan}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">{institution.totalUsers}</div>
                  <div className="col-span-2 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        institution.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {institution.status === "active" ? "Active" : "Pending"}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/institutions/${institution.subdomain}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/institutions/${institution.subdomain}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/institutions/${institution.subdomain}/subscription`}>
                            Manage Subscription
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {institution.status === "active" ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
