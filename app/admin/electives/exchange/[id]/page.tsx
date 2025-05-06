"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, ElectivePackStatus, SelectionStatus } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  Edit,
  Eye,
  MoreVertical,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useDataCache } from "@/lib/data-cache-context"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"

interface ExchangeProgramDetailPageProps {
  params: {
    id: string
  }
}

export default function AdminExchangeDetailPage({ params }: ExchangeProgramDetailPageProps) {
  // State for loading
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // State for dialog
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editedUniversities, setEditedUniversities] = useState<string[]>([])

  // Add the language hook near the top of the component
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { getCachedData, setCachedData, invalidateCache } = useDataCache()
  const { institution } = useInstitution()

  // State for exchange program data
  const [exchangeProgram, setExchangeProgram] = useState<any>(null)
  const [universities, setUniversities] = useState<any[]>([])
  const [studentSelections, setStudentSelections] = useState<any[]>([])

  // Fetch exchange program data
  useEffect(() => {
    const fetchExchangeProgramData = async () => {
      if (!institution?.id) return

      try {
        // Try to get from cache first
        const cacheKey = `exchangeProgram-${params.id}`
        const cachedData = getCachedData<any>(cacheKey, institution.id)

        if (cachedData) {
          setExchangeProgram(cachedData.exchangeProgram)
          setUniversities(cachedData.universities)
          setStudentSelections(cachedData.studentSelections)
          setIsLoading(false)
          return
        }

        // Fetch from Supabase if not in cache
        const { data: packData, error: packError } = await supabase
          .from("elective_packs")
          .select("*")
          .eq("id", params.id)
          .eq("institution_id", institution.id)
          .eq("type", "exchange")
          .single()

        if (packError) {
          throw packError
        }

        // Fetch universities for this exchange program
        const { data: universitiesData, error: universitiesError } = await supabase
          .from("exchange_universities")
          .select("*")
          .eq("pack_id", params.id)

        if (universitiesError) {
          throw universitiesError
        }

        // Fetch student selections for this exchange program
        const { data: selectionsData, error: selectionsError } = await supabase
          .from("student_selections")
          .select(`
            id,
            student_id,
            selection_date,
            status,
            statement_file,
            selected_universities,
            profiles(
              id,
              full_name,
              email,
              student_id,
              group
            )
          `)
          .eq("pack_id", params.id)

        if (selectionsError) {
          throw selectionsError
        }

        // Format student selections data
        const formattedSelections = selectionsData.map((selection) => ({
          id: selection.id,
          studentName: selection.profiles.full_name,
          studentId: selection.profiles.student_id,
          group: selection.profiles.group,
          program: "Management", // This would need to be fetched from the database
          email: selection.profiles.email,
          selectedUniversities: selection.selected_universities || [],
          selectionDate: selection.selection_date,
          status: selection.status,
          statementFile: selection.statement_file,
        }))

        // Set state with fetched data
        setExchangeProgram(packData)
        setUniversities(universitiesData)
        setStudentSelections(formattedSelections)

        // Cache the data
        setCachedData(cacheKey, institution.id, {
          exchangeProgram: packData,
          universities: universitiesData,
          studentSelections: formattedSelections,
        })
      } catch (error) {
        console.error("Error fetching exchange program data:", error)
        toast({
          title: t("admin.electives.fetchError", "Failed to fetch exchange program data"),
          description: t(
            "admin.electives.fetchErrorDesc",
            "There was an error fetching the exchange program data. Please try again.",
          ),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchExchangeProgramData()
  }, [params.id, institution?.id, getCachedData, setCachedData, supabase, toast, t])

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

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper function to get status badge
  const getStatusBadge = (status: ElectivePackStatus) => {
    switch (status) {
      case ElectivePackStatus.DRAFT:
        return <Badge variant="outline">{t("manager.status.draft")}</Badge>
      case ElectivePackStatus.PUBLISHED:
        return <Badge variant="secondary">{t("manager.status.published")}</Badge>
      case ElectivePackStatus.CLOSED:
        return <Badge variant="destructive">{t("manager.status.closed")}</Badge>
      case ElectivePackStatus.ARCHIVED:
        return <Badge variant="default">{t("manager.status.archived")}</Badge>
      default:
        return null
    }
  }

  // Helper function to get selection status badge
  const getSelectionStatusBadge = (status: SelectionStatus) => {
    switch (status) {
      case SelectionStatus.APPROVED:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.approved")}
          </Badge>
        )
      case SelectionStatus.PENDING:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.pending")}
          </Badge>
        )
      case SelectionStatus.REJECTED:
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200">
            <XCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.rejected")}
          </Badge>
        )
      default:
        return null
    }
  }

  // Function to open view dialog with student details
  const openViewDialog = (student: any) => {
    setSelectedStudent(student)
    setViewDialogOpen(true)
  }

  // Function to open edit dialog with student details
  const openEditDialog = (student: any) => {
    setSelectedStudent(student)
    setEditedUniversities([...student.selectedUniversities])
    setEditDialogOpen(true)
  }

  // Function to handle university selection in edit dialog
  const handleUniversitySelection = (universityName: string, checked: boolean) => {
    if (!exchangeProgram) return

    if (checked) {
      // Add university if it's not already selected and we haven't reached the max
      if (!editedUniversities.includes(universityName) && editedUniversities.length < exchangeProgram.max_selections) {
        setEditedUniversities([...editedUniversities, universityName])
      }
    } else {
      // Remove university if it's selected
      setEditedUniversities(editedUniversities.filter((name) => name !== universityName))
    }
  }

  // Function to save edited universities
  const saveEditedUniversities = async () => {
    if (!selectedStudent) return
    setIsUpdating(true)

    try {
      // Update the selection in the database
      const { error } = await supabase
        .from("student_selections")
        .update({
          selected_universities: editedUniversities,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedStudent.id)

      if (error) {
        throw error
      }

      // Update local state
      setStudentSelections((prev) =>
        prev.map((selection) =>
          selection.id === selectedStudent.id ? { ...selection, selectedUniversities: editedUniversities } : selection,
        ),
      )

      // Invalidate cache
      if (institution?.id) {
        const cacheKey = `exchangeProgram-${params.id}`
        invalidateCache(cacheKey, institution.id)
      }

      // Close dialog
      setEditDialogOpen(false)

      // Show success toast
      toast({
        title: t("toast.selection.updated"),
        description: t("toast.selection.updated.exchange.description").replace("{0}", selectedStudent.studentName),
      })
    } catch (error) {
      console.error("Error updating selection:", error)
      toast({
        title: t("toast.selection.updateError", "Failed to update selection"),
        description: t(
          "toast.selection.updateErrorDesc",
          "There was an error updating the selection. Please try again.",
        ),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // Function to export university to CSV
  const exportUniversityToCSV = (university: any) => {
    // Define column headers based on language
    const headers = {
      en: ["Name", "Location", "Language", "Enrollment", "Programs"],
      ru: ["Название", "Местоположение", "Язык", "Зачисление", "Программы"],
    }

    // Create CSV content
    let universityContent = headers[language as keyof typeof headers].map((header) => `"${header}"`).join(",") + "\n"

    // Add data row
    const location = `${university.city}, ${university.country}`
    const enrollment = `${university.current_students || 0}/${university.max_students || 0}`
    const programs = university.programs ? university.programs.join("; ") : ""

    // Escape fields that might contain commas
    const row = [
      `"${university.name_en}"`,
      `"${location}"`,
      `"${university.language || ""}"`,
      `"${enrollment}"`,
      `"${programs}"`,
    ]

    universityContent += row.join(",") + "\n"

    // Create and download the file
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), universityContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fileName = `university_${university.name_en.replace(/\s+/g, "_")}_${language}.csv`

    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to download student statement
  const downloadStudentStatement = async (studentName: string, fileName: string | null) => {
    if (!fileName) {
      toast({
        title: t("toast.statement.notAvailable"),
        description: t("toast.statement.notAvailable.description").replace("{0}", studentName),
      })
      return
    }

    try {
      // In a real implementation, you would download the file from storage
      // For this demo, we'll just show a toast
      toast({
        title: t("toast.statement.download.success"),
        description: t("toast.statement.download.success.description"),
      })
    } catch (error) {
      console.error("Error downloading statement:", error)
      toast({
        title: t("toast.statement.downloadError", "Failed to download statement"),
        description: t(
          "toast.statement.downloadErrorDesc",
          "There was an error downloading the statement. Please try again.",
        ),
        variant: "destructive",
      })
    }
  }

  // Function to export student selections to CSV
  const exportStudentSelectionsToCSV = () => {
    // Define column headers based on language
    const headers = {
      en: [
        "Student Name",
        "Student ID",
        "Group",
        "Program",
        "Email",
        "Selected Universities",
        "Selection Date",
        "Status",
        "Statement",
      ],
      ru: [
        "Имя студента",
        "ID студента",
        "Группа",
        "Программа",
        "Электронная почта",
        "Выбранные университеты",
        "Дата выбора",
        "Статус",
        "Заявление",
      ],
    }

    // Status translations
    const statusTranslations = {
      en: {
        [SelectionStatus.APPROVED]: "Approved",
        [SelectionStatus.PENDING]: "Pending",
        [SelectionStatus.REJECTED]: "Rejected",
      },
      ru: {
        [SelectionStatus.APPROVED]: "Утверждено",
        [SelectionStatus.PENDING]: "На рассмотрении",
        [SelectionStatus.REJECTED]: "Отклонено",
      },
    }

    // Create CSV content
    let selectionsContent = headers[language as keyof typeof headers].map((header) => `"${header}"`).join(",") + "\n"

    // Add data rows
    studentSelections.forEach((selection) => {
      const selectedUniversities = selection.selectedUniversities.join("; ")
      const status = statusTranslations[language as keyof typeof statusTranslations][selection.status]

      // Format date properly
      const formattedDate = formatDate(selection.selectionDate)

      // Create a download link for the statement if available
      const statementLink = selection.statementFile
        ? `${window.location.origin}/api/statements/${selection.statementFile}`
        : language === "ru"
          ? "Не загружено"
          : "Not uploaded"

      // Properly escape all fields with quotes to ensure correct column alignment
      const row = [
        `"${selection.studentName}"`,
        `"${selection.studentId}"`,
        `"${selection.group}"`,
        `"${selection.program}"`,
        `"${selection.email}"`,
        `"${selectedUniversities}"`,
        `"${formattedDate}"`,
        `"${status}"`,
        `"${statementLink}"`,
      ]

      selectionsContent += row.join(",") + "\n"
    })

    // Create and download the file
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), selectionsContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fileName = `student_selections_${exchangeProgram?.name_en.replace(/\s+/g, "_") || "exchange_program"}_${language}.csv`

    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Function to update student selection status
  const updateSelectionStatus = async (studentId: string, newStatus: SelectionStatus) => {
    setIsUpdating(true)

    try {
      // Update the selection status in the database
      const { error } = await supabase
        .from("student_selections")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)

      if (error) {
        throw error
      }

      // Update local state
      setStudentSelections((prev) =>
        prev.map((selection) => (selection.id === studentId ? { ...selection, status: newStatus } : selection)),
      )

      // Invalidate cache
      if (institution?.id) {
        const cacheKey = `exchangeProgram-${params.id}`
        invalidateCache(cacheKey, institution.id)
      }

      // Show success toast
      const student = studentSelections.find((s) => s.id === studentId)
      const statusMessage =
        newStatus === SelectionStatus.APPROVED
          ? t("toast.selection.approved", "Selection approved")
          : newStatus === SelectionStatus.REJECTED
            ? t("toast.selection.rejected", "Selection rejected")
            : t("toast.selection.withdrawn", "Selection withdrawn")

      toast({
        title: statusMessage,
        description: t("toast.selection.statusChanged", "The selection status for {0} has been updated.").replace(
          "{0}",
          student?.studentName || "",
        ),
      })
    } catch (error) {
      console.error("Error updating selection status:", error)
      toast({
        title: t("toast.selection.updateError", "Failed to update selection"),
        description: t(
          "toast.selection.updateErrorDesc",
          "There was an error updating the selection. Please try again.",
        ),
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setViewDialogOpen(false) // Close dialog if open
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.ADMIN}>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Link href="/admin/electives?tab=exchange">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <Skeleton className="h-9 w-64" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-24" />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="universities">
            <TabsList>
              <TabsTrigger value="universities">{t("manager.exchangeDetails.universitiesTab")}</TabsTrigger>
              <TabsTrigger value="students">{t("manager.exchangeDetails.studentsTab")}</TabsTrigger>
            </TabsList>
            <TabsContent value="universities" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className="h-6 w-48" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.exchangeDetails.name")}
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.exchangeDetails.location")}
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.exchangeDetails.language")}
                          </th>
                          <th className="py-3 px-4 text-left text-sm font-medium">
                            {t("manager.exchangeDetails.enrollment")}
                          </th>
                          <th className="py-3 px-4 text-center text-sm font-medium">
                            {t("manager.exchangeDetails.export")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3, 4].map((i) => (
                          <tr key={i} className="border-b">
                            <td className="py-3 px-4 text-sm">
                              <Skeleton className="h-5 w-32" />
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Skeleton className="h-5 w-24" />
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Skeleton className="h-5 w-20" />
                            </td>
                            <td className="py-3 px-4 text-sm">
                              <Skeleton className="h-5 w-16" />
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <Skeleton className="h-5 w-24 mx-auto" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.ADMIN}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/admin/electives?tab=exchange">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {exchangeProgram?.name_en || getExchangeProgramName(params.id)}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {exchangeProgram && getStatusBadge(exchangeProgram.status as ElectivePackStatus)}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("manager.exchangeDetails.programDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.selectionPeriod")}:</dt>
                <dd>
                  {formatDate(exchangeProgram?.start_date)} - {formatDate(exchangeProgram?.end_date)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.maxSelections")}:</dt>
                <dd>
                  {exchangeProgram?.max_selections} {t("manager.exchangeDetails.universities")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.universities")}:</dt>
                <dd>{universities?.length || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.studentsEnrolled")}:</dt>
                <dd>{studentSelections?.length || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.created")}:</dt>
                <dd>{formatDate(exchangeProgram?.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.status")}:</dt>
                <dd>{t(`manager.status.${(exchangeProgram?.status || "").toLowerCase()}`)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Tabs defaultValue="universities">
          <TabsList>
            <TabsTrigger value="universities">{t("manager.exchangeDetails.universitiesTab")}</TabsTrigger>
            <TabsTrigger value="students">{t("manager.exchangeDetails.studentsTab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="universities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("manager.exchangeDetails.universitiesTab")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.exchangeDetails.name")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeDetails.location")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeDetails.language")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeDetails.enrollment")}
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium">
                          {t("manager.exchangeDetails.export")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {universities.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">
                            {t(
                              "manager.exchangeDetails.noUniversities",
                              "No universities found for this exchange program.",
                            )}
                          </td>
                        </tr>
                      ) : (
                        universities.map((university) => (
                          <tr key={university.id} className="border-b">
                            <td className="py-3 px-4 text-sm">{university.name_en}</td>
                            <td className="py-3 px-4 text-sm">
                              {university.city_en}, {university.country}
                            </td>
                            <td className="py-3 px-4 text-sm">{university.language || "English"}</td>
                            <td className="py-3 px-4 text-sm">
                              <Badge
                                variant={
                                  (university.current_students || 0) >= (university.max_students || 0)
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {university.current_students || 0}/{university.max_students || 5}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportUniversityToCSV(university)}
                                className="flex mx-auto"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                {t("manager.exchangeDetails.download")}
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("manager.exchangeDetails.studentSelections")}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="search"
                      placeholder={t("manager.exchangeDetails.searchStudents")}
                      className="h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-[200px]"
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={exportStudentSelectionsToCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("manager.exchangeDetails.exportAll")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="py-3 px-4 text-left text-sm font-medium">{t("manager.exchangeDetails.name")}</th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeDetails.group")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeDetails.selectionDate")}
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium">
                          {t("manager.exchangeDetails.status")}
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium">{t("statement")}</th>
                        <th className="py-3 px-4 text-center text-sm font-medium">
                          {t("manager.exchangeDetails.view")}
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium">
                          {t("manager.exchangeDetails.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentSelections.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-muted-foreground">
                            {t(
                              "manager.exchangeDetails.noStudents",
                              "No student selections found for this exchange program.",
                            )}
                          </td>
                        </tr>
                      ) : (
                        studentSelections.map((selection) => (
                          <tr key={selection.id} className="border-b">
                            <td className="py-3 px-4 text-sm">{selection.studentName}</td>
                            <td className="py-3 px-4 text-sm">{selection.group}</td>
                            <td className="py-3 px-4 text-sm">{formatDate(selection.selectionDate)}</td>
                            <td className="py-3 px-4 text-sm">{getSelectionStatusBadge(selection.status)}</td>
                            <td className="py-3 px-4 text-sm text-center">
                              {selection.statementFile ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    downloadStudentStatement(selection.studentName, selection.statementFile)
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <Button variant="ghost" size="icon" onClick={() => openViewDialog(selection)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="py-3 px-4 text-sm text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditDialog(selection)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t("manager.exchangeDetails.edit")}
                                  </DropdownMenuItem>
                                  {selection.status === SelectionStatus.PENDING && (
                                    <>
                                      <DropdownMenuItem
                                        className="text-green-600"
                                        onClick={() => updateSelectionStatus(selection.id, SelectionStatus.APPROVED)}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {t("manager.exchangeDetails.approve")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => updateSelectionStatus(selection.id, SelectionStatus.REJECTED)}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {t("manager.exchangeDetails.reject")}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {selection.status === SelectionStatus.APPROVED && (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => updateSelectionStatus(selection.id, SelectionStatus.REJECTED)}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      {t("manager.exchangeDetails.withdraw")}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Student Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>{t("manager.exchangeDetails.studentDetails")}</DialogTitle>
                <DialogDescription>
                  {t("manager.exchangeDetails.viewDetailsFor")} {selectedStudent.studentName}
                  {t("manager.exchangeDetails.exchangeSelection")}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">{t("manager.exchangeDetails.studentInformation")}</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.name")}:</span>
                        <span>{selectedStudent.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.id")}:</span>
                        <span>{selectedStudent.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.email")}:</span>
                        <span>{selectedStudent.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.group")}:</span>
                        <span>{selectedStudent.group}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.program")}:</span>
                        <span>{selectedStudent.program}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{t("manager.exchangeDetails.selectedUniversities")}</h3>
                    <div className="mt-2 space-y-2">
                      {selectedStudent.selectedUniversities.map((university: string, index: number) => {
                        const universityData = universities.find((u) => u.name_en === university)
                        return (
                          <div key={index} className="rounded-md border p-2">
                            <p className="font-medium">{university}</p>
                            {universityData && (
                              <p className="text-xs text-muted-foreground">
                                {universityData.city_en}, {universityData.country}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{t("manager.exchangeDetails.selectionInformation")}</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.date")}:</span>
                        <span>{formatDate(selectedStudent.selectionDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.status")}:</span>
                        <span>{getSelectionStatusBadge(selectedStudent.status)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statement File Section */}
                  <div>
                    <h3 className="text-sm font-medium">{t("statementFile")}</h3>
                    <div className="mt-2">
                      {selectedStudent.statementFile ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2"
                          onClick={() =>
                            downloadStudentStatement(selectedStudent.studentName, selectedStudent.statementFile)
                          }
                        >
                          <Download className="h-4 w-4" />
                          {t("downloadStatement")}
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">No statement file uploaded yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Digital Authorization Section */}
                  <div className="mt-4">
                    <h3 className="text-sm font-medium">{t("student.authorization.title")}</h3>
                    <div className="mt-2">
                      <p className="text-sm">
                        <span className="font-medium">{t("student.authorization.authorizedBy")}</span>{" "}
                        {selectedStudent.studentName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                {selectedStudent.status === SelectionStatus.PENDING && (
                  <>
                    <Button
                      variant="outline"
                      className="mr-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                      onClick={() => updateSelectionStatus(selectedStudent.id, SelectionStatus.APPROVED)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {t("manager.exchangeDetails.approve")}
                    </Button>
                    <Button
                      variant="outline"
                      className="mr-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                      onClick={() => updateSelectionStatus(selectedStudent.id, SelectionStatus.REJECTED)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="mr-2 h-4 w-4" />
                      )}
                      {t("manager.exchangeDetails.reject")}
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  {t("manager.exchangeDetails.close")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Student Selection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>{t("manager.exchangeDetails.editStudentSelection")}</DialogTitle>
                <DialogDescription>
                  {t("manager.exchangeDetails.editSelectionFor")} {selectedStudent.studentName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">{t("manager.exchangeDetails.studentInformation")}</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.name")}:</span>
                        <span>{selectedStudent.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.group")}:</span>
                        <span>{selectedStudent.group}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.program")}:</span>
                        <span>{selectedStudent.program}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{t("manager.exchangeDetails.editUniversities")}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("manager.exchangeDetails.selectUpTo")} {exchangeProgram?.max_selections || 2}{" "}
                      {t("manager.exchangeDetails.universities")}
                    </p>
                    <div className="mt-3 space-y-3">
                      {universities.map((university) => (
                        <div key={university.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`university-${university.id}`}
                            checked={editedUniversities.includes(university.name_en)}
                            onCheckedChange={(checked) =>
                              handleUniversitySelection(university.name_en, checked as boolean)
                            }
                            disabled={
                              !editedUniversities.includes(university.name_en) &&
                              editedUniversities.length >= (exchangeProgram?.max_selections || 2)
                            }
                          />
                          <Label
                            htmlFor={`university-${university.id}`}
                            className={
                              !editedUniversities.includes(university.name_en) &&
                              editedUniversities.length >= (exchangeProgram?.max_selections || 2)
                                ? "text-muted-foreground"
                                : ""
                            }
                          >
                            {university.name_en}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({university.city_en}, {university.country})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isUpdating}>
                  {t("manager.exchangeDetails.cancel")}
                </Button>
                <Button onClick={saveEditedUniversities} disabled={editedUniversities.length === 0 || isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("manager.exchangeDetails.saving", "Saving...")}
                    </>
                  ) : (
                    t("manager.exchangeDetails.saveChanges")
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Toast component */}
      <Toaster />
    </DashboardLayout>
  )
}
