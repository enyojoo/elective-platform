"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Users } from "lucide-react"
import Link from "next/link"

export default function PlanDetailsPage() {
  const params = useParams()
  const planId = params.id as string
  const router = useRouter()
  const [plan, setPlan] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [institutions, setInstitutions] = useState<any[]>([])

  useEffect(() => {
    // Simulate API call to fetch plan details
    setTimeout(() => {
      const planData = {
        id: planId,
        name:
          planId === "free"
            ? "Free"
            : planId === "standard"
              ? "Standard"
              : planId === "premium"
                ? "Premium"
                : "Enterprise",
        userLimit: planId === "free" ? 100 : planId === "standard" ? 1000 : planId === "premium" ? 2000 : 5000,
        price: planId === "free" ? 0 : planId === "standard" ? 99 : planId === "premium" ? 199 : 499,
        description: "This plan provides access to all features with a limit on the number of users.",
        status: "active",
        features: [
          "User management",
          "Program management",
          "Course management",
          "Elective selection",
          planId !== "free" && "Priority support",
          (planId === "premium" || planId === "enterprise") && "Advanced analytics",
          planId === "enterprise" && "Custom integrations",
        ].filter(Boolean),
      }

      // Simulate institutions using this plan
      const institutionsData = Array.from(
        { length: planId === "free" ? 12 : planId === "standard" ? 8 : planId === "premium" ? 5 : 3 },
        (_, i) => ({
          id: `inst-${i + 1}`,
          name: `Institution ${i + 1}`,
          subdomain: `institution${i + 1}`,
          userCount: Math.floor(Math.random() * planData.userLimit),
          status: Math.random() > 0.2 ? "active" : "inactive",
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        }),
      )

      setPlan(planData)
      setInstitutions(institutionsData)
      setIsLoading(false)
    }, 1000)
  }, [planId])

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  if (!plan) {
    return <div>Plan not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{plan.name} Plan</h1>
            <p className="text-muted-foreground">View and manage plan details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/super-admin/plans/${planId}/edit`}>Edit Plan</Link>
          </Button>
          <Button variant={plan.status === "active" ? "destructive" : "default"}>
            {plan.status === "active" ? "Deactivate Plan" : "Activate Plan"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="text-2xl font-bold">{plan.userLimit.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {plan.price === 0 ? <span className="text-green-600">Free</span> : `$${plan.price}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="institutions">Institutions</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{plan.description}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="institutions" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 border-b bg-muted/50 px-4 py-3 text-sm font-medium">
                  <div className="col-span-4">Institution</div>
                  <div className="col-span-2">Subdomain</div>
                  <div className="col-span-2 text-center">Users</div>
                  <div className="col-span-2 text-center">Status</div>
                  <div className="col-span-2 text-center">Created</div>
                </div>
                <div className="divide-y">
                  {institutions.map((institution) => (
                    <div key={institution.id} className="grid grid-cols-12 items-center px-4 py-3">
                      <div className="col-span-4 font-medium truncate">{institution.name}</div>
                      <div className="col-span-2 text-muted-foreground">{institution.subdomain}</div>
                      <div className="col-span-2 text-center">
                        {institution.userCount} of {plan.userLimit}
                      </div>
                      <div className="col-span-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            institution.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {institution.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="col-span-2 text-center text-muted-foreground text-sm">
                        {new Date(institution.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
