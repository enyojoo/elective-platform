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
      id: "1",
      name: "University of Technology",
      domain: "unitech.edu",
      plan: "Enterprise",
      students: 1500,
      programs: 18,
      status: "active",
    },
    {
      id: "2",
      name: "City College",
      domain: "citycollege.edu",
      plan: "Professional",
      students: 950,
      programs: 12,
      status: "active",
    },
    {
      id: "3",
      name: "Global University",
      domain: "globaluni.edu",
      plan: "Standard",
      students: 750,
      programs: 8,
      status: "pending",
    },
    {
      id: "4",
      name: "Technical Institute",
      domain: "techinst.edu",
      plan: "Professional",
      students: 600,
      programs: 7,
      status: "active",
    },
    {
      id: "5",
      name: "Arts Academy",
      domain: "artsacad.edu",
      plan: "Standard",
      students: 420,
      programs: 5,
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
            <div className="grid grid-cols-7 border-b bg-muted/50 px-4 py-3 text-sm font-medium">
              <div>Name</div>
              <div>Domain</div>
              <div>Plan</div>
              <div className="text-center">Students</div>
              <div className="text-center">Programs</div>
              <div className="text-center">Status</div>
              <div className="text-right">Actions</div>
            </div>
            <div className="divide-y">
              {institutions.map((institution) => (
                <div key={institution.id} className="grid grid-cols-7 items-center px-4 py-3">
                  <div className="font-medium">{institution.name}</div>
                  <div className="text-sm">{institution.domain}</div>
                  <div>
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
                  <div className="text-center">{institution.students}</div>
                  <div className="text-center">{institution.programs}</div>
                  <div className="text-center">
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
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/institutions/${institution.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/institutions/${institution.id}/edit`}>Edit</Link>
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
