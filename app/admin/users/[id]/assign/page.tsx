"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

export default function ReassignProgramPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id

  const [user, setUser] = useState({
    id: 0,
    name: "",
    email: "",
    role: UserRole.PROGRAM_MANAGER,
    degreeId: 0,
    programId: 0,
    enrollmentYear: new Date().getFullYear(),
  })

  const [newAssignment, setNewAssignment] = useState({
    degreeId: 0,
    programId: 0,
    enrollmentYear: new Date().getFullYear(),
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
  }, [])

  // Simulate fetching user data
  useEffect(() => {
    // In a real app, this would be an API call
    const mockUser = {
      id: Number(userId),
      name: "Elena Smirnova",
      email: "e.smirnova@gsom.spbu.ru",
      role: UserRole.PROGRAM_MANAGER,
      degreeId: 2,
      programId: 3,
      enrollmentYear: 2023,
    }

    setUser(mockUser)
    setNewAssignment({
      degreeId: mockUser.degreeId,
      programId: mockUser.programId,
      enrollmentYear: mockUser.enrollmentYear,
    })
    setIsLoading(false)
  }, [userId])

  // Filter programs based on selected degree
  useEffect(() => {
    if (newAssignment.degreeId) {
      setFilteredPrograms(programs.filter((program) => program.degreeId === newAssignment.degreeId))
    } else {
      setFilteredPrograms([])
    }
  }, [newAssignment.degreeId, programs])

  const handleDegreeChange = (value: string) => {
    const degreeId = Number(value)
    setNewAssignment((prev) => ({
      ...prev,
      degreeId,
      // Reset programId if the current program doesn't belong to the new degree
      programId: programs.some((p) => p.degreeId === degreeId && p.id === prev.programId) ? prev.programId : 0,
    }))
  }

  const handleProgramChange = (value: string) => {
    setNewAssignment((prev) => ({
      ...prev,
      programId: Number(value),
    }))
  }

  const handleEnrollmentYearChange = (value: string) => {
    setNewAssignment((prev) => ({
      ...prev,
      enrollmentYear: Number(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // In a real app, this would be an API call to update the user's program assignment
      console.log("Updating program assignment:", {
        userId: user.id,
        assignment: newAssignment,
      })

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to user details page
      router.push(`/admin/users/${userId}`)
    } catch (error) {
      console.error("Error updating program assignment:", error)
      setIsSaving(false)
    }
  }

  // Get current assignment details
  const currentDegreeName = degrees.find((d) => d.id === user.degreeId)?.name || "Not assigned"
  const currentProgramName = programs.find((p) => p.id === user.programId)?.name || "Not assigned"

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.ADMIN}>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href={`/admin/users/${userId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="h-[300px] flex items-center justify-center">
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
          <Link href={`/admin/users/${userId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Reassign Program Manager</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">Current Assignment</h2>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Degree</Label>
                    <p className="mt-1">{currentDegreeName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Program</Label>
                    <p className="mt-1">{currentProgramName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Enrollment Year</Label>
                    <p className="mt-1">{user.enrollmentYear}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <h2 className="text-lg font-medium">New Assignment</h2>
                <form onSubmit={handleSubmit} className="mt-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="degree">Degree</Label>
                      <Select value={newAssignment.degreeId.toString()} onValueChange={handleDegreeChange} required>
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
                        value={newAssignment.programId.toString()}
                        onValueChange={handleProgramChange}
                        disabled={!newAssignment.degreeId}
                        required
                      >
                        <SelectTrigger id="program">
                          <SelectValue
                            placeholder={newAssignment.degreeId ? "Select program" : "Select a degree first"}
                          />
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
                        value={newAssignment.enrollmentYear.toString()}
                        onValueChange={handleEnrollmentYearChange}
                        required
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

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.push(`/admin/users/${userId}`)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Assignment"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
