"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@supabase/supabase-js"
import { SubscriptionPlan } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"

export default function EditTenantPage({ params }) {
  const router = useRouter()
  const { id } = params
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    customDomain: "",
    plan: SubscriptionPlan.STANDARD,
    maxUsers: 50,
    maxPrograms: 20,
    isActive: true,
    subscriptionEndDate: "",
  })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  useEffect(() => {
    async function loadTenant() {
      try {
        const { data, error } = await supabase.from("tenants").select("*").eq("id", id).single()

        if (error) throw error

        setFormData({
          name: data.name,
          subdomain: data.subdomain,
          customDomain: data.custom_domain || "",
          plan: data.plan,
          maxUsers: data.max_users,
          maxPrograms: data.max_programs,
          isActive: data.is_active,
          subscriptionEndDate: data.subscription_end_date || "",
        })
      } catch (error) {
        console.error("Error loading tenant:", error)
        toast({
          title: "Error loading tenant",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTenant()
  }, [supabase, id, toast])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name, checked) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          name: formData.name,
          subdomain: formData.subdomain,
          custom_domain: formData.customDomain || null,
          plan: formData.plan,
          max_users: formData.maxUsers,
          max_programs: formData.maxPrograms,
          is_active: formData.isActive,
          subscription_end_date: formData.subscriptionEndDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) throw error

      toast({
        title: "Tenant updated successfully",
        description: `${formData.name} has been updated.`,
      })

      router.push(`/super-admin/tenants/${id}`)
    } catch (error) {
      console.error("Error updating tenant:", error)
      toast({
        title: "Error updating tenant",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-10">Loading tenant data...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.push(`/super-admin/tenants/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Tenant</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="limits">Limits</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Edit the tenant's basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Institution Name</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex items-center">
                    <Input
                      id="subdomain"
                      name="subdomain"
                      value={formData.subdomain}
                      onChange={handleChange}
                      required
                      className="rounded-r-none"
                    />
                    <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md">.electivepro.com</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                  <Input
                    id="customDomain"
                    name="customDomain"
                    value={formData.customDomain}
                    onChange={handleChange}
                    placeholder="electives.university.edu"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleSwitchChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage the tenant's subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select value={formData.plan} onValueChange={(value) => handleSelectChange("plan", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SubscriptionPlan.FREE}>Free</SelectItem>
                      <SelectItem value={SubscriptionPlan.STANDARD}>Standard</SelectItem>
                      <SelectItem value={SubscriptionPlan.PROFESSIONAL}>Professional</SelectItem>
                      <SelectItem value={SubscriptionPlan.ENTERPRISE}>Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subscriptionEndDate">Subscription End Date</Label>
                  <Input
                    id="subscriptionEndDate"
                    name="subscriptionEndDate"
                    type="date"
                    value={formData.subscriptionEndDate ? formData.subscriptionEndDate.split("T")[0] : ""}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="limits">
            <Card>
              <CardHeader>
                <CardTitle>Limits</CardTitle>
                <CardDescription>Set the tenant's usage limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Maximum Users</Label>
                  <Input
                    id="maxUsers"
                    name="maxUsers"
                    type="number"
                    value={formData.maxUsers}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPrograms">Maximum Programs</Label>
                  <Input
                    id="maxPrograms"
                    name="maxPrograms"
                    type="number"
                    value={formData.maxPrograms}
                    onChange={handleChange}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.push(`/super-admin/tenants/${id}`)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
