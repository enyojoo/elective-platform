"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, ElectivePackStatus } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, Calendar, Check, ChevronRight, Info, Plus, Search } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function ExchangeBuilderPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])

  // Form state
  const [packDetails, setPackDetails] = useState({
    semester: "",
    year: new Date().getFullYear(),
    maxSelections: 2,
    startDate: "",
    endDate: "",
    status: ElectivePackStatus.DRAFT,
  })

  // Mock available universities data
  const availableUniversities = [
    {
      id: "1",
      name: "University of Amsterdam",
      description: "A leading research university in the Netherlands with a strong international focus.",
      country: "Netherlands",
      city: "Amsterdam",
      maxStudents: 3,
      language: "English",
      programs: ["Management", "International Management"],
    },
    {
      id: "2",
      name: "HEC Paris",
      description: "One of Europe's leading business schools with a focus on management education and research.",
      country: "France",
      city: "Paris",
      maxStudents: 2,
      language: "English, French",
      programs: ["Management", "International Management"],
    },
    {
      id: "3",
      name: "Bocconi University",
      description:
        "A private university in Milan, Italy, specializing in economics, management, and related disciplines.",
      country: "Italy",
      city: "Milan",
      maxStudents: 4,
      language: "English, Italian",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "4",
      name: "Copenhagen Business School",
      description: "A Danish public university specializing in business and economics education.",
      country: "Denmark",
      city: "Copenhagen",
      maxStudents: 3,
      language: "English",
      programs: ["Management", "International Management", "Public Administration"],
    },
    {
      id: "5",
      name: "Vienna University of Economics and Business",
      description: "The largest university focusing on business and economics in Europe.",
      country: "Austria",
      city: "Vienna",
      maxStudents: 2,
      language: "English, German",
      programs: ["International Management"],
    },
    {
      id: "6",
      name: "Stockholm School of Economics",
      description: "A private business school in Stockholm, Sweden with a strong international presence.",
      country: "Sweden",
      city: "Stockholm",
      maxStudents: 3,
      language: "English",
      programs: ["Management", "International Management"],
    },
    {
      id: "7",
      name: "ESADE Business School",
      description: "A private educational institution in Barcelona, Spain with a focus on law and business.",
      country: "Spain",
      city: "Barcelona",
      maxStudents: 2,
      language: "English, Spanish",
      programs: ["Management", "International Management"],
    },
    {
      id: "8",
      name: "University of St. Gallen",
      description: "A research university in St. Gallen, Switzerland specializing in business administration.",
      country: "Switzerland",
      city: "St. Gallen",
      maxStudents: 3,
      language: "English, German",
      programs: ["Management", "International Management"],
    },
  ]

  // Filter universities based on search query
  const filteredUniversities = availableUniversities.filter(
    (university) =>
      university.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      university.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      university.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      university.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Toggle university selection
  const toggleUniversitySelection = (universityId: string) => {
    if (selectedUniversities.includes(universityId)) {
      setSelectedUniversities(selectedUniversities.filter((id) => id !== universityId))
    } else {
      setSelectedUniversities([...selectedUniversities, universityId])
    }
  }

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPackDetails({
      ...packDetails,
      [name]: value,
    })
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setPackDetails({
      ...packDetails,
      [name]: value,
    })
  }

  // Updated steps for the 3-step wizard
  const steps = [
    { title: "Basic Information", description: "Set semester, year and selection rules" },
    { title: "Add Universities", description: "Add universities to the exchange program" },
    { title: "Review & Publish", description: "Review and publish the exchange program" },
  ]

  // Add a computed pack name function
  const getPackName = () => {
    if (!packDetails.semester || !packDetails.year) return ""
    return `${packDetails.semester.charAt(0).toUpperCase() + packDetails.semester.slice(1)} ${packDetails.year}`
  }

  // Handle next step
  const handleNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  // Handle save as draft
  const handleSaveAsDraft = () => {
    // Here you would typically save to your backend
    const packName = getPackName()
    console.log("Saving as draft:", {
      name: packName,
      ...packDetails,
      universities: selectedUniversities,
    })
    router.push("/manage/electives")
  }

  // Handle publish
  const handlePublish = () => {
    // Here you would typically save and publish to your backend
    const packName = getPackName()
    console.log("Publishing:", {
      name: packName,
      ...packDetails,
      universities: selectedUniversities,
      status: ElectivePackStatus.PUBLISHED,
    })
    router.push("/manage/electives")
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/manage/electives">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Create Exchange Program</h1>
              <p className="text-muted-foreground">Build a new exchange program for students to select from</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Draft</Badge>
          </div>
        </div>

        {/* Stepper */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index === activeStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < activeStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground text-muted-foreground"
                }`}
              >
                {index < activeStep ? <Check className="h-5 w-5" /> : <span>{index + 1}</span>}
              </div>
              <div className="ml-4 mr-8">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              {index < steps.length - 1 && <ChevronRight className="h-5 w-5 text-muted-foreground mr-8" />}
            </div>
          ))}
        </div>

        {/* Mobile Stepper */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">
              Step {activeStep + 1} of {steps.length}
            </p>
            <p className="text-sm font-medium">{steps[activeStep].title}</p>
          </div>
          <div className="w-full bg-muted h-2 rounded-full mb-6">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[activeStep].title}</CardTitle>
            <CardDescription>{steps[activeStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Information & Selection Rules (Combined) */}
            {activeStep === 0 && (
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Program Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={packDetails.semester}
                        onValueChange={(value) => handleSelectChange("semester", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fall">Fall</SelectItem>
                          <SelectItem value="spring">Spring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        name="year"
                        type="number"
                        placeholder="e.g. 2025"
                        value={packDetails.year}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {packDetails.semester && packDetails.year && (
                    <div className="p-4 bg-muted rounded-md mt-4">
                      <div className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Program Name Preview</p>
                          <p className="text-lg font-semibold">{getPackName()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selection Rules Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Selection Rules</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxSelections">Maximum Selections</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="maxSelections"
                          name="maxSelections"
                          type="number"
                          min={1}
                          placeholder="e.g. 2"
                          value={packDetails.maxSelections}
                          onChange={handleInputChange}
                        />
                        <span className="text-sm text-muted-foreground">universities per student</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Selection Start Date</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={packDetails.startDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Selection End Date</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          value={packDetails.endDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">Important Note</p>
                          <p className="text-sm text-amber-700">
                            Students will only be able to select universities during the specified date range. Make sure
                            to communicate these dates to students in advance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Add Universities */}
            {activeStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="relative w-full md:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search universities..."
                      className="pl-8 w-full md:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedUniversities.length} universities selected
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add New University
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Add New University</DialogTitle>
                          <DialogDescription>
                            Create a new university that will be available for this exchange program.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="universityName" className="text-right text-sm font-medium">
                              University Name
                            </Label>
                            <Input id="universityName" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="universityDescription" className="text-right text-sm font-medium">
                              Description
                            </Label>
                            <Textarea id="universityDescription" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="universityCountry" className="text-right text-sm font-medium">
                              Country
                            </Label>
                            <Input id="universityCountry" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="universityCity" className="text-right text-sm font-medium">
                              City
                            </Label>
                            <Input id="universityCity" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="universityMaxStudents" className="text-right text-sm font-medium">
                              Max Students
                            </Label>
                            <Input id="universityMaxStudents" type="number" min="1" className="col-span-3" />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="universityLanguage" className="text-right text-sm font-medium">
                              Language
                            </Label>
                            <Input id="universityLanguage" className="col-span-3" placeholder="e.g. English, French" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Add University</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-[50px] py-3 px-4 text-left text-sm font-medium"></th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Country</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">City</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Max Students</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">Language</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUniversities.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground">
                            No universities found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredUniversities.map((university) => (
                          <tr
                            key={university.id}
                            className={`border-b hover:bg-muted/50 cursor-pointer ${
                              selectedUniversities.includes(university.id) ? "bg-primary/10" : ""
                            }`}
                            onClick={() => toggleUniversitySelection(university.id)}
                          >
                            <td className="py-3 px-4 text-sm">
                              <Checkbox
                                checked={selectedUniversities.includes(university.id)}
                                onCheckedChange={() => toggleUniversitySelection(university.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td className="py-3 px-4 text-sm">{university.name}</td>
                            <td className="py-3 px-4 text-sm">{university.country}</td>
                            <td className="py-3 px-4 text-sm">{university.city}</td>
                            <td className="py-3 px-4 text-sm">{university.maxStudents}</td>
                            <td className="py-3 px-4 text-sm">{university.language}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 3: Review & Publish */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Program Details</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium">Name:</dt>
                        <dd>{getPackName() || "Not specified"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Max Selections:</dt>
                        <dd>{packDetails.maxSelections} universities</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Selection Period:</dt>
                        <dd>
                          {packDetails.startDate && packDetails.endDate
                            ? `${new Date(packDetails.startDate).toLocaleDateString()} - ${new Date(packDetails.endDate).toLocaleDateString()}`
                            : "Not specified"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Universities:</dt>
                        <dd>{selectedUniversities.length}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Selected Universities</h3>
                  {selectedUniversities.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">No Universities Selected</h3>
                      <p className="mt-2 text-muted-foreground">
                        Go back to add universities to this exchange program.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left text-sm font-medium">Name</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Country</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">City</th>
                            <th className="py-3 px-4 text-left text-sm font-medium">Max Students</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableUniversities
                            .filter((university) => selectedUniversities.includes(university.id))
                            .map((university) => (
                              <tr key={university.id} className="border-b">
                                <td className="py-3 px-4 text-sm">{university.name}</td>
                                <td className="py-3 px-4 text-sm">{university.country}</td>
                                <td className="py-3 px-4 text-sm">{university.city}</td>
                                <td className="py-3 px-4 text-sm">{university.maxStudents}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Validation warnings */}
                {(!packDetails.semester ||
                  !packDetails.year ||
                  !packDetails.startDate ||
                  !packDetails.endDate ||
                  selectedUniversities.length === 0) && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Missing Information</p>
                        <ul className="text-sm text-amber-700 list-disc list-inside">
                          {!packDetails.semester && <li>Semester is required</li>}
                          {!packDetails.year && <li>Year is required</li>}
                          {!packDetails.startDate && <li>Start date is required</li>}
                          {!packDetails.endDate && <li>End date is required</li>}
                          {selectedUniversities.length === 0 && <li>At least one university must be selected</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {activeStep > 0 && (
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveAsDraft}>
                Save as Draft
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button onClick={handleNextStep}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handlePublish}
                  disabled={
                    !packDetails.semester ||
                    !packDetails.year ||
                    !packDetails.startDate ||
                    !packDetails.endDate ||
                    selectedUniversities.length === 0
                  }
                >
                  Publish Program
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
