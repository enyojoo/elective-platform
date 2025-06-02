"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, ElectivePackStatus } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, ArrowRight, Calendar, Check, ChevronRight, Info, Search } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { DocumentUpload } from "@/components/document-upload"
import { useToast } from "@/hooks/use-toast"
import { useCachedManagerProfile } from "@/hooks/use-cached-manager-profile"
import { useInstitution } from "@/lib/institution-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"

interface ExchangeEditPageProps {
  params: {
    id: string
  }
}

export default function ExchangeEditPage({ params }: ExchangeEditPageProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [activeStep, setActiveStep] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [documents, setDocuments] = useState<Array<{ name: string; url: string; path: string }>>([])

  const { institution, isLoading: institutionLoading } = useInstitution()
  const { profile, loading: profileLoading } = useCachedManagerProfile()
  const [componentState, setComponentState] = useState<"loading" | "ready" | "redirecting">("loading")

  useEffect(() => {
    if (institutionLoading || profileLoading) {
      setComponentState("loading")
      return
    }
    if (!institution) {
      setComponentState("redirecting")
      return
    }
    if (!profile) {
      setComponentState("redirecting")
      return
    }
    setComponentState("ready")
  }, [institution, institutionLoading, profile, profileLoading])

  // Helper function to get formatted exchange program name
  const getExchangeProgramName = (id: string) => {
    if (id.includes("fall-2023")) return "Fall Semester 2023 Exchange"
    if (id.includes("spring-2023")) return "Spring Semester 2023 Exchange"
    if (id.includes("fall-2024")) return "Fall Semester 2024 Exchange"
    if (id.includes("spring-2024")) return "Spring Semester 2024 Exchange"

    // Extract season and year from ID
    const seasonMatch = id.match(/(spring|fall|winter|summer)/i)
    const yearMatch = id.match(/20\d\d/)

    if (seasonMatch && yearMatch) {
      const season = seasonMatch[0].charAt(0).toUpperCase() + seasonMatch[0].slice(1).toLowerCase()
      return `${season} Semester ${yearMatch[0]} Exchange`
    }

    return "Exchange Program" // Default if no pattern is found
  }

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

  // Load existing exchange program data
  useEffect(() => {
    if (componentState !== "ready") return

    const loadExchangeProgram = () => {
      setIsLoading(true)

      // Simulate API call delay
      setTimeout(() => {
        // Extract season and year from ID for pre-filling the form
        const seasonMatch = params.id.match(/(spring|fall|winter|summer)/i)
        const yearMatch = params.id.match(/20\d\d/)

        const semester = seasonMatch ? seasonMatch[0].toLowerCase() : ""
        const year = yearMatch ? Number.parseInt(yearMatch[0]) : new Date().getFullYear()

        // Pre-populate form with mock data based on the ID
        setPackDetails({
          semester,
          year,
          maxSelections: params.id === "spring-2024" ? 3 : 2,
          startDate: params.id.includes("fall") ? "2023-08-01" : params.id.includes("spring-2024") ? "2024-01-10" : "",
          endDate: params.id.includes("fall") ? "2023-08-15" : params.id.includes("spring-2024") ? "2024-01-25" : "",
          status: ElectivePackStatus.PUBLISHED,
        })

        // Pre-select universities
        if (params.id === "spring-2024") {
          setSelectedUniversities(["1", "2", "3", "4", "5", "6", "7", "8"])
        } else if (params.id.includes("fall-2023")) {
          setSelectedUniversities(["1", "2", "3", "4", "5", "6"])
        } else {
          setSelectedUniversities(["1", "3", "5"])
        }

        setIsLoading(false)
      }, 500)
    }

    loadExchangeProgram()
  }, [componentState, params.id])

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
    { title: t("manager.exchangeBuilder.step1") },
    { title: t("manager.exchangeBuilder.step2") },
    { title: t("manager.exchangeBuilder.step3") },
    { title: t("manager.exchangeBuilder.documents") },
  ]

  // Add a computed pack name function
  const getPackName = () => {
    if (!packDetails.semester || !packDetails.year) return ""
    const semesterName =
      packDetails.semester === "fall" ? t("manager.exchangeBuilder.fall") : t("manager.exchangeBuilder.spring")
    return `${semesterName.charAt(0).toUpperCase() + semesterName.slice(1)} ${packDetails.year}`
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
      id: params.id,
      name: packName,
      ...packDetails,
      universities: selectedUniversities,
    })
    router.push(`/manager/electives/exchange/${params.id}`)
  }

  // Handle update
  const handleUpdate = () => {
    // Here you would typically update in your backend
    const packName = getPackName()
    console.log("Updating:", {
      id: params.id,
      name: packName,
      ...packDetails,
      universities: selectedUniversities,
    })
    router.push(`/manager/electives/exchange/${params.id}`)
  }

  if (componentState !== "ready" || isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href={`/manager/electives/exchange/${params.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("manager.exchangeBuilder.editTitle")}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t(`manager.status.${packDetails.status.toLowerCase()}`)}</Badge>
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
              </div>
              {index < steps.length - 1 && <ChevronRight className="h-5 w-5 text-muted-foreground mr-8" />}
            </div>
          ))}
        </div>

        {/* Mobile Stepper */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium">
              {t("manager.exchangeBuilder.step")} {activeStep + 1} {t("manager.exchangeBuilder.of")} {steps.length}
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
          </CardHeader>
          <CardContent>
            {/* Step 1: Basic Information & Selection Rules (Combined) */}
            {activeStep === 0 && (
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("manager.exchangeBuilder.programInfo")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="semester">{t("manager.exchangeBuilder.semester")}</Label>
                      <Select
                        value={packDetails.semester}
                        onValueChange={(value) => handleSelectChange("semester", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("manager.exchangeBuilder.semester")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fall">{t("manager.exchangeBuilder.fall")}</SelectItem>
                          <SelectItem value="spring">{t("manager.exchangeBuilder.spring")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">{t("manager.exchangeBuilder.year")}</Label>
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
                          <p className="text-sm font-medium">{t("manager.exchangeBuilder.namePreview")}</p>
                          <p className="text-lg font-semibold">{getPackName()}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selection Rules Section */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("manager.exchangeBuilder.selectionRules")}</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxSelections">{t("manager.exchangeBuilder.maxSelections")}</Label>
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
                        <span className="text-sm text-muted-foreground">
                          {t("manager.exchangeBuilder.universitiesPerStudent")}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">{t("manager.exchangeBuilder.startDate")}</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={packDetails.startDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">{t("manager.exchangeBuilder.endDate")}</Label>
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
                          <p className="text-sm font-medium text-amber-800">
                            {t("manager.exchangeBuilder.importantNote")}
                          </p>
                          <p className="text-sm text-amber-700">{t("manager.exchangeBuilder.dateRangeNote")}</p>
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
                      placeholder={t("manager.exchangeBuilder.searchUniversities")}
                      className="pl-8 w-full md:w-[300px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedUniversities.length} {t("manager.exchangeBuilder.universitiesSelected")}
                    </span>
                  </div>
                </div>

                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="w-[50px] py-3 px-4 text-left text-sm font-medium"></th>
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.exchangeBuilder.name")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeBuilder.country")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.exchangeBuilder.city")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeBuilder.maxStudents")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeBuilder.language")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUniversities.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground">
                            {t("manager.exchangeBuilder.noUniversitiesFound")}
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
                    <h3 className="text-lg font-medium mb-2">{t("manager.exchangeBuilder.programDetails")}</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium">{t("manager.exchangeBuilder.name")}:</dt>
                        <dd>{getPackName() || t("manager.exchangeBuilder.notSpecified")}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">{t("manager.exchangeBuilder.maxSelectionsLabel")}</dt>
                        <dd>
                          {packDetails.maxSelections} {t("manager.exchangeDetails.universities")}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">{t("manager.exchangeBuilder.selectionPeriod")}</dt>
                        <dd>
                          {packDetails.startDate && packDetails.endDate
                            ? `${new Date(packDetails.startDate).toLocaleDateString()} - ${new Date(packDetails.endDate).toLocaleDateString()}`
                            : t("manager.exchangeBuilder.notSpecified")}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">{t("manager.exchangeBuilder.universities")}</dt>
                        <dd>{selectedUniversities.length}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">{t("manager.exchangeBuilder.selectedUniversities")}</h3>
                  {selectedUniversities.length === 0 ? (
                    <div className="text-center py-8 border rounded-md">
                      <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 text-lg font-semibold">
                        {t("manager.exchangeBuilder.noUniversitiesSelected")}
                      </h3>
                      <p className="mt-2 text-muted-foreground">{t("manager.exchangeBuilder.goBackToAdd")}</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="py-3 px-4 text-left text-sm font-medium">
                              {t("manager.exchangeBuilder.name")}
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium">
                              {t("manager.exchangeBuilder.country")}
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium">
                              {t("manager.exchangeBuilder.city")}
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium">
                              {t("manager.exchangeBuilder.maxStudents")}
                            </th>
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
                        <p className="text-sm font-medium text-amber-800">{t("manager.exchangeBuilder.missingInfo")}</p>
                        <ul className="text-sm text-amber-700 list-disc list-inside">
                          {!packDetails.semester && <li>{t("manager.exchangeBuilder.semesterRequired")}</li>}
                          {!packDetails.year && <li>{t("manager.exchangeBuilder.yearRequired")}</li>}
                          {!packDetails.startDate && <li>{t("manager.exchangeBuilder.startDateRequired")}</li>}
                          {!packDetails.endDate && <li>{t("manager.exchangeBuilder.endDateRequired")}</li>}
                          {selectedUniversities.length === 0 && (
                            <li>{t("manager.exchangeBuilder.universityRequired")}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Document Management */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("manager.exchangeBuilder.programDocuments")}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t("manager.exchangeBuilder.documentsDescription")}
                  </p>

                  <DocumentUpload
                    bucketName="documents"
                    folderPath={`exchange/${params.id}`}
                    allowedFileTypes={[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"]}
                    maxFileSizeMB={10}
                    onUploadComplete={(file) => {
                      // In a real app, you would save the document to your database
                      // Example: await addExchangeDocument(params.id, file)
                      setDocuments([...documents, file])
                      toast({
                        title: "Document uploaded",
                        description: `${file.name} has been uploaded successfully.`,
                      })
                    }}
                    onDeleteComplete={(path) => {
                      // In a real app, you would remove the document from your database
                      // Example: await removeExchangeDocument(params.id, path)
                      setDocuments(documents.filter((doc) => doc.path !== path))
                      toast({
                        title: "Document deleted",
                        description: "The document has been deleted successfully.",
                      })
                    }}
                    existingFiles={documents}
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div>
              {activeStep > 0 && (
                <Button variant="outline" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("manager.exchangeBuilder.back")}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSaveAsDraft}>
                {t("manager.exchangeBuilder.saveAsDraft")}
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button onClick={handleNextStep}>
                  {t("manager.exchangeBuilder.next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleUpdate}
                  disabled={
                    !packDetails.semester ||
                    !packDetails.year ||
                    !packDetails.startDate ||
                    !packDetails.endDate ||
                    selectedUniversities.length === 0
                  }
                >
                  {t("manager.exchangeBuilder.updateProgram")}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  )
}
