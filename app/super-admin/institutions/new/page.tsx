"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createInstitution } from "@/app/actions/super-admin"
import { useToast } from "@/hooks/use-toast"

export default function NewInstitutionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    adminEmail: "",
    adminPassword: "",
    plan: "standard",
    subdomain: "",
    subscriptionStartDate: new Date().toISOString().split("T")[0],
    subscriptionEndDate: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Create a FormData object to pass to the server action
      const formDataObj = new FormData()
      formDataObj.append("name", formData.name)
      formDataObj.append("subdomain", formData.subdomain)
      formDataObj.append("domain", formData.domain)
      formDataObj.append("plan", formData.plan)

      // Call the server action
      const result = await createInstitution(formDataObj)

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Institution created successfully",
        })

        // If we have the institution ID and admin details, we can proceed to create the admin
        if (result.institution && formData.adminEmail && formData.adminPassword) {
          // This would be handled in a second step or automatically
          // For now, we'll just redirect to the institutions page
          router.push("/super-admin/institutions")
        } else {
          router.push("/super-admin/institutions")
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/super-admin/institutions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Institution</h1>
          <p className="text-muted-foreground">Create a new institution on the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Institution Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Institution Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" name="domain" value={formData.domain} onChange={handleChange} />
                  <p className="text-sm text-muted-foreground">
                    Optional: The institution's primary domain (e.g., university.edu)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <Input
                    id="subdomain"
                    name="subdomain"
                    value={formData.subdomain}
                    onChange={handleChange}
                    placeholder="universityname"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used as {formData.subdomain || "subdomain"}.electivepro.net
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Admin Account</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Temporary Password</Label>
                  <Input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    The admin will be prompted to change this password on first login.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Subscription</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select value={formData.plan} onValueChange={(value) => handleSelectChange("plan", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionStartDate">Subscription Start Date</Label>
                  <Input
                    id="subscriptionStartDate"
                    name="subscriptionStartDate"
                    type="date"
                    value={formData.subscriptionStartDate || new Date().toISOString().split("T")[0]}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionEndDate">Subscription End Date</Label>
                  <Input
                    id="subscriptionEndDate"
                    name="subscriptionEndDate"
                    type="date"
                    value={formData.subscriptionEndDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/super-admin/institutions")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Institution"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
