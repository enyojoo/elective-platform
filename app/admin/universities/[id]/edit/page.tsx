"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, X } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"

interface University {
  id: string
  name: string
  name_ru: string | null
  country: string
  city: string
  city_ru: string | null
  website: string | null
  status: string
  created_at: string
  updated_at: string
  university_languages: string[] | null
  university_programs: string[] | null
  description?: string
  description_ru?: string | null
  institution_id: string
}

interface Country {
  id: string
  code: string
  name: string
  name_ru: string | null
  created_at: string
}

export default function EditUniversityPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [university, setUniversity] = useState<University | null>(null)
  const [countries, setCountries] = useState<Country[]>([])
  const [formData, setFormData] = useState({
    name: "",
    name_ru: "",
    country: "",
    city: "",
    city_ru: "",
    website: "",
    status: "active",
    description: "",
    description_ru: "",
    university_languages: [] as string[],
    university_programs: [] as string[],
  })
  const [newLanguage, setNewLanguage] = useState("")
  const [newProgram, setNewProgram] = useState("")
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()

  // Fetch countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const { data, error } = await supabase.from("countries").select("*")

        if (error) {
          throw error
        }

        if (data) {
          setCountries(data)
        }
      } catch (error) {
        console.error("Error fetching countries:", error)
      }
    }

    fetchCountries()
  }, [supabase])

  // Fetch university data
  useEffect(() => {
    const fetchUniversity = async () => {
      setIsLoading(true)
      try {
        if (!institution?.id) {
          setIsLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("universities")
          .select("*")
          .eq("id", params.id)
          .eq("institution_id", institution.id)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          setUniversity(data)
          setFormData({
            name: data.name || "",
            name_ru: data.name_ru || "",
            country: data.country || "",
            city: data.city || "",
            city_ru: data.city_ru || "",
            website: data.website || "",
            status: data.status || "active",
            description: data.description || "",
            description_ru: data.description_ru || "",
            university_languages: data.university_languages || [],
            university_programs: data.university_programs || [],
          })
        }
      } catch (error) {
        console.error("Error fetching university:", error)
        toast({
          title: t("admin.universities.error", "Error"),
          description: t("admin.universities.errorFetching", "Failed to fetch university details"),
          variant: "destructive",
        })
        router.push("/admin/universities")
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchUniversity()
    }
  }, [params.id, supabase, toast, t, institution?.id, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !formData.university_languages.includes(newLanguage.trim())) {
      setFormData((prev) => ({
        ...prev,
        university_languages: [...prev.university_languages, newLanguage.trim()],
      }))
      setNewLanguage("")
    }
  }

  const handleRemoveLanguage = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      university_languages: prev.university_languages.filter((lang) => lang !== language),
    }))
  }

  const handleAddProgram = () => {
    if (newProgram.trim() && !formData.university_programs.includes(newProgram.trim())) {
      setFormData((prev) => ({
        ...prev,
        university_programs: [...prev.university_programs, newProgram.trim()],
      }))
      setNewProgram("")
    }
  }

  const handleRemoveProgram = (program: string) => {
    setFormData((prev) => ({
      ...prev,
      university_programs: prev.university_programs.filter((prog) => prog !== program),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (!university || !institution?.id) {
        throw new Error("University or institution not found")
      }

      const { error } = await supabase
        .from("universities")
        .update({
          name: formData.name,
          name_ru: formData.name_ru || null,
          country: formData.country,
          city: formData.city,
          city_ru: formData.city_ru || null,
          website: formData.website || null,
          status: formData.status,
          description: formData.description || null,
          description_ru: formData.description_ru || null,
          university_languages: formData.university_languages,
          university_programs: formData.university_programs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", university.id)
        .eq("institution_id", institution.id)

      if (error) {
        throw error
      }

      toast({
        title: t("admin.universities.updateSuccess", "University Updated"),
        description: t("admin.universities.updateSuccessDesc", "University has been updated successfully"),
      })

      router.push(`/admin/universities/${university.id}`)
    } catch (error) {
      console.error("Error updating university:", error)
      toast({
        title: t("admin.universities.error", "Error"),
        description: t("admin.universities.errorUpdating", "Failed to update university"),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href={`/admin/universities/${params.id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.universities.loading", "Loading...")}</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="h-40 flex items-center justify-center">
                <p>{t("admin.universities.loading", "Loading university details...")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!university) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Link href="/admin/universities">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.universities.notFound", "Not Found")}</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="h-40 flex items-center justify-center">
                <p>{t("admin.universities.universityNotFound", "University not found")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Link href={`/admin/universities/${university.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("admin.universities.editUniversity", "Edit University")}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("admin.universities.information", "University Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("admin.newUniversity.nameEn", "University Name (English)")}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t("admin.newUniversity.namePlaceholder", "Harvard University")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_ru">{t("admin.newUniversity.nameRu", "University Name (Russian)")}</Label>
                  <Input
                    id="name_ru"
                    name="name_ru"
                    value={formData.name_ru}
                    onChange={handleInputChange}
                    placeholder={t("admin.newUniversity.namePlaceholder", "Гарвардский университет")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">{t("admin.newUniversity.country", "Country")}</Label>
                  <Select value={formData.country} onValueChange={(value) => handleSelectChange("country", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("admin.newUniversity.selectCountry", "Select country")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {language === "ru" && country.name_ru ? country.name_ru : country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t("admin.newUniversity.cityEn", "City (English)")}</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder={t("admin.newUniversity.cityPlaceholder", "Cambridge")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_ru">{t("admin.newUniversity.cityRu", "City (Russian)")}</Label>
                  <Input
                    id="city_ru"
                    name="city_ru"
                    value={formData.city_ru}
                    onChange={handleInputChange}
                    placeholder={t("admin.newUniversity.cityPlaceholder", "Кембридж")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">{t("admin.newUniversity.website", "Website")}</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder={t("admin.newUniversity.websitePlaceholder", "https://www.harvard.edu")}
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t("admin.newUniversity.status", "Status")}</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.newUniversity.selectStatus", "Select status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("admin.universities.status.active", "Active")}</SelectItem>
                    <SelectItem value="inactive">{t("admin.universities.status.inactive", "Inactive")}</SelectItem>
                    <SelectItem value="draft">{t("admin.universities.status.draft", "Draft")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="description">{t("admin.newUniversity.descriptionEn", "Description (English)")}</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t(
                      "admin.newUniversity.descriptionPlaceholder",
                      "Brief description of the university and partnership details...",
                    )}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_ru">
                    {t("admin.newUniversity.descriptionRu", "Description (Russian)")}
                  </Label>
                  <Textarea
                    id="description_ru"
                    name="description_ru"
                    value={formData.description_ru}
                    onChange={handleInputChange}
                    placeholder={t(
                      "admin.newUniversity.descriptionPlaceholder",
                      "Краткое описание университета и детали партнерства...",
                    )}
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("admin.newUniversity.languages", "Languages of Instruction")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {t(
                  "admin.newUniversity.languagesDescription",
                  "Add languages of instruction offered by this university",
                )}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {formData.university_languages.map((language) => (
                  <Badge key={language} variant="secondary" className="flex items-center gap-1">
                    {language}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(language)}
                      className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">{t("admin.universities.remove", "Remove")}</span>
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder={t("admin.universities.languagePlaceholder", "e.g., English, French, Spanish")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddLanguage()
                      }
                    }}
                  />
                </div>
                <Button type="button" onClick={handleAddLanguage} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.universities.addLanguage", "Add Language")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("admin.newUniversity.programs", "Available Programs")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {t("admin.newUniversity.programsDescription", "Add academic programs available at this university")}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {formData.university_programs.map((program) => (
                  <Badge key={program} variant="secondary" className="flex items-center gap-1">
                    {program}
                    <button
                      type="button"
                      onClick={() => handleRemoveProgram(program)}
                      className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">{t("admin.universities.remove", "Remove")}</span>
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newProgram}
                    onChange={(e) => setNewProgram(e.target.value)}
                    placeholder={t("admin.universities.programPlaceholder", "e.g., Business, Engineering, Arts")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddProgram()
                      }
                    }}
                  />
                </div>
                <Button type="button" onClick={handleAddProgram} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("admin.universities.addProgram", "Add Program")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardFooter className="flex justify-between pt-6">
              <Link href={`/admin/universities/${university.id}`}>
                <Button variant="outline" type="button">
                  {t("admin.newUniversity.cancel", "Cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? t("admin.universities.saving", "Saving...")
                  : t("admin.universities.saveChanges", "Save Changes")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  )
}
