"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

// Mock program data
const mockPrograms = [
  {
    id: "1",
    name: "Master in Management",
    nameRu: "Магистр менеджмента",
    code: "MiM",
    level: "master",
    description: "A comprehensive program focusing on management principles and practices.",
    descriptionRu: "Комплексная программа, ориентированная на принципы и практики менеджмента.",
    students: 120,
    courses: 18,
    status: "active",
    years: ["2023", "2024"],
    degreeId: "2",
  },
  {
    id: "2",
    name: "Master in Business Analytics",
    nameRu: "Магистр бизнес-аналитики",
    code: "MiBA",
    level: "master",
    description: "Advanced program for data-driven business decision making.",
    descriptionRu: "Продвинутая программа для принятия бизнес-решений на основе данных.",
    students: 45,
    courses: 14,
    status: "active",
    years: ["2023", "2024"],
    degreeId: "2",
  },
]

// Mock degrees data
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

export default function ProgramEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [program, setProgram] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Simulate API call to fetch program details
    const fetchedProgram = mockPrograms.find((p) => p.id === id)

    if (fetchedProgram) {
      setProgram(fetchedProgram)
    } else {
      // If program not found, redirect to programs list
      router.push("/admin/programs")
    }

    setIsLoading(false)
  }, [id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProgram({ ...program, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setProgram({ ...program, [name]: value })
  }

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate API call to save program
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSaving(false)
    router.push("/admin/programs")
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>Loading program details...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (!program) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div>Program not found</div>
          <Link href="/admin/programs">
            <Button>Back to Programs</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
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
              <h1 className="text-3xl font-bold tracking-tight">Edit Program</h1>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave()
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Program Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Program Name (English) <span className="text-destructive">*</span>
                    </Label>
                    <Input id="name" name="name" value={program.name} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">
                      Program Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="code"
                      name="code"
                      value={program.code}
                      onChange={handleInputChange}
                      placeholder="A unique code for the program (e.g., MiM, BBA)"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (English)</Label>
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
                      Program Name (Russian) <span className="text-destructive">*</span>
                    </Label>
                    <Input id="nameRu" name="nameRu" value={program.nameRu} onChange={handleInputChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="degreeId">
                      Degree <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={program.degreeId}
                      onValueChange={(value) => handleSelectChange("degreeId", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a degree" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockDegrees.map((degree) => (
                          <SelectItem key={degree.id} value={degree.id}>
                            {degree.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descriptionRu">Description (Russian)</Label>
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
                <Label htmlFor="status">Status</Label>
                <Select value={program.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end mt-8 gap-4">
                <Link href="/admin/programs">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
