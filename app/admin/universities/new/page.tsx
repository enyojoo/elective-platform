"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, X, Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useDataCache } from "@/lib/data-cache-context"
import { useInstitution } from "@/lib/institution-context"

// Mock countries data
const countries = [
  "United States",
  "United Kingdom",
  "Switzerland",
  "Singapore",
  "Japan",
  "France",
  "China",
  "Australia",
  "Germany",
  "Canada",
  "Spain",
  "Italy",
  "Netherlands",
  "Sweden",
  "South Korea",
]

// University status options
const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "draft", label: "Draft" },
]

export default function NewUniversityPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { invalidateCache } = useDataCache()
  const { institution } = useInstitution()

  const [university, setUniversity] = useState({
    nameEn: "",
    nameRu: "",
    descriptionEn: "",
    descriptionRu: "",
    cityEn: "",
    cityRu: "",
    country: "",
    website: "",
    status: "active", // Default status
  })

  // State for languages and programs
  const [languages, setLanguages] = useState<string[]>([])
  const [programs, setPrograms] = useState<string[]>([])
  const [customLanguage, setCustomLanguage] = useState("")
  const [customProgram, setCustomProgram] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setUniversity((prev) => ({ ...prev, [name]: value }))
  }

  const handleCountryChange = (value: string) => {
    setUniversity((prev) => ({ ...prev, country: value }))
  }

  const handleStatusChange = (value: string) => {
    setUniversity((prev) => ({ ...prev, status: value }))
  }

  const handleAddLanguage = () => {
    if (customLanguage && !languages.includes(customLanguage)) {
      setLanguages([...languages, customLanguage])
      setCustomLanguage("")
    }
  }

  const handleAddProgram = () => {
    if (customProgram && !programs.includes(customProgram)) {
      setPrograms([...programs, customProgram])
      setCustomProgram("")
    }
  }

  const handleRemoveLanguage = (language: string) => {
    setLanguages(languages.filter((l) => l !== language))
  }

  const handleRemoveProgram = (program: string) => {
    setPrograms(programs.filter((p) => p !== program))
  }

  const handleKeyPress = (e: React.KeyboardEvent, type: "language" | "program") => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (type === "language") {
        handleAddLanguage()
      } else {
        handleAddProgram()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!institution?.id) {
        throw new Error("Institution ID is required")
      }

      // Prepare data with languages and programs
      const universityData = {
        ...university,
        languages,
        programs,
        institution_id: institution.id,
      }

      // Insert the university into the database
      const { data, error } = await supabase.from("universities").insert([universityData]).select()

      if (error) {
        throw error
      }

      // Invalidate the universities cache
      invalidateCache("universities", institution.id)

      // Show success toast
      toast({
        title: t("admin.universities.createSuccess", "University created successfully"),
        description: t("admin.universities.createSuccessDesc", "The university has been added to your institution."),
      })

      // Redirect to universities page after successful submission
      router.push("/admin/universities")
    } catch (error) {
      console.error("Error creating university:", error)
      toast({
        title: t("admin.universities.createError", "Failed to create university"),
        description: t(
          "admin.universities.createErrorDesc",
          "There was an error creating the university. Please try again.",
        ),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/universities">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">{t("admin.newUniversity.title", "Add New University")}</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name - English and Russian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nameEn">{t("admin.newUniversity.nameEn", "University Name (English)")}</Label>
                  <Input
                    id="nameEn"
                    name="nameEn"
                    placeholder={t("admin.newUniversity.namePlaceholder", "Harvard University")}
                    value={university.nameEn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameRu">{t("admin.newUniversity.nameRu", "University Name (Russian)")}</Label>
                  <Input
                    id="nameRu"
                    name="nameRu"
                    placeholder={t("admin.newUniversity.namePlaceholder", "Гарвардский университет")}
                    value={university.nameRu}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Description - English and Russian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">
                    {t("admin.newUniversity.descriptionEn", "Description (English)")}
                  </Label>
                  <Textarea
                    id="descriptionEn"
                    name="descriptionEn"
                    placeholder={t(
                      "admin.newUniversity.descriptionPlaceholder",
                      "Brief description of the university and partnership details...",
                    )}
                    value={university.descriptionEn}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionRu">
                    {t("admin.newUniversity.descriptionRu", "Description (Russian)")}
                  </Label>
                  <Textarea
                    id="descriptionRu"
                    name="descriptionRu"
                    placeholder={t(
                      "admin.newUniversity.descriptionPlaceholder",
                      "Краткое описание университета и деталей партнерства...",
                    )}
                    value={university.descriptionRu}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Languages of Instruction and Available Programs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Languages of Instruction */}
                <div className="space-y-2">
                  <Label htmlFor="languages">{t("admin.newUniversity.languages", "Languages of Instruction")}</Label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {languages.map((language) => (
                      <Badge key={language} variant="secondary" className="px-2 py-1 text-sm">
                        {language}
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(language)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      id="languages"
                      placeholder={t("admin.newUniversity.addLanguage", "Add language")}
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, "language")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddLanguage}
                      disabled={!customLanguage}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Available Programs */}
                <div className="space-y-2">
                  <Label htmlFor="programs">{t("admin.newUniversity.programs", "Available Programs")}</Label>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {programs.map((program) => (
                      <Badge key={program} variant="secondary" className="px-2 py-1 text-sm">
                        {program}
                        <button
                          type="button"
                          onClick={() => handleRemoveProgram(program)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      id="programs"
                      placeholder={t("admin.newUniversity.addProgram", "Add program")}
                      value={customProgram}
                      onChange={(e) => setCustomProgram(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, "program")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddProgram}
                      disabled={!customProgram}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* City - English and Russian */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="cityEn">{t("admin.newUniversity.cityEn", "City (English)")}</Label>
                  <Input
                    id="cityEn"
                    name="cityEn"
                    placeholder={t("admin.newUniversity.cityPlaceholder", "Cambridge")}
                    value={university.cityEn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cityRu">{t("admin.newUniversity.cityRu", "City (Russian)")}</Label>
                  <Input
                    id="cityRu"
                    name="cityRu"
                    placeholder={t("admin.newUniversity.cityPlaceholder", "Кембридж")}
                    value={university.cityRu}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Country and Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">{t("admin.newUniversity.country", "Country")}</Label>
                  <Select value={university.country} onValueChange={handleCountryChange} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.newUniversity.selectCountry", "Select country")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t("admin.newUniversity.website", "Website")}</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder={t("admin.newUniversity.websitePlaceholder", "https://www.harvard.edu")}
                    value={university.website}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">{t("admin.newUniversity.status", "Status")}</Label>
                <Select value={university.status} onValueChange={handleStatusChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.newUniversity.selectStatus", "Select status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`admin.universities.${option.value}`, option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.push("/admin/universities")}>
                  {t("admin.newUniversity.cancel", "Cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t("admin.newUniversity.creating", "Creating...")
                    : t("admin.newUniversity.create", "Create University")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
