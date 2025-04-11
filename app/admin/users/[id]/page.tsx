"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole, type DegreeType, type ProgramType } from "@/lib/types"

// Mock degrees data
const mockDegrees: DegreeType[] = [
  { id: 1, name: "Bachelor", code: "BSc" },
  { id: 2, name: "Master", code: "MSc" },
  { id: 3, name: "PhD", code: "PhD" },
]

// Mock programs data
const mockPrograms: ProgramType[] = [
  { id: 1, name: "Management", code: "MGT", degreeId: 1 },
  { id: 2, name: "International Business", code: "IB", degreeId: 1 },
  { id: 3, name: "Management", code: "MGT", degreeId: 2 },
  { id: 4, name: "Business Analytics", code: "BA", degreeId: 2 },
  { id: 5, name: "Corporate Finance", code: "CF", degreeId: 2 },
  { id: 6, name: "Management", code: "MGT", degreeId: 3 },
]

export default function UserEditPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id
  const isNewUser = userId === "new"

  const [user, setUser] = useState({
    id: 0,
    name: "",
    email: "",
    role: UserRole.STUDENT,
    degreeId: 0,
    programId: 0,
    enrollmentYear: new Date().getFullYear(),
    status: "active",
  })

  const [degrees, setDegrees] = useState<DegreeType[]>([])
  const [programs, setPrograms] = useState<ProgramType[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Generate enrollment years (from 2021 to current year + 10)
  const currentYear = new Date().getFullYear()
  const enrollmentYears = Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

  // Fetch degrees and programs
  useEffect(() => {
    // In a real app, these would be API calls
    setDegrees(mockDegrees)
    setPrograms(mockPrograms)
    setIsLoading(false)
  }, [])

  // Simulate fetching user data
  useEffect(() => {
    if (isNewUser) {
      setIsLoading(false)
      return
    }

    // In a real app, this would be an API call
    const mockUser = {
      id: Number(userId),
      name: "Anna Petrova",
      email: "a.petrova@student.gsom.spbu.ru",
      role: UserRole.STUDENT,
      degreeId: 2,
      programId: 3,
      enrollmentYear: 2023,
      status: "active",
    }

    setUser(mockUser)
    setIsLoading(false)
  }, [userId, isNewUser])

  // Filter programs based on selected degree
  useEffect(() => {
    if (user.degreeId) {
      setFilteredPrograms(programs.filter((program) => program.degreeId === user.degreeId))
    } else {
      setFilteredPrograms([])
    }
  }, [user.degreeId, programs])

  const handleInputChange = (field: string, value: string | number) => {
    setUser((prev) => ({ ...prev, [field]: value }))
  }

  const handleDegreeChange = (value: string) => {
    const degreeId = Number(value)
    setUser((prev) => ({
      ...prev,
      degreeId,
      // Reset programId if the current program doesn't belong to the new degree
      programId: programs.some((p) => p.degreeId === degreeId && p.id === prev.programId) ? prev.programId : 0,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // In a real app, this would be an API call to save the user
      console.log("Saving user:", user)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to users list
      router.push("/admin/users")
    } catch (error) {
      console.error("Error saving user:", error)
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.ADMIN}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href="/admin/users">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[400px] flex items-center justify-center">
                <p>Loading user data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNewUser ? "Create New User" : `Edit User: ${user.name}`}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select value={user.role} onValueChange={(value) => handleInputChange("role", value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                      <SelectItem value={UserRole.PROGRAM_MANAGER}>Program Manager</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={user.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(user.role === UserRole.STUDENT || user.role === UserRole.PROGRAM_MANAGER) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Select value={user.degreeId.toString()} onValueChange={handleDegreeChange}>
                      <SelectTrigger id="degree">
                        <SelectValue placeholder="Select degree" />
                      </SelectTrigger>
                      <SelectContent>
                        {degrees.map((degree) => (
                          <SelectItem key={degree.id} value={degree.id.toString()}>
                            {degree.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Select
                      value={user.programId.toString()}
                      onValueChange={(value) => handleInputChange("programId", Number(value))}
                      disabled={!user.degreeId}
                    >
                      <SelectTrigger id="program">
                        <SelectValue placeholder={user.degreeId ? "Select program" : "Select a degree first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPrograms.map((program) => (
                          <SelectItem key={program.id} value={program.id.toString()}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enrollmentYear">Enrollment Year</Label>
                    <Select
                      value={user.enrollmentYear.toString()}
                      onValueChange={(value) => handleInputChange("enrollmentYear", Number(value))}
                    >
                      <SelectTrigger id="enrollmentYear">
                        <SelectValue placeholder="Select enrollment year" />
                      </SelectTrigger>
                      <SelectContent>
                        {enrollmentYears.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
              Cancel
            </Button>

            <div className="flex gap-2">
              {!isNewUser && (
                <Button variant="destructive" type="button">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              )}

              <Button type="submit" disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : isNewUser ? "Create User" : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
