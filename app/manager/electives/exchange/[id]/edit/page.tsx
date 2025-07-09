"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Check, ChevronRight, FileUp, Search } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useInstitution } from "@/lib/institution-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { getSemesters, type Semester } from "@/actions/semesters"
import { getYears, type Year } from "@/actions/years"
import { useCachedGroups } from "@/hooks/use-cached-groups"
import { useDataCache } from "@/lib/data-cache-context"

interface ExchangeEditPageProps {
  params: {
    id: string
  }
}

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

interface ExchangeProgram {
  id: string
  name: string
  name_ru: string | null
  status: string
  deadline: string
  max_selections: number
  statement_template_url: string | null
  semester: string
  academic_year: string
  universities: string[]
  group_id: string | null
  created_by: string
  institution_id: string
}

export default function ExchangeEditPage({ params }: ExchangeEditPageProps) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()
  const { groups, isLoading: isLoadingGroups } = useCachedGroups()
  const { invalidateCache } = useDataCache()

  // Step state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Data states
  const [exchangeProgram, setExchangeProgram] = useState<ExchangeProgram | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [years, setYears] = useState<Year[]>([])

  // Form state
  const [formData, setFormData] = useState({
    semester: "",
    year: "",
    group: "",
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

  // Find selected group for display
  const selectedGroup = groups.find((g) => g.id === formData.group)

  // Fetch exchange program data and initialize form
  useEffect(() => {
    const fetchExchangeProgram = async () => {
      if (!params.id || !institution?.id) return

      setIsLoading(true)
      try {
        console.log("Fetching exchange program with ID:", params.id)

        // Fetch exchange program data
        const { data: exchangeData, error: exchangeError } = await supabase
          .from("elective_exchange")
          .select("*")
          .eq("id", params.id)
          .eq("institution_id", institution.id)
          .single()

        if (exchangeError) {
          console.error("Error fetching exchange program:", exchangeError)
          throw exchangeError
        }

        console.log("Exchange program data:", exchangeData)
        setExchangeProgram(exchangeData)

        // Fetch semesters and years
        const [semestersData, yearsData] = await Promise.all([getSemesters(), getYears()])

        setSemesters(semestersData)
        setYears(yearsData)

        // Pre-populate form data
        setFormData({
          semester: exchangeData.semester || "",
          year: exchangeData.academic_year || "",
          group: exchangeData.group_id || "",
          maxSelections: exchangeData.max_selections || 2,
          endDate: exchangeData.deadline ? exchangeData.deadline.split("T")[0] : "",
          status: exchangeData.status || "draft",
          statementTemplateUrl: exchangeData.statement_template_url || "",
        })

        // Set selected universities
        if (exchangeData.universities && Array.isArray(exchangeData.universities)) {
          setSelectedUniversities(exchangeData.universities)
        }
      } catch (error) {
        console.error("Error fetching exchange program:", error)
        toast({
          title: t("manager.exchangeBuilder.error"),
          description: t("manager.exchangeBuilder.errorFetchingData"),
          variant: "destructive",
        })
        router.push("/manager/electives/exchange")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchangeProgram()
  }, [params.id, institution?.id, supabase, toast, t, router])

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

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.semester || !formData.year || !formData.endDate || !formData.group) {
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

  // Handle form submission (UPDATE instead of INSERT)
  const handleSubmit = async (status: string) => {
    if (!institution?.id || !exchangeProgram?.id) return
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      // Generate both English and Russian program names
      const programNameEn = generateProgramName("en")
      const programNameRu = generateProgramName("ru")

      // Update data for the elective_exchange table
      const updateData = {
        name: programNameEn,
        name_ru: programNameRu,
        status: status,
        deadline: formData.endDate,
        max_selections: formData.maxSelections,
        statement_template_url: formData.statementTemplateUrl,
        semester: formData.semester,
        academic_year: formData.year,
        universities: selectedUniversities, // Store university IDs as an array of UUIDs
        group_id: formData.group || null,
      }

      console.log("Updating exchange program with data:", updateData)

      // Update the elective_exchange table
      const { data: exchangeData, error: exchangeError } = await supabase
        .from("elective_exchange")
        .update(updateData)
        .eq("id", exchangeProgram.id)
        .eq("institution_id", institution.id)
        .select()

      if (exchangeError) {
        console.error("Error updating exchange program:", exchangeError)
        throw exchangeError
      }

      console.log("Updated exchange program:", exchangeData)

      // Invalidate the cache for the exchange programs list
      invalidateCache("exchangePrograms", institution.id)

      toast({
        title: t("manager.exchangeBuilder.updateSuccess"),
        description: t("manager.exchangeBuilder.successDesc"),
      })

      // Redirect to exchange program details page
      router.push(`/manager/electives/exchange/${params.id}`)
    } catch (error) {
      console.error("Error updating exchange program:", error)
      toast({
        title: t("manager.exchangeBuilder.error"),
        description: t("manager.exchangeBuilder.errorUpdating"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!exchangeProgram) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-2xl font-bold mb-2">{t("manager.exchangeBuilder.notFound")}</h2>
          <p className="text-muted-foreground mb-4">{t("manager.exchangeBuilder.notFoundDesc")}</p>
          <Link href="/manager/electives/exchange">
            <Button>{t("manager.exchangeBuilder.backToList")}</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/manager/electives/exchange/${params.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("manager.exchangeBuilder.editTitle")}</h1>
              <p className="text-muted-foreground">
                <Badge variant="outline" className="mt-1">
                  {t(`manager.status.${formData.status.toLowerCase()}`)}
                </Badge>
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
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
            {t("manager.exchangeBuilder.step")} {currentStep} {t("manager.exchangeBuilder.of")} {totalSteps}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.exchangeBuilder.programInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="semester">{t("manager.exchangeBuilder.semester")}</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">{t("manager.exchangeBuilder.year")}</Label>
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
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group">{t("manager.exchangeBuilder.group", "Group")}</Label>
                {isLoadingGroups ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={formData.group} onValueChange={(value) => handleSelectChange("group", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("manager.exchangeBuilder.selectGroup", "Select a group")} />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.length > 0 ? (
                        groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-groups" disabled>
                          {t("manager.exchangeBuilder.noGroupsAvailable", "No groups available")}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("manager.exchangeBuilder.namePreview")}</Label>
                <div className="p-3 bg-muted rounded-md">{generateProgramName()}</div>
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
                  {formData.statementTemplateUrl && !selectedFile && (
                    <span className="text-sm text-muted-foreground">{t("manager.exchangeBuilder.fileUploaded")}</span>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={handleNextStep}>
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

        {/* Step 3: Review & Update */}
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
                    {t("manager.exchangeBuilder.group", "Group")}
                  </h3>
                  <p className="text-lg">{selectedGroup?.name || "N/A"}</p>
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
                    {isSubmitting ? t("manager.exchangeBuilder.updating") : t("manager.exchangeBuilder.updateProgram")}
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
