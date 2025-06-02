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

  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCourses, setIsLoadingCourses] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Semesters and years state
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [years, setYears] = useState<Year[]>([])

  // Form state
  const [formData, setFormData] = useState({
    semester: "",
    year: "",
    maxSelections: 2,
    endDate: "",
    status: "draft",
    syllabusTemplateUrl: "",
  })

  // Courses state
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // File upload state
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch semesters, years, and academic years on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching semesters and years data...")
        const [semestersData, yearsData] = await Promise.all([getSemesters(), getYears()])

        console.log("Semesters data:", semestersData)
        console.log("Years data:", yearsData)

        setSemesters(semestersData)
        setYears(yearsData)

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
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: t("manager.courseBuilder.error", "Error"),
          description: t("manager.courseBuilder.errorFetchingData", "Failed to fetch data"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast, t])

  // Fetch courses when entering step 2
  useEffect(() => {
    if (currentStep === 2 && courses.length === 0 && !isLoadingCourses) {
      fetchCourses()
    }
  }, [currentStep, courses.length, isLoadingCourses])

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
      const fileName = `syllabus_templates/${Date.now()}.${fileExt}`

      const { error: uploadError, data } = await supabase.storage.from("documents").upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName)

      if (urlData) {
        setFormData((prev) => ({ ...prev, syllabusTemplateUrl: urlData.publicUrl }))
        toast({
          title: t("manager.courseBuilder.uploadSuccess", "Upload Successful"),
          description: file.name,
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: t("manager.courseBuilder.uploadError", "Upload Error"),
        description: t("manager.courseBuilder.uploadErrorDesc", "Failed to upload file"),
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Fetch courses
  const fetchCourses = async () => {
    if (!institution?.id) return

    setIsLoadingCourses(true)
    try {
      console.log("Fetching courses...")
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("institution_id", institution.id)
        .eq("status", "active")
        .order("name_en", { ascending: true })

      if (error) throw error

      console.log("Courses data:", data)
      setCourses(data || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast({
        title: t("manager.courseBuilder.error", "Error"),
        description: t("manager.courseBuilder.errorFetchingCourses", "Failed to fetch courses"),
        variant: "destructive",
      })
    } finally {
      setIsLoadingCourses(false)
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
      if (!formData.semester || !formData.year || !formData.endDate) {
        toast({
          title: t("manager.courseBuilder.missingInfo", "Missing Information"),
          description: t("manager.courseBuilder.requiredFields", "Please fill in all required fields"),
          variant: "destructive",
        })
        return
      }
    } else if (currentStep === 2) {
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

  // Generate program name based on semester and year
  const generateProgramName = (lang: string = language) => {
    const selectedSemester = semesters.find((s) => s.code === formData.semester)
    const selectedYear = years.find((y) => y.id === formData.year)

    const semesterName =
      lang === "ru"
        ? selectedSemester?.name_ru || (formData.semester === "fall" ? "Осенний" : "Весенний")
        : selectedSemester?.name || (formData.semester === "fall" ? "Fall" : "Spring")

    const yearValue = selectedYear?.year || ""

    const courseText = lang === "ru" ? "Выбор курсов" : "Course Selection"

    return `${semesterName} ${yearValue} ${courseText}`
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

      // Get current user profile for created_by
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      console.log("Current user:", user)

      // Use the current user's ID directly as the profile ID
      const profileId = user.id

      console.log("Using profile ID:", profileId)

      // Create elective_courses entry
      const { data: electiveCoursesData, error: electiveCoursesError } = await supabase
        .from("elective_courses")
        .insert([
          {
            institution_id: institution.id,
            name: programNameEn,
            name_ru: programNameRu,
            status: status,
            deadline: formData.endDate,
            max_selections: formData.maxSelections,
            syllabus_template_url: formData.syllabusTemplateUrl,
            semester: formData.semester,
            academic_year: formData.year,
            courses: selectedCourses, // Store course IDs as an array of UUIDs
            created_by: profileId,
          },
        ])
        .select()

      if (electiveCoursesError) {
        console.error("Error creating elective courses:", electiveCoursesError)
        throw electiveCoursesError
      }

      console.log("Created elective courses:", electiveCoursesData)

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
    } finally {
      setIsSubmitting(false)
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
              <p className="text-muted-foreground">
                <Badge variant="outline" className="mt-1">
                  {t("manager.courseBuilder.draft", "Draft")}
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
                <p className="text-sm font-medium">{t("manager.courseBuilder.programInfo", "Program Information")}</p>
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
                <p className="text-sm font-medium">{t("manager.courseBuilder.addCourses", "Select Courses")}</p>
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
                <p className="text-sm font-medium">{t("manager.courseBuilder.programDetails", "Confirmation")}</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {t("manager.courseBuilder.step", "Step")} {currentStep} {t("manager.courseBuilder.of", "of")} {totalSteps}
          </div>
        </div>

        {/* Step 1: Program Information */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.courseBuilder.programInfo", "Program Information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="semester">{t("manager.courseBuilder.semester", "Semester")}</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={formData.semester} onValueChange={(value) => handleSelectChange("semester", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("manager.courseBuilder.selectSemester", "Select a semester")} />
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
                  <Label htmlFor="year">{t("manager.courseBuilder.year", "Year")}</Label>
                  {isLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={formData.year} onValueChange={(value) => handleSelectChange("year", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("manager.courseBuilder.selectYear", "Select a year")} />
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
              </div>

              <div className="space-y-2">
                <Label>{t("manager.courseBuilder.namePreview", "Name Preview")}</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="p-3 bg-muted rounded-md">{generateProgramName()}</div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.courseBuilder.selectionRules", "Selection Rules")}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxSelections">{t("manager.courseBuilder.maxSelections", "Max Selections")}</Label>
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
                      {t("manager.courseBuilder.coursesPerStudent", "Maximum number of courses a student can select")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t("manager.courseBuilder.deadline", "Deadline")}</Label>
                    <Input id="endDate" name="endDate" type="date" value={formData.endDate} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">{t("manager.courseBuilder.syllabusUpload", "Syllabus Upload")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "manager.courseBuilder.syllabusDescription",
                    "Upload a syllabus template for students to reference",
                  )}
                </p>

                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="syllabus-file"
                    className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {t("manager.courseBuilder.uploadSyllabusFile", "Upload Syllabus File")}
                  </Label>
                  <Input
                    id="syllabus-file"
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
              <CardTitle>{t("manager.courseBuilder.addCourses", "Select Courses")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("manager.courseBuilder.searchCourses", "Search courses...")}
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{selectedCourses.length}</span>{" "}
                  {t("manager.courseBuilder.coursesSelected", "courses selected")}
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{t("manager.courseBuilder.courseName", "Course Name")}</TableHead>
                      <TableHead>{t("manager.courseBuilder.instructor", "Instructor")}</TableHead>
                      <TableHead>{t("manager.courseBuilder.maxStudents", "Max Students")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCourses ? (
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
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredCourses.length > 0 ? (
                      filteredCourses.map((course) => (
                        <TableRow
                          key={course.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleCourse(course.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedCourses.includes(course.id)}
                              onCheckedChange={() => toggleCourse(course.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{getLocalizedName(course)}</TableCell>
                          <TableCell>{getLocalizedInstructor(course)}</TableCell>
                          <TableCell>{course.max_students}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          {courses.length === 0
                            ? t("manager.courseBuilder.noCoursesAvailable", "No courses available")
                            : t("manager.courseBuilder.noCoursesFound", "No courses found")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  {t("manager.courseBuilder.back", "Back")}
                </Button>
                <Button type="button" onClick={handleNextStep} disabled={isLoadingCourses}>
                  {t("manager.courseBuilder.next", "Next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("manager.courseBuilder.programDetails", "Program Details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Program details in a single row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.courseBuilder.programName", "Program Name")}
                  </h3>
                  <p className="text-lg">{generateProgramName()}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.courseBuilder.maxSelectionsLabel", "Max Selections")}
                  </h3>
                  <p className="text-lg">{formData.maxSelections}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    {t("manager.courseBuilder.deadline", "Deadline")}
                  </h3>
                  <p className="text-lg">{formData.endDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  {t("manager.courseBuilder.selectedCourses", "Selected Courses")}
                </h3>

                {selectedCourses.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("manager.courseBuilder.courseName", "Course Name")}</TableHead>
                          <TableHead>{t("manager.courseBuilder.instructor", "Instructor")}</TableHead>
                          <TableHead>{t("manager.courseBuilder.maxStudents", "Max Students")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses
                          .filter((course) => selectedCourses.includes(course.id))
                          .map((course) => (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium">{getLocalizedName(course)}</TableCell>
                              <TableCell>{getLocalizedInstructor(course)}</TableCell>
                              <TableCell>{course.max_students}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-md">
                    <h3 className="text-lg font-medium mb-2">
                      {t("manager.courseBuilder.noCoursesSelected", "No courses selected")}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {t("manager.courseBuilder.goBackToAdd", "Go back to add courses")}
                    </p>
                    <Button variant="outline" onClick={handlePrevStep}>
                      {t("manager.courseBuilder.back", "Back")}
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={handlePrevStep}>
                  {t("manager.courseBuilder.back", "Back")}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleSaveAsDraft} disabled={isSubmitting}>
                    {isSubmitting
                      ? t("manager.courseBuilder.saving", "Saving...")
                      : t("manager.courseBuilder.saveAsDraft", "Save as Draft")}
                  </Button>
                  <Button type="button" onClick={handlePublish} disabled={isSubmitting}>
                    {isSubmitting
                      ? t("manager.courseBuilder.publishing", "Publishing...")
                      : t("manager.courseBuilder.publishProgram", "Publish Program")}
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
