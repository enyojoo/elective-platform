"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

export default function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [program, setProgram] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const handleSave = () => {
    // Simulate API call to save program
    alert("Program updated successfully!")
    // In a real app, you would make an API call here
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
              <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{program.code}</Badge>
                <Badge variant={program.status === "active" ? "outline" : "secondary"}>{program.status}</Badge>
              </div>
            </div>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="years">Academic Years</TabsTrigger>
            <TabsTrigger value="groups">Student Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Program Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Program Name (English)</Label>
                      <Input id="name" name="name" value={program.name} onChange={handleInputChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Program Code</Label>
                      <Input id="code" name="code" value={program.code} onChange={handleInputChange} />
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
                      <Label htmlFor="nameRu">Program Name (Russian)</Label>
                      <Input id="nameRu" name="nameRu" value={program.nameRu} onChange={handleInputChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="degreeId">Degree</Label>
                      <Select value={program.degreeId} onValueChange={(value) => handleSelectChange("degreeId", value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="years" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Academic Years</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Manage the academic years for which this program is available.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {program.years.map((year: string) => (
                      <Badge key={year} className="text-sm py-1 px-3">
                        {year}
                        <button
                          className="ml-2 text-xs"
                          onClick={() => {
                            setProgram({
                              ...program,
                              years: program.years.filter((y: string) => y !== year),
                            })
                          }}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Add year (e.g., 2025)"
                        className="w-40"
                        id="newYear"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const input = e.currentTarget
                            const year = input.value.trim()
                            if (year && !program.years.includes(year)) {
                              setProgram({
                                ...program,
                                years: [...program.years, year],
                              })
                              input.value = ""
                            }
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById("newYear") as HTMLInputElement
                          const year = input.value.trim()
                          if (year && !program.years.includes(year)) {
                            setProgram({
                              ...program,
                              years: [...program.years, year],
                            })
                            input.value = ""
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Groups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Manage student groups for this program. Groups are organized by academic year.
                  </p>

                  {program.years.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Please add academic years first to manage groups.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {program.years.map((year: string) => (
                        <div key={year} className="space-y-2">
                          <h3 className="text-lg font-medium">Year {year}</h3>
                          <div className="flex flex-wrap gap-2">
                            {/* Mock groups for demonstration */}
                            {year === "2023" ? (
                              <>
                                <Badge className="text-sm py-1 px-3">
                                  {year.substring(2)}.B01-vshm
                                  <button className="ml-2 text-xs">×</button>
                                </Badge>
                                <Badge className="text-sm py-1 px-3">
                                  {year.substring(2)}.B02-vshm
                                  <button className="ml-2 text-xs">×</button>
                                </Badge>
                              </>
                            ) : (
                              <>
                                <Badge className="text-sm py-1 px-3">
                                  {year.substring(2)}.B01-vshm
                                  <button className="ml-2 text-xs">×</button>
                                </Badge>
                              </>
                            )}

                            <div className="flex items-center gap-2">
                              <Input
                                placeholder={`Add group (e.g., ${year.substring(2)}.B03-vshm)`}
                                className="w-64"
                                id={`newGroup-${year}`}
                              />
                              <Button variant="outline" size="sm">
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
