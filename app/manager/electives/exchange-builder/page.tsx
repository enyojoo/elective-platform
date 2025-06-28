"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Check, ChevronRight, FileUp, Search } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { getSemesters, type Semester } from "@/actions/semesters"
import { getYears, type Year } from "@/actions/years"
import { getGroups, type Group } from "@/actions/groups"

interface University {
  id: string
  name: string
  name_ru: string | null
  country: string
  city: string
  city_ru: string | null
  max_students: number
  status: string
}

export default function ExchangeBuilderPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Semesters, years, and groups state
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [years, setYears] = useState<Year[]>([])
  const [groups, setGroups] = useState<Group[]>([])

  // Form state
  const [formData, setFormData] = useState({
    semester: "",
    year: "",
    groupId: "",
    maxSelections: 2,
    endDate: "",
    status: "draft",
    statementTemplateUrl: "",
  })

  // Universities state
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // File upload state
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch semesters, years, and academic years on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching semesters, years, and groups data...")
        const [semestersData, yearsData, groupsData] = await Promise.all([getSemesters(), getYears(), getGroups()])

        console.log("Semesters data:", semestersData)
        console.log("Years data:", yearsData)
        console.log("Groups data:", groupsData)

        setSemesters(semestersData)
        setYears(yearsData)
        setGroups(groupsData)

        // Set default semester if available
        if (semestersData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            semester: semestersData[0].code,
          }))
        }

        // Set default year if available
        if (yearsData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            year: yearsData[0].id,
          }))
        }

        // Set default group if available
        if (groupsData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            groupId: groupsData[0].id,
          }))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: t("manager.exchangeBuilder.error"),
          description: t("manager.exchangeBuilder.errorFetchingData"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, t])

  // Fetch universities when entering step 2
  useEffect(() => {
    if (currentStep === 2 && universities.length === 0 && !isLoadingUniversities) {
      fetchUniversities()
    }
  }, [currentStep, universities.length, isLoadingUniversities])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setIsUploading(true)

    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop()
      const fileName = `statement_templates/${Date.now()}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage.from("documents").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName)

      if (urlData) {
        setFormData((prev) => ({ ...prev, statementTemplateUrl: urlData.publicUrl }))
        toast({
          title: t("manager.exchangeBuilder.uploadSuccess"),
          description: file.name,
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: t("manager.exchangeBuilder.uploadError"),
        description: t("manager.exchangeBuilder.uploadErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Fetch universities
  const fetchUniversities = async () => {
    if (!institution?.id) return

    setIsLoadingUniversities(true)
    try {
      console.log("Fetching universities...")
      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .eq("institution_id", institution.id)
        .eq("status", "active")
        .order("name", { ascending: true })

      if (error) throw error

      console.log("Universities data:", data)
      setUniversities(data || [])
    } catch (error) {
      console.error("Error fetching universities:", error)
      toast({
        title: t("manager.exchangeBuilder.error"),
        description: t("manager.exchangeBuilder.errorFetchingUniversities"),
        variant: "destructive",
      })
    } finally {
      setIsLoadingUniversities(false)
    }
  }

  // Toggle university selection
  const toggleUniversity = (universityId: string) => {
    setSelectedUniversities((prev) =>
      prev.includes(universityId) ? prev.filter((id) => id !== universityId) : [...prev, universityId],
    )
  }

  // Filter universities based on search term
  const filteredUniversities = universities.filter((university) => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    return (
      (university.name && university.name.toLowerCase().includes(term)) ||
      (university.name_ru && university.name_ru.toLowerCase().includes(term)) ||
      (university.city && university.city.toLowerCase().includes(term)) ||
      (university.city_ru && university.city_ru.toLowerCase().includes(term))
    )
  })

  // Get localized name based on current language
  const getLocalizedName = (university: University) => {
    if (language === "ru" && university.name_ru) {
      return university.name_ru
    }
    return university.name
  }

  // Get localized city based on current language
  const getLocalizedCity = (university: University) => {
    if (language === "ru" && university.city_ru) {
      return university.city_ru
    }
    return university.city
  }

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.semester || !formData.year || !formData.endDate || !formData.groupId) {
        toast({
          title: t("manager.exchangeBuilder.missingInfo"),
          description: t("manager.exchangeBuilder.requiredFields"),
          variant: "destructive",
        })
        return
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (selectedUniversities.length === 0) {
        toast({
          title: t("manager.exchangeBuilder.missingInfo"),
          description: t("manager.exchangeBuilder.universityRequired"),
          variant: "destructive",
        })
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
  }

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    await handleSubmit("draft")
  }

  // Handle publish
  const handlePublish = async () => {
    await handleSubmit("published")
  }

  // Generate program name based on semester and year
  const generateProgramName = (lang: string = language) => {
    const selectedSemester = semesters.find((s) => s.code === formData.semester)
    const selectedYear = years.find((y) => y.id === formData.year)

    const semesterName =
      lang === "ru"
        ? selectedSemester?.name_ru || (formData.semester === "fall" ? "Осенний" : "Весенний")
        : selectedSemester?.name || (formData.semester === "fall" ? "Fall" : "Spring")

    const yearValue = selectedYear?.year || ""

    const exchangeText = lang === "ru" ? "Программа обмена" : "Exchange Program"

    return `${semesterName} ${yearValue} ${exchangeText}`
  }

  // Handle form submission
  const handleSubmit = async (status: string) => {
    if (!institution?.id) return
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Generate both English and Russian program names
      const programNameEn = generateProgramName("en")
      const programNameRu = generateProgramName("ru")

      // Get the selected year value for the name
      const selectedYear = years.find((y) => y.id === formData.year)?.year || ""

      // Get details of selected universities
      const selectedUniversityDetails = universities.filter((uni) => selectedUniversities.includes(uni.id))

      // Create a JSON array of university details to store in the elective_exchange table
      const universityIds = selectedUniversities

      // Get current user profile for created_by
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      console.log("Current user:", user)

      // FIXED: Use the current user's ID directly as the profile ID
      // In this system, the profile ID is the same as the user ID
      const profileId = user.id

      console.log("Using profile ID:", profileId)

      // Insert data into the elective_exchange table
      const insertData = {
        institution_id: institution.id,
        name: programNameEn,
        name_ru: programNameRu,
        status: status,
        deadline: formData.endDate,
        max_selections: formData.maxSelections,
        statement_template_url: formData.statementTemplateUrl,
        semester: formData.semester,
        academic_year: formData.year,
        group_id: formData.groupId,
        universities: universityIds, // Store university IDs as an array of UUIDs
        created_by: profileId, // Store the user ID as the creator
      }

      console.log("Creating exchange program with data:", insertData)

      // Insert into elective_exchange table
      const { data: exchangeData, error: exchangeError } = await supabase
        .from("elective_exchange")
        .insert([insertData])
        .select()

      if (exchangeError) {
        console.error("Error creating exchange program:", exchangeError)
        throw exchangeError
      }

      console.log("Created exchange program:", exchangeData)

      toast({
        title:
          status === "draft" ? t("manager.exchangeBuilder.draftSaved") : t("manager.exchangeBuilder.programPublished"),
        description: t("manager.exchangeBuilder.successDesc"),
      })

      // Redirect to exchange programs page
      router.push("/manager/electives/exchange")
    } catch (error) {
      console.error("Error creating exchange program:", error)
      toast({
        title: t("manager.exchangeBuilder.error"),
        description: t("manager.exchangeBuilder.errorCreating"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives/exchange">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("manager.exchangeBuilder.title")}</h1>
              <p className="text-muted-foreground">
                <Badge variant="outline" className="mt-1">
                  {t("manager.exchangeBuilder.draft")}
                </Badge>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className="text-sm font-medium">{t("manager.exchangeBuilder.programInfo")}</p>
              </div>
            </div>

            <div className="mx-2 h-px w-8 bg-muted" />

            <div className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > 2 ? <Check className="h-4 w-4" /> : "2"}
              </div>
              <div className="ml-2 hidden sm:block">
                <p className="text-sm font-medium">{t("manager.exchangeBuilder.addUniversities")}</p>
              </div>
            </div>

            <div className="mx-2 h-px w-8 bg-muted" />

            <div className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <div className="ml-2 hidden sm:block">
                <p className="text-sm font-medium">{t("manager.exchangeBuilder.programDetails")}</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {t("manager.exchangeBuilder.step")} {currentStep} {t("manager.exchangeBuilder.of")}
            {totalSteps}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.exchangeBuilder.programInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="semester">{t("manager.exchangeBuilder.semester")}</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("manager.exchangeBuilder.selectSemester")} />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.length > 0 ? (
                          semesters.map((semester) => (
                            <SelectItem key={semester.id} value={semester.code}>
                              {language === "ru" && semester.name_ru ? semester.name_ru : semester.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="fall">{language === "ru" ? "Осенний" : "Fall"}</SelectItem>
                            <SelectItem value="spring">{language === "ru" ? "Весенний" : "Spring"}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">{t("manager.exchangeBuilder.year")}</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={formData.year} onValueChange={(value) => handleSelectChange("year", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("manager.exchangeBuilder.selectYear")} />
                      </SelectTrigger>
                      <SelectContent>
                        {years.length > 0 ? (
                          years.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.year}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="default">{new Date().getFullYear()}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">{t("manager.exchangeBuilder.group")}</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={formData.groupId} onValueChange={(value) => handleSelectChange("groupId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("manager.exchangeBuilder.selectGroup")} />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.length > 0 ? (
                          groups.map((group) => (
                            <SelectItem key={group.id} value={group.id}>
                              {group.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            {t("manager.exchangeBuilder.noGroupsAvailable")}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("manager.exchangeBuilder.namePreview")}</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">{generateProgramName()}</div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.exchangeBuilder.selectionRules")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxSelections">{t("manager.exchangeBuilder.maxSelections")}</Label>
                    <Input
                      id="maxSelections"
                      name="maxSelections"
                      type="number"
                      min={1}
                      max={10}
                      value={formData.maxSelections}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("manager.exchangeBuilder.universitiesPerStudent")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t("manager.exchangeBuilder.deadline")}</Label>
                    <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.exchangeBuilder.statementUpload")}</h3>
                <p className="text-sm text-muted-foreground">{t("manager.exchangeBuilder.statementDescription")}</p>

                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="statement-file"
                    className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {t("manager.exchangeBuilder.uploadStatementFile")}
                  </Label>
                  <Input
                    id="statement-file"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />

                  {selectedFile && <span className="text-sm">{selectedFile.name}</span>}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={handleNextStep} disabled={isLoading}>
                  {t("manager.exchangeBuilder.next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Add Universities */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.exchangeBuilder.addUniversities")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("manager.exchangeBuilder.searchUniversities")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{selectedUniversities.length}</span>{" "}
                  {t("manager.exchangeBuilder.universitiesSelected")}
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{t("manager.exchangeBuilder.name")}</TableHead>
                      <TableHead>{t("manager.exchangeBuilder.country")}</TableHead>
                      <TableHead>{t("manager.exchangeBuilder.city")}</TableHead>
                      <TableHead>{t("manager.exchangeBuilder.maxStudents")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUniversities ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredUniversities.length > 0 ? (
                      filteredUniversities.map((university) => (
                        <TableRow
                          key={university.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleUniversity(university.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedUniversities.includes(university.id)}
                              onCheckedChange={() => toggleUniversity(university.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{getLocalizedName(university)}</TableCell>
                          <TableCell>{university.country}</TableCell>
                          <TableCell>{getLocalizedCity(university)}</TableCell>
                          <TableCell>{university.max_students}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          {universities.length === 0
                            ? t("manager.exchangeBuilder.noUniversitiesAvailable")
                            : t("manager.exchangeBuilder.noUniversitiesFound")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  {t("manager.exchangeBuilder.back")}
                </Button>
                <Button type="button" onClick={handleNextStep} disabled={isLoadingUniversities}>
                  {t("manager.exchangeBuilder.next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Publish */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.exchangeBuilder.programDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Program details in a single row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.exchangeBuilder.programName")}
                  </h3>
                  <p className="text-lg">{generateProgramName()}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.exchangeBuilder.group")}
                  </h3>
                  <p className="text-lg">{groups.find((g) => g.id === formData.groupId)?.name || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.exchangeBuilder.maxSelectionsLabel")}
                  </h3>
                  <p className="text-lg">{formData.maxSelections}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.exchangeBuilder.deadline")}
                  </h3>
                  <p className="text-lg">{formData.endDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.exchangeBuilder.selectedUniversities")}</h3>

                {selectedUniversities.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("manager.exchangeBuilder.name")}</TableHead>
                          <TableHead>{t("manager.exchangeBuilder.country")}</TableHead>
                          <TableHead>{t("manager.exchangeBuilder.city")}</TableHead>
                          <TableHead>{t("manager.exchangeBuilder.maxStudents")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {universities
                          .filter((university) => selectedUniversities.includes(university.id))
                          .map((university) => (
                            <TableRow key={university.id}>
                              <TableCell className="font-medium">{getLocalizedName(university)}</TableCell>
                              <TableCell>{university.country}</TableCell>
                              <TableCell>{getLocalizedCity(university)}</TableCell>
                              <TableCell>{university.max_students}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-md">
                    <h3 className="text-lg font-medium mb-2">{t("manager.exchangeBuilder.noUniversitiesSelected")}</h3>
                    <p className="text-muted-foreground mb-4">{t("manager.exchangeBuilder.goBackToAdd")}</p>
                    <Button variant="outline" onClick={handlePrevStep}>
                      {t("manager.exchangeBuilder.back")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  {t("manager.exchangeBuilder.back")}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={isSubmitting}>
                    {isSubmitting ? t("manager.exchangeBuilder.saving") : t("manager.exchangeBuilder.saveAsDraft")}
                  </Button>
                  <Button type="button" onClick={handlePublish} disabled={isSubmitting}>
                    {isSubmitting
                      ? t("manager.exchangeBuilder.publishing")
                      : t("manager.exchangeBuilder.publishProgram")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
