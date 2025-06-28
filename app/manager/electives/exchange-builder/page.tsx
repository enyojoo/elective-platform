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
import { ArrowLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
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
    group_id: "",
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
      if (!institution?.id) return
      setIsLoading(true)
      try {
        console.log("Fetching semesters, years, and groups data...")
        const [semestersData, yearsData, groupsData] = await Promise.all([
          getSemesters(),
          getYears(),
          getGroups(institution.id),
        ])

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
            group_id: groupsData[0].id,
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

    if (institution?.id) {
      fetchData()
    }
  }, [toast, t, institution?.id])

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
      if (!formData.semester || !formData.year || !formData.group_id || !formData.endDate) {
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

  // Render the page content based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            {/* Step 1 content */}
            <Label>{t("manager.exchangeBuilder.semester")}</Label>
            <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("manager.exchangeBuilder.selectSemester")} />
              </SelectTrigger>
              <SelectContent>
                {semesters.map((semester) => (
                  <SelectItem key={semester.code} value={semester.code}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Other form fields for step 1 */}
          </div>
        )
      case 2:
        return (
          <div>
            {/* Step 2 content */}
            <Label>{t("manager.exchangeBuilder.universities")}</Label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("manager.exchangeBuilder.searchUniversities")}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("manager.exchangeBuilder.name")}</TableHead>
                  <TableHead>{t("manager.exchangeBuilder.city")}</TableHead>
                  <TableHead>{t("manager.exchangeBuilder.select")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUniversities.map((university) => (
                  <TableRow key={university.id}>
                    <TableCell>{getLocalizedName(university)}</TableCell>
                    <TableCell>{getLocalizedCity(university)}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selectedUniversities.includes(university.id)}
                        onCheckedChange={() => toggleUniversity(university.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      case 3:
        return (
          <div>
            {/* Step 3 content */}
            <Label>{t("manager.exchangeBuilder.statementTemplate")}</Label>
            <Input type="file" onChange={handleFileChange} disabled={isUploading} />
            {isUploading && <Skeleton className="h-4 w-32" />}
            {selectedFile && (
              <div>
                <p>{selectedFile.name}</p>
                <Button onClick={() => setSelectedFile(null)}>{t("manager.exchangeBuilder.removeFile")}</Button>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t("manager.exchangeBuilder.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>
              {/* Loading state */}
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : (
            <div>
              {/* Step content */}
              {renderStepContent()}
              {/* Navigation buttons */}
              <div className="flex justify-between mt-4">
                <Button onClick={handlePrevStep} disabled={currentStep === 1}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("manager.exchangeBuilder.prev")}
                </Button>
                <Button onClick={handleNextStep} disabled={currentStep === totalSteps}>
                  {t("manager.exchangeBuilder.next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
