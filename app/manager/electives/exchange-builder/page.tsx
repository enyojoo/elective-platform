"use client"

import type React from "react"

import { useState } from "react"
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

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    name_ru: "",
    description: "",
    description_ru: "",
    semester: "fall",
    year: new Date().getFullYear().toString(),
    maxSelections: 2,
    startDate: "",
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
          title: t("manager.exchangeBuilder.uploadSuccess", "File uploaded"),
          description: file.name,
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: t("manager.exchangeBuilder.uploadError", "Upload failed"),
        description: t("manager.exchangeBuilder.uploadErrorDesc", "Failed to upload file"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Fetch universities
  const fetchUniversities = async () => {
    if (!institution?.id) return

    try {
      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .eq("institution_id", institution.id)
        .eq("status", "active")
        .order("name", { ascending: true })

      if (error) throw error

      setUniversities(data || [])
    } catch (error) {
      console.error("Error fetching universities:", error)
      toast({
        title: t("manager.exchangeBuilder.error", "Error"),
        description: t("manager.exchangeBuilder.errorFetchingUniversities", "Failed to fetch universities"),
        variant: "destructive",
      })
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
      if (!formData.semester || !formData.year || !formData.startDate || !formData.endDate) {
        toast({
          title: t("manager.exchangeBuilder.missingInfo", "Missing Information"),
          description: t("manager.exchangeBuilder.requiredFields", "Please fill in all required fields"),
          variant: "destructive",
        })
        return
      }
    } else if (currentStep === 2) {
      // Fetch universities if not already loaded
      if (universities.length === 0) {
        fetchUniversities()
      }

      // Validate step 2
      if (selectedUniversities.length === 0) {
        toast({
          title: t("manager.exchangeBuilder.missingInfo", "Missing Information"),
          description: t("manager.exchangeBuilder.universityRequired", "At least one university must be selected"),
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

  // Handle form submission
  const handleSubmit = async (status: string) => {
    if (!institution?.id) return

    try {
      // Create elective pack
      const { data: packData, error: packError } = await supabase
        .from("elective_packs")
        .insert([
          {
            institution_id: institution.id,
            name: formData.name || `${formData.semester} ${formData.year} Exchange Program`,
            name_ru: formData.name_ru,
            description: formData.description,
            description_ru: formData.description_ru,
            type: "exchange",
            status: status,
            deadline: formData.endDate,
            max_selections: formData.maxSelections,
            statement_template_url: formData.statementTemplateUrl,
          },
        ])
        .select()

      if (packError) throw packError

      const packId = packData[0].id

      // Create exchange universities
      const universityInserts = selectedUniversities.map((universityId) => ({
        institution_id: institution.id,
        elective_pack_id: packId,
        university_id: universityId,
      }))

      const { error: universitiesError } = await supabase.from("exchange_universities").insert(universityInserts)

      if (universitiesError) throw universitiesError

      toast({
        title:
          status === "draft"
            ? t("manager.exchangeBuilder.draftSaved", "Draft Saved")
            : t("manager.exchangeBuilder.programPublished", "Program Published"),
        description: t("manager.exchangeBuilder.successDesc", "Exchange program has been created successfully"),
      })

      // Redirect to exchange programs page
      router.push("/manager/electives/exchange")
    } catch (error) {
      console.error("Error creating exchange program:", error)
      toast({
        title: t("manager.exchangeBuilder.error", "Error"),
        description: t("manager.exchangeBuilder.errorCreating", "Failed to create exchange program"),
        variant: "destructive",
      })
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
              <h1 className="text-3xl font-bold tracking-tight">
                {t("manager.exchangeBuilder.title", "Create Exchange Program")}
              </h1>
              <p className="text-muted-foreground">
                <Badge variant="outline" className="mt-1">
                  {t("manager.exchangeBuilder.draft", "Draft")}
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
                <p className="text-sm font-medium">{t("manager.exchangeBuilder.step1", "Basic Information")}</p>
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
                <p className="text-sm font-medium">{t("manager.exchangeBuilder.step2", "Add Universities")}</p>
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
                <p className="text-sm font-medium">{t("manager.exchangeBuilder.step3", "Review & Publish")}</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {t("manager.exchangeBuilder.step", "Step")} {currentStep} {t("manager.exchangeBuilder.of", "of")}{" "}
            {totalSteps}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.exchangeBuilder.programInfo", "Program Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="semester">{t("manager.exchangeBuilder.semester", "Semester")}</Label>
                  <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall">{t("manager.exchangeBuilder.fall", "Fall")}</SelectItem>
                      <SelectItem value="spring">{t("manager.exchangeBuilder.spring", "Spring")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">{t("manager.exchangeBuilder.year", "Year")}</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 5}
                    value={formData.year}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("manager.exchangeBuilder.namePreview", "Program Name Preview")}</Label>
                <div className="p-3 bg-muted rounded-md">
                  {formData.name ||
                    `${formData.semester === "fall" ? t("manager.exchangeBuilder.fall", "Fall") : t("manager.exchangeBuilder.spring", "Spring")} ${formData.year} ${t("manager.electives.exchangePrograms", "Exchange Program")}`}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("manager.exchangeBuilder.customName", "Custom Name (Optional)")}</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder={t("manager.exchangeBuilder.customNamePlaceholder", "Custom program name (optional)")}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name_ru">
                  {t("manager.exchangeBuilder.customNameRu", "Custom Name in Russian (Optional)")}
                </Label>
                <Input
                  id="name_ru"
                  name="name_ru"
                  placeholder={t(
                    "manager.exchangeBuilder.customNameRuPlaceholder",
                    "Custom program name in Russian (optional)",
                  )}
                  value={formData.name_ru}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {t("manager.exchangeBuilder.selectionRules", "Selection Rules")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxSelections">
                      {t("manager.exchangeBuilder.maxSelections", "Maximum Selections")}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="maxSelections"
                        name="maxSelections"
                        type="number"
                        min={1}
                        max={10}
                        value={formData.maxSelections}
                        onChange={handleChange}
                      />
                      <span className="text-muted-foreground whitespace-nowrap">
                        {t("manager.exchangeBuilder.universitiesPerStudent", "universities per student")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {t("manager.exchangeBuilder.selectionPeriod", "Selection Period")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t("manager.exchangeBuilder.startDate", "Selection Start Date")}</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t("manager.exchangeBuilder.endDate", "Selection End Date")}</Label>
                    <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {t("manager.exchangeBuilder.statementUpload", "Statement Upload")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "manager.exchangeBuilder.statementDescription",
                    "Upload a blank statement file that students will download, sign, and re-upload.",
                  )}
                </p>

                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="statement-file"
                    className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {t("manager.exchangeBuilder.uploadStatementFile", "Upload Statement File (PDF)")}
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
                <Button type="button" onClick={handleNextStep}>
                  {t("manager.exchangeBuilder.next", "Next")}
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
              <CardTitle>{t("manager.exchangeBuilder.addUniversities", "Add Universities")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("manager.exchangeBuilder.searchUniversities", "Search universities...")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{selectedUniversities.length}</span>{" "}
                  {t("manager.exchangeBuilder.universitiesSelected", "universities selected")}
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{t("manager.exchangeBuilder.name", "Name")}</TableHead>
                      <TableHead>{t("manager.exchangeBuilder.country", "Country")}</TableHead>
                      <TableHead>{t("manager.exchangeBuilder.city", "City")}</TableHead>
                      <TableHead>{t("manager.exchangeBuilder.maxStudents", "Max Students")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUniversities.length > 0 ? (
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
                          {t(
                            "manager.exchangeBuilder.noUniversitiesFound",
                            "No universities found matching your search.",
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  {t("manager.exchangeBuilder.back", "Back")}
                </Button>
                <Button type="button" onClick={handleNextStep}>
                  {t("manager.exchangeBuilder.next", "Next")}
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
              <CardTitle>{t("manager.exchangeBuilder.programDetails", "Program Details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.exchangeBuilder.semester", "Semester")}
                  </h3>
                  <p className="text-lg">
                    {formData.semester === "fall"
                      ? t("manager.exchangeBuilder.fall", "Fall")
                      : t("manager.exchangeBuilder.spring", "Spring")}{" "}
                    {formData.year}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.exchangeBuilder.maxSelectionsLabel", "Max Selections:")}
                  </h3>
                  <p className="text-lg">{formData.maxSelections}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("manager.exchangeBuilder.selectionPeriod", "Selection Period:")}
                </h3>
                <p className="text-lg">
                  {formData.startDate} - {formData.endDate}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  {t("manager.exchangeBuilder.universities", "Universities:")}
                </h3>
                <p className="text-lg">{selectedUniversities.length}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {t("manager.exchangeBuilder.selectedUniversities", "Selected Universities")}
                </h3>

                {selectedUniversities.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("manager.exchangeBuilder.name", "Name")}</TableHead>
                          <TableHead>{t("manager.exchangeBuilder.country", "Country")}</TableHead>
                          <TableHead>{t("manager.exchangeBuilder.city", "City")}</TableHead>
                          <TableHead>{t("manager.exchangeBuilder.maxStudents", "Max Students")}</TableHead>
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
                    <h3 className="text-lg font-medium mb-2">
                      {t("manager.exchangeBuilder.noUniversitiesSelected", "No Universities Selected")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t(
                        "manager.exchangeBuilder.goBackToAdd",
                        "Go back to add universities to this exchange program.",
                      )}
                    </p>
                    <Button variant="outline" onClick={handlePrevStep}>
                      {t("manager.exchangeBuilder.back", "Back")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  {t("manager.exchangeBuilder.back", "Back")}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveAsDraft}>
                    {t("manager.exchangeBuilder.saveAsDraft", "Save as Draft")}
                  </Button>
                  <Button type="button" onClick={handlePublish}>
                    {t("manager.exchangeBuilder.publishProgram", "Publish Program")}
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
