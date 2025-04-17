"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole, SelectionStatus } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle, Clock, Info, Users, Globe, MapPin, GraduationCap, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

interface ExchangePageProps {
  params: {
    packId: string
  }
}

export default function ExchangePageClient({ params }: ExchangePageProps) {
  const { t } = useLanguage()
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewingUniversity, setViewingUniversity] = useState<any>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Ensure packId is available and valid
  const packId = params?.packId || ""

  // Mock exchange data
  const exchangeData = {
    id: packId,
    name:
      packId === "fall-2023"
        ? "Fall 2023"
        : packId === "spring-2024"
          ? "Spring 2024"
          : packId === "fall-2024"
            ? "Fall 2024"
            : "Spring 2025",
    semester: packId && typeof packId === "string" && packId.includes("fall") ? "Fall" : "Spring",
    year:
      packId && typeof packId === "string" && packId.includes("2023")
        ? 2023
        : packId && typeof packId === "string" && packId.includes("2024")
          ? 2024
          : 2025,
    maxSelections: 3,
    status: packId === "spring-2025" ? "draft" : "published",
    startDate: packId && typeof packId === "string" && packId.includes("fall") ? "2023-08-01" : "2024-01-10",
    endDate: packId && typeof packId === "string" && packId.includes("fall") ? "2023-08-15" : "2024-01-25",
  }

  // Mock universities data
  const universities = [
    {
      id: "1",
      name: "University of Vienna",
      country: "Austria",
      city: "Vienna",
      description:
        "Founded in 1365, the University of Vienna is one of the oldest universities in Europe. It offers a wide range of programs and has a strong focus on research.",
      maxStudents: 5,
      currentStudents: exchangeData.status === "draft" ? 0 : 3,
      language: "German, English",
      programs: ["Business Administration", "Economics", "International Business"],
      website: "https://www.univie.ac.at/en/",
    },
    {
      id: "2",
      name: "Copenhagen Business School",
      country: "Denmark",
      city: "Copenhagen",
      description:
        "Copenhagen Business School (CBS) is a public university located in Copenhagen, Denmark. CBS is one of the largest business schools in Europe with close to 23,000 students.",
      maxStudents: 4,
      currentStudents: exchangeData.status === "draft" ? 0 : 4,
      language: "English",
      programs: ["Business Administration", "Finance", "Marketing"],
      website: "https://www.cbs.dk/en",
    },
    {
      id: "3",
      name: "HEC Paris",
      country: "France",
      city: "Paris",
      description:
        "HEC Paris is a leading business school in Europe. It offers a complete and unique range of education programs for students and leaders.",
      maxStudents: 3,
      currentStudents: exchangeData.status === "draft" ? 0 : 1,
      language: "French, English",
      programs: ["Management", "Finance", "Entrepreneurship"],
      website: "https://www.hec.edu/en",
    },
    {
      id: "4",
      name: "Bocconi University",
      country: "Italy",
      city: "Milan",
      description:
        "Bocconi University is a private university in Milan, Italy. It is consistently ranked as one of the best business schools in Europe and the world.",
      maxStudents: 5,
      currentStudents: exchangeData.status === "draft" ? 0 : 2,
      language: "Italian, English",
      programs: ["Economics", "Management", "Finance"],
      website: "https://www.unibocconi.eu/wps/wcm/connect/bocconi/sitopubblico_en/navigation+tree/home/",
    },
    {
      id: "5",
      name: "Rotterdam School of Management",
      country: "Netherlands",
      city: "Rotterdam",
      description:
        "Rotterdam School of Management, Erasmus University (RSM) is the international business school of Erasmus University Rotterdam.",
      maxStudents: 4,
      currentStudents: exchangeData.status === "draft" ? 0 : 3,
      language: "English",
      programs: ["Business Administration", "Supply Chain Management", "Marketing"],
      website: "https://www.rsm.nl/",
    },
    {
      id: "6",
      name: "Stockholm School of Economics",
      country: "Sweden",
      city: "Stockholm",
      description:
        "The Stockholm School of Economics (SSE) is one of Europe's leading business schools. SSE offers programs of the highest international standards.",
      maxStudents: 3,
      currentStudents: exchangeData.status === "draft" ? 0 : 2,
      language: "English",
      programs: ["Business and Economics", "Finance", "Accounting"],
      website: "https://www.hhs.se/en/",
    },
    {
      id: "7",
      name: "University of St. Gallen",
      country: "Switzerland",
      city: "St. Gallen",
      description:
        "The University of St. Gallen is a research university located in St. Gallen, Switzerland. It is specialized in business administration, economics, law, and international affairs.",
      maxStudents: 4,
      currentStudents: exchangeData.status === "draft" ? 0 : 1,
      language: "German, English",
      programs: ["Business Administration", "Economics", "International Affairs"],
      website: "https://www.unisg.ch/en/",
    },
    {
      id: "8",
      name: "London School of Economics",
      country: "United Kingdom",
      city: "London",
      description:
        "The London School of Economics and Political Science is a public research university located in London, England, and a constituent college of the federal University of London.",
      maxStudents: 5,
      currentStudents: exchangeData.status === "draft" ? 0 : 4,
      language: "English",
      programs: ["Economics", "Management", "Finance", "Political Science"],
      website: "https://www.lse.ac.uk/",
    },
  ]

  // Mock student selection data - with safe fallbacks
  let existingSelectionData = null
  if (packId === "fall-2023") {
    existingSelectionData = {
      packId: packId,
      selectedUniversityIds: ["1", "3"],
      status: SelectionStatus.APPROVED,
      authorizedBy: "Alex Johnson",
      createdAt: "2023-08-05",
    }
  } else if (packId === "spring-2024") {
    existingSelectionData = {
      packId: packId,
      selectedUniversityIds: ["5"],
      status: SelectionStatus.PENDING,
      authorizedBy: "Alex Johnson",
      createdAt: "2024-01-12",
    }
  }

  const existingSelection = existingSelectionData

  // Initialize state with empty array as default
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])

  // Use useEffect to safely set the initial state after component mounts
  useEffect(() => {
    if (!isInitialized) {
      // Safely initialize the selected universities
      const initialSelection =
        existingSelection &&
        existingSelection.selectedUniversityIds &&
        Array.isArray(existingSelection.selectedUniversityIds)
          ? existingSelection.selectedUniversityIds
          : []

      setSelectedUniversities(initialSelection)
      setIsInitialized(true)
    }
  }, [existingSelection, isInitialized])

  // Safe version of includes check
  const isUniversitySelected = (universityId: string): boolean => {
    if (!selectedUniversities || !Array.isArray(selectedUniversities)) {
      return false
    }
    return selectedUniversities.includes(universityId)
  }

  // Handle university selection with safety checks
  const toggleUniversitySelection = (universityId: string) => {
    if (!selectedUniversities || !Array.isArray(selectedUniversities)) {
      setSelectedUniversities([universityId])
      return
    }

    if (isUniversitySelected(universityId)) {
      setSelectedUniversities(selectedUniversities.filter((id) => id !== universityId))
    } else {
      if (selectedUniversities.length < exchangeData.maxSelections) {
        setSelectedUniversities([...selectedUniversities, universityId])
      }
    }
  }

  // Handle submission
  const handleSubmit = () => {
    setSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false)
      setConfirmDialogOpen(false)
      // In a real app, you would redirect or show success message
      window.location.href = "/student/exchange"
    }, 1500)
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    } catch (e) {
      return dateString
    }
  }

  // Calculate selection progress with safety check
  const selectionProgress = Array.isArray(selectedUniversities)
    ? (selectedUniversities.length / exchangeData.maxSelections) * 100
    : 0

  // Get status alert
  const getStatusAlert = () => {
    if (existingSelection && existingSelection.status === SelectionStatus.APPROVED) {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{t("student.exchange.selectionApproved")}</AlertTitle>
          <AlertDescription>{t("student.exchange.selectionApprovedDesc")}</AlertDescription>
        </Alert>
      )
    } else if (existingSelection && existingSelection.status === SelectionStatus.PENDING) {
      return (
        <Alert className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>{t("student.exchange.selectionPending")}</AlertTitle>
          <AlertDescription>{t("student.exchange.selectionPendingDesc")}</AlertDescription>
        </Alert>
      )
    } else if (exchangeData.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.exchange.comingSoon")}</AlertTitle>
          <AlertDescription>
            {t("student.exchange.comingSoonDesc")} {formatDate(exchangeData.startDate)}.
          </AlertDescription>
        </Alert>
      )
    } else {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t("student.exchange.selectionPeriodActive")}</AlertTitle>
          <AlertDescription>
            {t("student.exchange.selectionPeriodDesc")} {exchangeData.maxSelections} {t("student.exchange.until")}{" "}
            {formatDate(exchangeData.endDate)}.
          </AlertDescription>
        </Alert>
      )
    }
  }

  // Get card style based on selection status with safety checks
  const getCardStyle = (universityId: string) => {
    const isSelected = isUniversitySelected(universityId)

    const university = universities.find((u) => u.id === universityId)
    const maxStudents = university?.maxStudents || 0
    const currentStudents = university?.currentStudents || 0

    const isFull = currentStudents >= maxStudents
    const isDisabled =
      !isSelected &&
      (!Array.isArray(selectedUniversities) || selectedUniversities.length >= exchangeData.maxSelections || isFull)

    if (isSelected) {
      if (existingSelection?.status === SelectionStatus.APPROVED) {
        return "border-green-500 bg-green-50/30 dark:bg-green-950/10"
      } else if (existingSelection?.status === SelectionStatus.PENDING) {
        return "border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/10"
      } else {
        return "border-primary"
      }
    } else if (isDisabled) {
      return "opacity-60"
    }
    return ""
  }

  // If we're still initializing, show a simple loading state
  if (!isInitialized) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex items-center justify-center h-[60vh]">
          <p>Loading...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/student/exchange">
            <div className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </div>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{exchangeData.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">{t("student.exchange.selectUniversities")}</p>
            </div>
          </div>
        </div>

        {getStatusAlert()}

        <Card
          className={
            existingSelection
              ? existingSelection.status === SelectionStatus.APPROVED
                ? "border-green-200 dark:border-green-800"
                : "border-yellow-200 dark:border-yellow-800"
              : ""
          }
        >
          <CardHeader>
            <CardTitle>{t("student.exchange.selectionProgress")}</CardTitle>
            <CardDescription>
              {t("student.exchange.selectedOutOf")}{" "}
              {Array.isArray(selectedUniversities) ? selectedUniversities.length : 0} {t("student.exchange.out")}{" "}
              {exchangeData.maxSelections} {t("student.exchange.allowedUniversities")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress
              value={selectionProgress}
              className={`h-2 ${
                existingSelection?.status === SelectionStatus.APPROVED
                  ? "bg-green-100 dark:bg-green-950"
                  : existingSelection?.status === SelectionStatus.PENDING
                    ? "bg-yellow-100 dark:bg-yellow-950"
                    : ""
              }`}
              color={
                existingSelection?.status === SelectionStatus.APPROVED
                  ? "bg-green-600"
                  : existingSelection?.status === SelectionStatus.PENDING
                    ? "bg-yellow-600"
                    : undefined
              }
            />
            <p className="mt-2 text-sm text-muted-foreground">
              {Array.isArray(selectedUniversities) && selectedUniversities.length === exchangeData.maxSelections
                ? t("student.exchange.maxSelections")
                : `${t("student.exchange.canSelectMore")} ${exchangeData.maxSelections - (Array.isArray(selectedUniversities) ? selectedUniversities.length : 0)} ${
                    exchangeData.maxSelections -
                      (Array.isArray(selectedUniversities) ? selectedUniversities.length : 0) ===
                    1
                      ? t("student.exchange.moreUniversity")
                      : t("student.exchange.moreUniversities")
                  }`}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {universities.map((university) => {
            const isSelected = isUniversitySelected(university.id)
            const isFull = university.currentStudents >= university.maxStudents
            const isDisabled =
              !isSelected &&
              (!Array.isArray(selectedUniversities) ||
                selectedUniversities.length >= exchangeData.maxSelections ||
                isFull)
            const isApproved = existingSelection?.status === SelectionStatus.APPROVED

            return (
              <Card key={university.id} className={`h-full transition-all ${getCardStyle(university.id)}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{university.name}</CardTitle>
                    <Badge variant={isFull ? "destructive" : "secondary"} className="ml-2">
                      <Users className="h-3 w-3 mr-1" />
                      {university.currentStudents}/{university.maxStudents}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {university.city}, {university.country}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-4 flex-grow flex flex-col gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>{university.language}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent w-fit"
                    onClick={() => setViewingUniversity(university)}
                  >
                    <Globe className="h-3.5 w-3.5 mr-1" />
                    {t("student.exchange.viewDetails")}
                  </Button>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {!isApproved && (
                      <>
                        <Checkbox
                          id={`university-${university.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleUniversitySelection(university.id)}
                          disabled={isDisabled || isApproved || exchangeData.status === "draft"}
                        />
                        <label
                          htmlFor={`university-${university.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {isSelected ? t("student.exchange.selected") : t("student.exchange.select")}
                        </label>
                      </>
                    )}
                  </div>
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 flex items-center"
                  >
                    {t("student.exchange.visitWebsite")}
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </a>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {existingSelection?.status !== SelectionStatus.APPROVED && (
          <div className="flex justify-end">
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={
                    !Array.isArray(selectedUniversities) ||
                    selectedUniversities.length === 0 ||
                    selectedUniversities.length > exchangeData.maxSelections ||
                    exchangeData.status === "draft"
                  }
                  className="px-8"
                >
                  {existingSelection ? t("student.exchange.updateSelection") : t("student.exchange.confirmSelection")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("student.exchange.confirmYourSelection")}</DialogTitle>
                  <DialogDescription>{t("student.exchange.reviewSelection")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">{t("student.exchange.selectedUniversities")}:</h4>
                    <ul className="space-y-2">
                      {Array.isArray(selectedUniversities) &&
                        selectedUniversities.map((universityId) => {
                          const university = universities.find((u) => u.id === universityId)
                          return (
                            <li key={universityId} className="text-sm flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {university?.name} ({university?.city}, {university?.country})
                            </li>
                          )
                        })}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-name">
                      {t("student.exchange.yourFullName")} ({t("student.exchange.toAuthorize")})
                    </Label>
                    <Input
                      id="student-name"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder={t("student.exchange.enterFullName")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleSubmit} disabled={!studentName.trim() || submitting}>
                    {submitting ? t("student.exchange.submitting") : t("student.exchange.submitSelection")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* University Details Dialog */}
        <Dialog open={!!viewingUniversity} onOpenChange={(open) => !open && setViewingUniversity(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewingUniversity?.name}</DialogTitle>
              <DialogDescription>
                {viewingUniversity?.city}, {viewingUniversity?.country}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("student.exchange.universityDescription")}</h4>
                <p className="text-sm text-muted-foreground">{viewingUniversity?.description}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("student.exchange.languageInstruction")}</h4>
                <p className="text-sm text-muted-foreground">{viewingUniversity?.language}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t("student.exchange.availablePrograms")}</h4>
                <div className="flex flex-wrap gap-1">
                  {viewingUniversity?.programs &&
                    Array.isArray(viewingUniversity.programs) &&
                    viewingUniversity.programs.map((program: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {program}
                      </Badge>
                    ))}
                </div>
              </div>
              {viewingUniversity && viewingUniversity.id && isUniversitySelected(viewingUniversity.id) && (
                <div className="flex justify-end">
                  <Badge
                    variant="outline"
                    className={
                      existingSelection?.status === SelectionStatus.APPROVED
                        ? "bg-green-100/50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                        : existingSelection?.status === SelectionStatus.PENDING
                          ? "bg-yellow-100/50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800"
                          : "bg-primary/10"
                    }
                  >
                    {t("student.exchange.selected")}
                  </Badge>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" onClick={() => setViewingUniversity(null)}>
                {t("student.exchange.close")}
              </Button>
              <div className="flex gap-2">
                <a
                  href={viewingUniversity?.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  {t("student.exchange.visitWebsite")}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
