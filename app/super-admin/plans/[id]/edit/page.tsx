"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft } from "lucide-react"

export default function EditPlanPage() {
  const params = useParams()
  const planId = params.id as string
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    userLimit: 0,
    price: 0,
    isActive: true,
  })

  useEffect(() => {
    // Simulate API call to fetch plan details
    setTimeout(() => {
      const planData = {
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
        isActive: true,
      }

      setFormData(planData)
      setIsLoading(false)
    }, 1000)
  }, [planId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "userLimit" || name === "price" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isActive: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    // Simulate API call to update plan
    setTimeout(() => {
      setIsSaving(false)
      router.push(`/super-admin/plans/${planId}`)
    }, 1000)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Plan</h1>
          <p className="text-muted-foreground">Update subscription plan details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Plan Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="userLimit">User Limit</Label>
                <Input
                  id="userLimit"
                  name="userLimit"
                  type="number"
                  min="1"
                  value={formData.userLimit}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Monthly Price ($)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
