"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, type DegreeType, type ProgramType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"

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

export default function InviteManagerPage() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  const [degrees, setDegrees] = useState<DegreeType[]>([])
  const [programs, setPrograms] = useState<ProgramType[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<ProgramType[]>([])

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    role: UserRole.PROGRAM_MANAGER,
    degreeId: "",
    programId: "",
    enrollmentYear: currentYear.toString(),
    sendInvitation: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch degrees and programs
  useEffect(() => {
    // In a real app, these would be API calls
    setDegrees(mockDegrees)
    setPrograms(mockPrograms)
  }, [])

  // Filter programs based on selected degree
  useEffect(() => {
    if (formData.degreeId) {
      const filtered = programs.filter((program) => program.degreeId === Number(formData.degreeId))
      setFilteredPrograms(filtered)

      // Reset program selection if the current selection is not valid for the new degree
      if (!filtered.some((p) => p.id === Number(formData.programId))) {
        setFormData((prev) => ({
          ...prev,
          programId: "",
        }))
      }
    } else {
      setFilteredPrograms([])
    }
  }, [formData.degreeId, programs, formData.programId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      sendInvitation: checked,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // In a real app, this would be an API call to create the user and send invitation
      console.log("Inviting manager:", formData)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const degree = degrees.find((d) => d.id === Number(formData.degreeId))
      const program = programs.find((p) => p.id === Number(formData.programId))

      toast({
        title: "Invitation sent",
        description: `${formData.name} has been invited to manage ${degree?.name} in ${program?.name} for enrollment year ${formData.enrollmentYear}.`,
      })

      router.push("/admin/users")
    } catch (error) {
      console.error("Error inviting manager:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate enrollment years (from 2021 to current year + 10)
  const enrollmentYears = Array.from({ length: currentYear + 10 - 2021 + 1 }, (_, i) => (2021 + i).toString())

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invite Program Manager</h1>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Program Assignment */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Select
                      value={formData.degreeId}
                      onValueChange={(value) => handleSelectChange("degreeId", value)}
                      required
                    >
                      <SelectTrigger>
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
                      value={formData.programId}
                      onValueChange={(value) => handleSelectChange("programId", value)}
                      disabled={!formData.degreeId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.degreeId ? "Select program" : "Select a degree first"} />
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
                      value={formData.enrollmentYear}
                      onValueChange={(value) => handleSelectChange("enrollmentYear", value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
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
              </div>

              {/* Invitation Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendInvitation"
                    checked={formData.sendInvitation}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="sendInvitation">Send email invitation to the program manager</Label>
                </div>

                {formData.sendInvitation && (
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      An email will be sent to {formData.email || "the manager"} with instructions to set up their
                      account.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.push("/admin/users")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Sending Invitation..."
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Manager
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
