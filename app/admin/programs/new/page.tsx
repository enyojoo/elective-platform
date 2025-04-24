"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLanguage } from "@/lib/language-context"

// Define the Degree type
interface Degree {
  id: string
  name: string
  nameRu: string
  code: string
}

export default function NewProgramPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [degrees, setDegrees] = useState<Degree[]>([])
  const [loading, setLoading] = useState(true)

  const [program, setProgram] = useState({
    name: "",
    nameRu: "",
    code: "",
    description: "",
    descriptionRu: "",
    status: "active",
    degreeId: "",
  })

  // Fetch degrees from the API - only run once on component mount
  useEffect(() => {
    const fetchDegrees = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll simulate it with mock data
        const mockDegrees = [
          {
            id: "1",
            name: "Bachelor's",
            nameRu: "Бакалавриат",
            code: "bachelor",
          },
          {
            id: "2",
            name: "Master's",
            nameRu: "Магистратура",
            code: "master",
          },
        ]

        setDegrees(mockDegrees)

        // Only set the default degree if we haven't set one yet
        if (mockDegrees.length > 0 && !program.degreeId) {
          setProgram((prev) => ({ ...prev, degreeId: mockDegrees[0].id }))
        }

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch degrees:", error)
        setLoading(false)
      }
    }

    fetchDegrees()
  }, []) // Empty dependency array - only run once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProgram({ ...program, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setProgram({ ...program, [name]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!program.name || !program.nameRu || !program.code || !program.degreeId) {
      alert("Please fill in all required fields")
      return
    }

    // Simulate API call to create program
    alert("Program created successfully!")
    router.push("/admin/programs")
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/programs">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("admin.newProgram.title")}</h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.newProgram.programDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      {t("admin.newProgram.nameEn")} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="name" name="name" value={program.name} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">
                      {t("admin.newProgram.code")} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      value={program.code}
                      onChange={handleInputChange}
                      placeholder={t("admin.newProgram.codePlaceholder")}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("admin.newProgram.descriptionEn")}</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={program.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nameRu">
                      {t("admin.newProgram.nameRu")} <span className="text-destructive">*</span>
                    </Label>
                    <Input id="nameRu" name="nameRu" value={program.nameRu} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="degreeId">
                      {t("admin.newProgram.degree")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={program.degreeId}
                      onValueChange={(value) => handleSelectChange("degreeId", value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("admin.newProgram.selectDegree")} />
                      </SelectTrigger>
                      <SelectContent>
                        {degrees.map((degree) => (
                          <SelectItem key={degree.id} value={degree.id}>
                            {degree.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">{t("admin.newProgram.descriptionRu")}</Label>
                    <Textarea
                      id="descriptionRu"
                      name="descriptionRu"
                      rows={4}
                      value={program.descriptionRu}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Label htmlFor="status">{t("admin.newProgram.status")}</Label>
                <Select value={program.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.programs.active")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.programs.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end mt-8 gap-4">
                <Link href="/admin/programs">
                  <Button variant="outline">{t("admin.newProgram.cancel")}</Button>
                </Link>
                <Button type="submit">{t("admin.newProgram.create")}</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
