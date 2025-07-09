"use client"

import { DialogClose } from "@/components/ui/dialog"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
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
import { ArrowLeft, Edit, Eye, MoreVertical, Search, CheckCircle, XCircle, Clock, Download } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  getExchangeProgram,
  getExchangeProgramUniversities,
  getExchangeSelections,
  getUniversitySelectionData,
  downloadStatementFile,
} from "@/actions/exchange-program-details"

interface ExchangeProgramDetailPageProps {
  params: {
    id: string
  }
}

interface ExchangeProgram {
  id: string
  name: string
  name_ru: string | null
  description: string | null
  description_ru: string | null
  deadline: string
  max_selections: number
  status: string
  universities: string[]
  created_at: string
  updated_at: string
}

interface University {
  id: string
  name: string
  name_ru: string | null
  country: string
  city: string
  language: string | null
  max_students: number
  website: string | null
  description: string | null
  description_ru: string | null
  status: string
  countries?: {
    name: string
    name_ru: string | null
  }
}

interface StudentSelection {
  id: string
  selected_universities: string[]
  statement_url: string | null
  status: string
  created_at: string
  profiles: {
    id: string
    full_name: string | null
    email: string
    student_profiles:
      | {
          enrollment_year: string
          groups: {
            name: string
            display_name: string
            programs: {
              name: string
              name_ru: string | null
            }
          } | null
        }[]
      | null
  } | null
}

export default function ExchangeDetailPage({ params }: ExchangeProgramDetailPageProps) {
  const [exchangeProgram, setExchangeProgram] = useState<ExchangeProgram | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [studentSelections, setStudentSelections] = useState<StudentSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const { t, language } = useLanguage()
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load exchange program
      const program = await getExchangeProgram(params.id)
      setExchangeProgram(program)

      // Load universities
      if (program.universities && program.universities.length > 0) {
        const universitiesData = await getExchangeProgramUniversities(program.universities)
        setUniversities(universitiesData)
      }

      // Load student selections
      const selections = await getExchangeSelections(params.id)
      setStudentSelections(selections)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: t("error"),
        description: "Failed to load exchange program data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate enrollment count for each university
  const getUniversityEnrollment = (universityId: string) => {
    return studentSelections.filter(
      (selection) =>
        selection.selected_universities.includes(universityId) &&
        (selection.status === "approved" || selection.status === "pending"),
    ).length
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">{t("manager.status.draft")}</Badge>
      case "published":
        return <Badge variant="secondary">{t("manager.status.published")}</Badge>
      case "closed":
        return <Badge variant="destructive">{t("manager.status.closed")}</Badge>
      case "archived":
        return <Badge variant="default">{t("manager.status.archived")}</Badge>
      default:
        return null
    }
  }

  // Helper function to get selection status badge
  const getSelectionStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.approved")}
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            {t("manager.exchangeDetails.pending")}
          </Badge>
        )
      case "rejected":
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

  // Function to open dialog with student details
  const openStudentDialog = (student: any) => {
    setSelectedStudent(student)
    setDialogOpen(true)
  }

  // Add a new state for the edit dialog
  const openEditDialog = (student: any) => {
    setStudentToEdit({
      ...student,
      // Create a copy of the selected universities for editing
      editedUniversities: [...student.selectedUniversities],
    })
    setEditDialogOpen(true)
  }

  // Clean up function to ensure dialogs are properly closed
  useEffect(() => {
    return () => {
      setDialogOpen(false)
      setEditDialogOpen(false)
    }
  }, [])

  // Replace the exportUniversityToCSV function with this improved version
  // Function to export university selection data to CSV
  const exportUniversityToCSV = async (university: University) => {
    try {
      const selectionData = await getUniversitySelectionData(university.id, params.id)

      // Define column headers based on language
      const headers = {
        en: ["Student Name", "Email", "Group", "Program", "Status", "Selection Date"],
        ru: ["Имя студента", "Электронная почта", "Группа", "Программа", "Статус", "Дата выбора"],
      }

      // Create CSV content
      let csvContent = headers[language as keyof typeof headers].map((header) => `"${header}"`).join(",") + "\n"

      // Add data rows
      selectionData.forEach((selection) => {
        const student = selection.profiles
        const group = student?.student_profiles?.[0]?.groups
        const program = group?.programs

        const translatedStatus =
          language === "ru"
            ? selection.status === "approved"
              ? "Утверждено"
              : selection.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : selection.status

        const row = [
          `"${student?.full_name || "N/A"}"`,
          `"${student?.email || "N/A"}"`,
          `"${group?.display_name || "N/A"}"`,
          `"${language === "ru" && program?.name_ru ? program.name_ru : program?.name || "N/A"}"`,
          `"${translatedStatus}"`,
          `"${formatDate(selection.created_at)}"`,
        ]

        csvContent += row.join(",") + "\n"
      })

      // Create and download the file
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const fileName = `university_${university.name.replace(/\s+/g, "_")}_selections_${language}.csv`

      link.setAttribute("href", url)
      link.setAttribute("download", fileName)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t("success"),
        description: `University selection data exported successfully`,
      })
    } catch (error) {
      console.error("Error exporting university data:", error)
      toast({
        title: t("error"),
        description: "Failed to export university data",
        variant: "destructive",
      })
    }
  }

  // Function to download student statement
  const downloadStudentStatement = async (studentName: string, statementUrl: string | null) => {
    if (!statementUrl) {
      toast({
        title: t("toast.statement.notAvailable"),
        description: `No statement file available for ${studentName}`,
      })
      return
    }

    try {
      const fileData = await downloadStatementFile(statementUrl)

      // Create blob and download
      const blob = new Blob([fileData], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      link.setAttribute("href", url)
      link.setAttribute("download", `${studentName.replace(/\s+/g, "_")}_statement.pdf`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t("toast.statement.download.success"),
        description: t("toast.statement.download.success.description"),
      })
    } catch (error) {
      console.error("Error downloading statement:", error)
      toast({
        title: t("error"),
        description: "Failed to download statement file",
        variant: "destructive",
      })
    }
  }

  // Replace the exportStudentSelectionsToCSV function with this improved version
  // Function to export all student selections to CSV
  const exportStudentSelectionsToCSV = () => {
    // Create CSV header with translated column names
    const csvHeader = `"${language === "ru" ? "Имя студента" : "Student Name"}","${language === "ru" ? "Электронная почта" : "Email"}","${language === "ru" ? "Группа" : "Group"}","${language === "ru" ? "Программа" : "Program"}","${language === "ru" ? "Выбранные университеты" : "Selected Universities"}","${language === "ru" ? "Дата выбора" : "Selection Date"}","${language === "ru" ? "Статус" : "Status"}","${language === "ru" ? "Заявление" : "Statement"}"\n`

    // Create CSV content with translated status
    const selectionsContent = studentSelections
      .map((selection) => {
        const student = selection.profiles
        const group = student?.student_profiles?.[0]?.groups
        const program = group?.programs

        // Get university names for selected universities
        const selectedUniversityNames = selection.selected_universities
          .map((id) => {
            const university = universities.find((u) => u.id === id)
            return university
              ? language === "ru" && university.name_ru
                ? university.name_ru
                : university.name
              : "Unknown"
          })
          .join("; ")

        // Translate status based on current language
        const translatedStatus =
          language === "ru"
            ? selection.status === "approved"
              ? "Утверждено"
              : selection.status === "pending"
                ? "На рассмотрении"
                : "Отклонено"
            : selection.status

        // Statement availability
        const statementStatus = selection.statement_url
          ? language === "ru"
            ? "Загружено"
            : "Uploaded"
          : language === "ru"
            ? "Не загружено"
            : "Not uploaded"

        // Escape fields that might contain commas
        return `"${student?.full_name || "N/A"}","${student?.email || "N/A"}","${group?.display_name || "N/A"}","${language === "ru" && program?.name_ru ? program.name_ru : program?.name || "N/A"}","${selectedUniversityNames}","${formatDate(selection.created_at)}","${translatedStatus}","${statementStatus}"`
      })
      .join("\n")

    // Combine header and content
    const csv = csvHeader + selectionsContent

    // Create and download the file
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    const fileName = `student_selections_${exchangeProgram?.name.replace(/\s+/g, "_")}_${language}.csv`

    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Add this function before the return statement
  // Function to handle saving edited student selection
  const saveStudentSelection = () => {
    // In a real application, this would make an API call to update the database
    console.log("Saving edited selection for student:", studentToEdit)

    // Update the local state for demo purposes
    const updatedSelections = studentSelections.map((student) =>
      student.id === studentToEdit.id
        ? { ...student, selectedUniversities: studentToEdit.editedUniversities }
        : student,
    )

    // Close the dialog
    setEditDialogOpen(false)

    // Show toast notification with translated messages
    window.setTimeout(() => {
      toast({
        title: t("toast.selection.updated"),
        description: t("toast.selection.updated.exchange.description").replace("{0}", studentToEdit.studentName),
      })
    }, 100)
  }

  // Filter students based on search term
  const filteredStudentSelections = studentSelections.filter((selection) => {
    const student = selection.profiles
    const group = student?.student_profiles?.[0]?.groups
    const searchLower = searchTerm.toLowerCase()

    return (
      student?.full_name?.toLowerCase().includes(searchLower) ||
      student?.email?.toLowerCase().includes(searchLower) ||
      group?.display_name?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!exchangeProgram) {
    return (
      <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Exchange program not found</h1>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.PROGRAM_MANAGER}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/manager/electives/exchange">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {language === "ru" && exchangeProgram.name_ru ? exchangeProgram.name_ru : exchangeProgram.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(exchangeProgram.status)}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/manager/electives/exchange/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t("manager.exchangeDetails.edit")}
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("manager.exchangeDetails.programDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.deadline")}:</dt>
                <dd>{formatDate(exchangeProgram.deadline)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.maxSelections")}:</dt>
                <dd>
                  {exchangeProgram.max_selections} {t("manager.exchangeDetails.universities")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.universities")}:</dt>
                <dd>{universities.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.studentsEnrolled")}:</dt>
                <dd>{studentSelections.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.created")}:</dt>
                <dd>{formatDate(exchangeProgram.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">{t("manager.exchangeDetails.status")}:</dt>
                <dd>{t(`manager.status.${exchangeProgram.status.toLowerCase()}`)}</dd>
              </div>
              {exchangeProgram.description && (
                <div className="flex flex-col gap-1">
                  <dt className="font-medium">{t("manager.exchangeDetails.description")}:</dt>
                  <dd className="text-sm text-muted-foreground">
                    {language === "ru" && exchangeProgram.description_ru
                      ? exchangeProgram.description_ru
                      : exchangeProgram.description}
                  </dd>
                </div>
              )}
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
                      {universities.map((university) => {
                        const currentEnrollment = getUniversityEnrollment(university.id)
                        return (
                          <tr key={university.id} className="border-b">
                            <td className="py-3 px-4 text-sm">
                              {language === "ru" && university.name_ru ? university.name_ru : university.name}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {university.city}, {university.countries?.name || university.country}
                            </td>
                            <td className="py-3 px-4 text-sm">{university.language || "-"}</td>
                            <td className="py-3 px-4 text-sm">
                              <Badge
                                variant={currentEnrollment >= university.max_students ? "destructive" : "secondary"}
                              >
                                {currentEnrollment}/{university.max_students}
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
                        )
                      })}
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                      {filteredStudentSelections.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">
                            {searchTerm ? "No students found matching your search" : "No student selections yet"}
                          </td>
                        </tr>
                      ) : (
                        filteredStudentSelections.map((selection) => {
                          const student = selection.profiles
                          const group = student?.student_profiles?.[0]?.groups
                          const program = group?.programs

                          return (
                            <tr key={selection.id} className="border-b">
                              <td className="py-3 px-4 text-sm">{student?.full_name || "N/A"}</td>
                              <td className="py-3 px-4 text-sm">{group?.display_name || "N/A"}</td>
                              <td className="py-3 px-4 text-sm">{formatDate(selection.created_at)}</td>
                              <td className="py-3 px-4 text-sm">{getSelectionStatusBadge(selection.status)}</td>
                              <td className="py-3 px-4 text-sm text-center">
                                {selection.statement_url ? (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      downloadStudentStatement(student?.full_name || "Student", selection.statement_url)
                                    }
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-center">
                                <Button variant="ghost" size="icon" disabled>
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
                                    <DropdownMenuItem disabled>
                                      <Edit className="mr-2 h-4 w-4" />
                                      {t("manager.exchangeDetails.edit")}
                                    </DropdownMenuItem>
                                    {selection.status === "pending" && (
                                      <>
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() => {
                                            toast({
                                              title: t("toast.selection.approved"),
                                              description: `Selection approved for ${student?.full_name}`,
                                            })
                                          }}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.approve")}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => {
                                            toast({
                                              title: t("toast.selection.rejected"),
                                              description: `Selection rejected for ${student?.full_name}`,
                                            })
                                          }}
                                        >
                                          <XCircle className="mr-2 h-4 w-4" />
                                          {t("manager.exchangeDetails.reject")}
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {selection.status === "approved" && (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => {
                                          toast({
                                            title: t("toast.selection.withdrawn"),
                                            description: `Selection withdrawn for ${student?.full_name}`,
                                          })
                                        }}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {t("manager.exchangeDetails.withdraw")}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Details Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            // Small delay to ensure the dialog is fully closed before resetting state
            setTimeout(() => {
              setSelectedStudent(null)
            }, 300)
          }
        }}
      >
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
                      {selectedStudent.selectedUniversities.map((university: string, index: number) => (
                        <div key={index} className="rounded-md border p-2">
                          <p className="font-medium">{university}</p>
                          <p className="text-xs text-muted-foreground">
                            {universities.find((u) => u.name === university)?.city},{" "}
                            {universities.find((u) => u.name === university)?.country}
                          </p>
                        </div>
                      ))}
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
                          className="w-full flex items-center gap-2 bg-transparent"
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
                <Button
                  variant="outline"
                  className="mr-2 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                  onClick={() => {
                    toast({
                      title: t("toast.selection.approved"),
                      description: t("toast.selection.approved.description").replace(
                        "{0}",
                        selectedStudent.studentName,
                      ),
                    })
                    setDialogOpen(false)
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {t("manager.exchangeDetails.approve")}
                </Button>
                <Button
                  variant="outline"
                  className="mr-2 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                  onClick={() => {
                    toast({
                      title: t("toast.selection.rejected"),
                      description: t("toast.selection.rejected.description").replace(
                        "{0}",
                        selectedStudent.studentName,
                      ),
                    })
                    setDialogOpen(false)
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("manager.exchangeDetails.reject")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Selection Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            // Small delay to ensure the dialog is fully closed before resetting state
            setTimeout(() => {
              setStudentToEdit(null)
            }, 300)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          {studentToEdit && (
            <>
              <DialogHeader>
                <DialogTitle>{t("manager.exchangeDetails.editStudentSelection")}</DialogTitle>
                <DialogDescription>
                  {t("manager.exchangeDetails.editSelectionFor")} {studentToEdit.studentName}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">{t("manager.exchangeDetails.studentInformation")}</h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.name")}:</span>
                        <span>{studentToEdit.studentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.id")}:</span>
                        <span>{studentToEdit.studentId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">{t("manager.exchangeDetails.group")}:</span>
                        <span>{studentToEdit.group}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{t("manager.exchangeDetails.editUniversities")}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-2">
                      {t("manager.exchangeDetails.selectUpTo")} {exchangeProgram.maxSelections}{" "}
                      {t("manager.exchangeDetails.universities")}
                    </p>
                    <div className="mt-2 space-y-2">
                      {universities.map((university) => (
                        <div key={university.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`university-${university.id}`}
                            checked={studentToEdit.editedUniversities.includes(university.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Add university if not exceeding max selections
                                if (studentToEdit.editedUniversities.length < exchangeProgram.maxSelections) {
                                  setStudentToEdit({
                                    ...studentToEdit,
                                    editedUniversities: [...studentToEdit.editedUniversities, university.name],
                                  })
                                }
                              } else {
                                // Remove university
                                setStudentToEdit({
                                  ...studentToEdit,
                                  editedUniversities: studentToEdit.editedUniversities.filter(
                                    (name: string) => name !== university.name,
                                  ),
                                })
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 accent-primary focus:ring-primary"
                            disabled={
                              !studentToEdit.editedUniversities.includes(university.name) &&
                              studentToEdit.editedUniversities.length >= exchangeProgram.maxSelections
                            }
                          />
                          <label htmlFor={`university-${university.id}`} className="text-sm font-medium">
                            {university.name}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({university.city}, {university.country})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    {t("manager.exchangeDetails.cancel")}
                  </Button>
                </DialogClose>
                <Button onClick={saveStudentSelection} disabled={studentToEdit.editedUniversities.length === 0}>
                  {t("manager.exchangeDetails.saveChanges")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Toaster component directly in the page for testing */}
      <Toaster />
    </DashboardLayout>
  )
}
