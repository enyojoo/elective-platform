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
import { ArrowLeft, Check, ChevronRight, Search } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useInstitution } from "@/lib/institution-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface Course {
  id: string
  name_en: string
  name_ru: string | null
  instructor_en: string
  instructor_ru: string | null
  max_students: number
  status: string
}

export default function CourseBuilderPage() {
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
  })

  // Courses state
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Update the state to include loading state
  const [isLoading, setIsLoading] = useState(false)

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Fetch courses
  const fetchCourses = async () => {
    if (!institution?.id) return

    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("institution_id", institution.id)
        .eq("status", "active")
        .order("name_en", { ascending: true })

      if (error) throw error

      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: t("manager.courseBuilder.error", "Error"),
        description: t("manager.courseBuilder.errorFetchingCourses", "Failed to fetch courses"),
        variant: "destructive",
      })
    }
  }

  // Toggle course selection
  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]))
  }

  // Filter courses based on search term
  const filteredCourses = courses.filter((course) => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    return (
      (course.name_en && course.name_en.toLowerCase().includes(term)) ||
      (course.name_ru && course.name_ru.toLowerCase().includes(term)) ||
      (course.instructor_en && course.instructor_en.toLowerCase().includes(term)) ||
      (course.instructor_ru && course.instructor_ru.toLowerCase().includes(term))
    )
  })

  // Get localized name based on current language
  const getLocalizedName = (course: Course) => {
    if (language === "ru" && course.name_ru) {
      return course.name_ru
    }
    return course.name_en
  }

  // Get localized instructor based on current language
  const getLocalizedInstructor = (course: Course) => {
    if (language === "ru" && course.instructor_ru) {
      return course.instructor_ru
    }
    return course.instructor_en
  }

  // Handle next step
  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!formData.semester || !formData.year || !formData.startDate || !formData.endDate) {
        toast({
          title: t("manager.courseBuilder.missingInfo", "Missing Information"),
          description: t("manager.courseBuilder.requiredFields", "Please fill in all required fields"),
          variant: "destructive",
        })
        return
      }
    } else if (currentStep === 2) {
      // Fetch courses if not already loaded
      if (courses.length === 0) {
        fetchCourses()
      }

      // Validate step 2
      if (selectedCourses.length === 0) {
        toast({
          title: t("manager.courseBuilder.missingInfo", "Missing Information"),
          description: t("manager.courseBuilder.courseRequired", "At least one course must be selected"),
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
            name: formData.name || `${formData.semester} ${formData.year} Course Selection`,
            name_ru: formData.name_ru,
            description: formData.description,
            description_ru: formData.description_ru,
            type: "course",
            status: status,
            deadline: formData.endDate,
            max_selections: formData.maxSelections,
          },
        ])
        .select()

      if (packError) throw packError

      const packId = packData[0].id

      // Update courses with elective_pack_id
      const { error: coursesError } = await supabase
        .from("courses")
        .update({ elective_pack_id: packId })
        .in("id", selectedCourses)

      if (coursesError) throw coursesError

      toast({
        title:
          status === "draft"
            ? t("manager.courseBuilder.draftSaved", "Draft Saved")
            : t("manager.courseBuilder.programPublished", "Program Published"),
        description: t("manager.courseBuilder.successDesc", "Course selection has been created successfully"),
      })

      // Redirect to course electives page
      router.push("/manager/electives/course")
    } catch (error) {
      console.error("Error creating course selection:", error)
      toast({
        title: t("manager.courseBuilder.error", "Error"),
        description: t("manager.courseBuilder.errorCreating", "Failed to create course selection"),
        variant: "destructive",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives/course">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t("manager.courseBuilder.title", "Create Elective Course Selection")}
              </h1>
            </div>
          </div>
        </div>

        {/* Update the progress indicator to match exchange-builder style */}
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
                <p className="text-sm font-medium">{t("manager.courseBuilder.step1", "General Information")}</p>
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
                <p className="text-sm font-medium">{t("manager.courseBuilder.step2", "Select Courses")}</p>
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
                <p className="text-sm font-medium">{t("manager.courseBuilder.step3", "Confirmation")}</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {t("manager.courseBuilder.step", "Step")} {currentStep} {t("manager.courseBuilder.of", "of")} {totalSteps}
          </div>
        </div>

        {/* Step 1: General Information */}
        {/* Update the Step 1 implementation to match exchange-builder style */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.courseBuilder.step1", "General Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="semester">{t("manager.courseBuilder.semester", "Semester")}</Label>
                  <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("manager.courseBuilder.selectSemester", "Select a semester")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall">{t("manager.courseBuilder.fall", "Fall")}</SelectItem>
                      <SelectItem value="spring">{t("manager.courseBuilder.spring", "Spring")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">{t("manager.courseBuilder.year", "Year")}</Label>
                  <Input type="number" id="year" name="year" value={formData.year} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("manager.courseBuilder.namePreview", "Name Preview")}</Label>
                <div className="p-3 bg-muted rounded-md">
                  {formData.name || `${formData.semester} ${formData.year} Course Selection`}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.courseBuilder.programDetails", "Program Details")}</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("manager.courseBuilder.name", "Name")}</Label>
                    <Input type="text" id="name" name="name" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name_ru">{t("manager.courseBuilder.nameRu", "Name (Russian)")}</Label>
                    <Input type="text" id="name_ru" name="name_ru" value={formData.name_ru} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.courseBuilder.description", "Description")}</h3>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">{t("manager.courseBuilder.description", "Description")}</Label>
                    <Input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description_ru">
                      {t("manager.courseBuilder.descriptionRu", "Description (Russian)")}
                    </Label>
                    <Input
                      type="text"
                      id="description_ru"
                      name="description_ru"
                      value={formData.description_ru}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.courseBuilder.selectionRules", "Selection Rules")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxSelections">{t("manager.courseBuilder.maxSelections", "Max Selections")}</Label>
                    <Input
                      type="number"
                      id="maxSelections"
                      name="maxSelections"
                      min={1}
                      max={10}
                      value={formData.maxSelections}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("manager.courseBuilder.coursesPerStudent", "Maximum number of courses a student can select")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t("manager.courseBuilder.endDate", "End Date")}</Label>
                    <Input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="button" onClick={handleNextStep}>
                  {t("manager.courseBuilder.next", "Next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Courses */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.courseBuilder.step2", "Select Courses")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground peer-focus:text-primary" />
                <Input
                  placeholder={t("manager.courseBuilder.searchCourses", "Search courses...")}
                  className="pl-8"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[20px]"></TableHead>
                    <TableHead>{t("manager.courseBuilder.courseName", "Course Name")}</TableHead>
                    <TableHead>{t("manager.courseBuilder.instructor", "Instructor")}</TableHead>
                    <TableHead className="text-right">
                      {t("manager.courseBuilder.maxStudents", "Max Students")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => toggleCourse(course.id)}
                          id={course.id}
                        />
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={course.id} className="cursor-pointer">
                          {getLocalizedName(course)}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={course.id} className="cursor-pointer">
                          {getLocalizedInstructor(course)}
                        </Label>
                      </TableCell>
                      <TableCell className="text-right">{course.max_students}</TableCell>
                    </TableRow>
                  ))}
                  {filteredCourses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {t("manager.courseBuilder.noCoursesFound", "No courses found.")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.courseBuilder.step3", "Confirmation")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("manager.courseBuilder.name", "Name")}</Label>
                  <p className="font-medium">
                    {formData.name || `${formData.semester} ${formData.year} Course Selection`}
                  </p>
                </div>
                <div>
                  <Label>{t("manager.courseBuilder.semester", "Semester")}</Label>
                  <p className="font-medium">{t(`manager.courseBuilder.${formData.semester}`, formData.semester)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>{t("manager.courseBuilder.year", "Year")}</Label>
                  <p className="font-medium">{formData.year}</p>
                </div>
                <div>
                  <Label>{t("manager.courseBuilder.maxSelections", "Max Selections")}</Label>
                  <p className="font-medium">{formData.maxSelections}</p>
                </div>
              </div>
              <div>
                <Label>{t("manager.courseBuilder.selectedCourses", "Selected Courses")}</Label>
                <ul>
                  {selectedCourses.map((courseId) => {
                    const course = courses.find((c) => c.id === courseId)
                    return (
                      <li key={courseId} className="font-medium">
                        {course ? getLocalizedName(course) : "Unknown Course"}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="secondary" onClick={handlePrevStep} disabled={currentStep === 1}>
            {t("manager.courseBuilder.previous", "Previous")}
          </Button>
          <div>
            <Button variant="outline" onClick={handleSaveAsDraft}>
              {t("manager.courseBuilder.saveDraft", "Save as Draft")}
            </Button>
            <Button onClick={handleNextStep} disabled={currentStep === totalSteps}>
              {t("manager.courseBuilder.next", "Next")}
            </Button>
            {currentStep === totalSteps && (
              <Button onClick={handlePublish}>{t("manager.courseBuilder.publish", "Publish")}</Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
