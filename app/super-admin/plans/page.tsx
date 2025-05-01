"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"

export default function PlansPage() {
  const [plans] = useState([
    {
      id: "free",
      name: "Free",
      userLimit: 100,
      price: 0,
      institutionsCount: 12,
      status: "active",
      features: ["Limited features", "Basic support", "Single admin user"],
    },
    {
      id: "standard",
      name: "Standard",
      userLimit: 1000,
      price: 99,
      institutionsCount: 8,
      status: "active",
      features: ["All features", "Priority support", "Multiple admin users"],
    },
    {
      id: "premium",
      name: "Premium",
      userLimit: 2000,
      price: 199,
      institutionsCount: 5,
      status: "active",
      features: ["All features", "Priority support", "Multiple admin users", "Advanced analytics"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      userLimit: 5000,
      price: 499,
      institutionsCount: 3,
      status: "active",
      features: [
        "All features",
        "Dedicated support",
        "Unlimited admin users",
        "Advanced analytics",
        "Custom integrations",
      ],
    },
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans for institutions</p>
        </div>
        <Button asChild>
          <Link href="/super-admin/plans/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Plan
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 border-b bg-muted/50 px-4 py-3 text-sm font-medium">
              <div className="col-span-2">Name</div>
              <div className="col-span-2">User Limit</div>
              <div className="col-span-2">Price ($/month)</div>
              <div className="col-span-2 text-center">Institutions</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y">
              {plans.map((plan) => (
                <div key={plan.id} className="grid grid-cols-12 items-center px-4 py-3">
                  <div className="col-span-2 font-medium">{plan.name}</div>
                  <div className="col-span-2">{plan.userLimit.toLocaleString()} users</div>
                  <div className="col-span-2">
                    {plan.price === 0 ? <span className="text-green-600 font-medium">Free</span> : `$${plan.price}`}
                  </div>
                  <div className="col-span-2 text-center">{plan.institutionsCount}</div>
                  <div className="col-span-2 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        plan.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {plan.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/plans/${plan.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/super-admin/plans/${plan.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>{plan.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
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
