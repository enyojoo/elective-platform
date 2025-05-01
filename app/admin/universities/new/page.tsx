"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

// Mock countries data
const countries = [
  "United States",
  "United Kingdom",
  "Switzerland",
  "Singapore",
  "Japan",
  "France",
  "China",
  "Australia",
  "Germany",
  "Canada",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "South Korea",
]

// University status options
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
]

export default function NewUniversityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()
  const [university, setUniversity] = useState({
    name: "",
    country: "",
    city: "",
    website: "",
    description: "",
    status: "active", // Default status
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setUniversity((prev) => ({ ...prev, [name]: value }))
  }

  const handleCountryChange = (value: string) => {
    setUniversity((prev) => ({ ...prev, country: value }))
  }

  const handleStatusChange = (value: string) => {
    setUniversity((prev) => ({ ...prev, status: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to universities page after successful submission
      router.push("/admin/universities")
    } catch (error) {
      console.error("Error creating university:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/universities">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.newUniversity.title", "Add New University")}</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("admin.newUniversity.name", "University Name")}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Harvard University"
                  value={university.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">{t("admin.newUniversity.country", "Country")}</Label>
                  <Select value={university.country} onValueChange={handleCountryChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.newUniversity.selectCountry", "Select country")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("admin.newUniversity.city", "City")}</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Cambridge"
                    value={university.city}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="website">{t("admin.newUniversity.website", "Website")}</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://www.harvard.edu"
                    value={university.website}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{t("admin.newUniversity.status", "Status")}</Label>
                  <Select value={university.status} onValueChange={handleStatusChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.newUniversity.selectStatus", "Select status")} />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`admin.universities.${option.value}`, option.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("admin.newUniversity.description", "Description")}</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t(
                    "admin.newUniversity.descriptionPlaceholder",
                    "Brief description of the university and partnership details...",
                  )}
                  value={university.description}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/universities")}>
                  {t("admin.newUniversity.cancel", "Cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t("admin.newUniversity.creating", "Creating...")
                    : t("admin.newUniversity.create", "Create University")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
