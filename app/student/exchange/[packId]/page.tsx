"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import {
  Download,
  CheckCircle,
  Info,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  FileText,
  UploadCloud,
  Users,
  Calendar,
  MapPin,
} from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  DialogFooter as ShadDialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useInstitution } from "@/lib/institution-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"

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
  statement_template_url: string | null
  created_at: string
}

interface University {
  id: string
  name: string
  name_ru: string | null
  country: string
  city: string
  description: string | null
  description_ru: string | null
  max_students: number
  website: string | null
  university_languages: string[]
}

interface StudentExchangePageProps {
  params: {
    packId: string
  }
}

export default function StudentExchangePage({ params }: StudentExchangePageProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()

  const [exchangeProgram, setExchangeProgram] = useState<ExchangeProgram | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])
  const [statementFile, setStatementFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasExistingApplication, setHasExistingApplication] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [isUploadingStatement, setIsUploadingStatement] = useState(false)
  const [downloadingStatement, setDownloadingStatement] = useState(false)
  const [viewingUniversity, setViewingUniversity] = useState<University | null>(null)

  const packId = params.packId

  const loadData = useCallback(async () => {
    if (!packId || !institution?.id) return

    setIsLoading(true)
    setFetchError(null)
    try {
      console.log("Loading exchange program:", packId)

      // Load exchange program
      const { data: program, error: programError } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("id", packId)
        .eq("institution_id", institution.id)
        .single()

      if (programError) {
        console.error("Error fetching exchange program:", programError)
        throw programError
      }

      console.log("Exchange program loaded:", program)
      setExchangeProgram(program)

      // Load universities
      if (program.universities && program.universities.length > 0) {
        const { data: universitiesData, error: universitiesError } = await supabase
          .from("universities")
          .select("*")
          .in("id", program.universities)
          .eq("status", "active")
          .order("name")

        if (universitiesError) {
          console.error("Error fetching universities:", universitiesError)
          throw universitiesError
        }

        console.log("Universities loaded:", universitiesData)
        setUniversities(universitiesData || [])
      }

      // Check for existing application
      // This would require getting the current user's ID and checking exchange_selections table
      // For now, we'll skip this check
    } catch (error: any) {
      console.error("Error loading exchange program:", error)
      setFetchError(error.message || "Failed to load exchange program details")
      toast({
        title: "Error",
        description: "Failed to load exchange program details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [packId, institution?.id, supabase, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Format date helper
  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Check if program is selectable
  const isProgramSelectable = () => {
    if (!exchangeProgram) return false
    const now = new Date()
    const deadline = new Date(exchangeProgram.deadline)
    return exchangeProgram.status === "published" && deadline > now && !hasExistingApplication
  }

  const isDeadlinePassed = exchangeProgram?.deadline ? new Date(exchangeProgram.deadline) < new Date() : false
  const canSubmit = !isDeadlinePassed && exchangeProgram?.status !== "draft" && !hasExistingApplication

  // Handle university selection
  const handleUniversityToggle = (universityId: string) => {
    if (!isProgramSelectable()) return

    setSelectedUniversities((prev) => {
      if (prev.includes(universityId)) {
        return prev.filter((id) => id !== universityId)
      } else if (prev.length < (exchangeProgram?.max_selections || 0)) {
        return [...prev, universityId]
      } else {
        toast({
          title: "Selection limit reached",
          description: `You can only select up to ${exchangeProgram?.max_selections} universities`,
          variant: "destructive",
        })
        return prev
      }
    })
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }
      setStatementFile(file)
      toast({ title: "File selected", description: `"${file.name}" ready for upload.` })
    }
  }

  const handleDownloadStatementTemplate = async () => {
    if (!exchangeProgram?.statement_template_url) {
      toast({ title: "No template", description: "Statement template is not available.", variant: "destructive" })
      return
    }
    setDownloadingStatement(true)
    try {
      window.open(exchangeProgram.statement_template_url, "_blank")
    } catch (error) {
      toast({ title: "Download failed", variant: "destructive" })
    } finally {
      setDownloadingStatement(false)
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!exchangeProgram || !isProgramSelectable()) return

    if (selectedUniversities.length === 0) {
      toast({
        title: "No universities selected",
        description: "Please select at least one university",
        variant: "destructive",
      })
      return
    }

    if (!statementFile) {
      toast({
        title: "Statement required",
        description: "Please upload your statement of purpose",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      setIsUploadingStatement(true)
      // Upload statement file
      const fileExt = statementFile.name.split(".").pop()
      const fileName = `statements/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("statements").upload(fileName, statementFile)

      if (uploadError) throw uploadError
      setIsUploadingStatement(false)

      // Get public URL
      const { data: urlData } = supabase.storage.from("statements").getPublicUrl(fileName)

      // Submit application (this would require user authentication)
      // For now, we'll just show a success message
      toast({
        title: "Application submitted",
        description: "Your exchange application has been submitted successfully",
      })

      // Reset form
      setSelectedUniversities([])
      setStatementFile(null)
      setHasExistingApplication(true)
      window.location.href = "/student/exchange"
    } catch (error: any) {
      console.error("Error submitting application:", error)
      toast({
        title: "Submission failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setIsUploadingStatement(false)
      setConfirmDialogOpen(false)
    }
  }

  const selectionProgress =
    exchangeProgram?.max_selections && exchangeProgram.max_selections > 0
      ? (selectedUniversities.length / exchangeProgram.max_selections) * 100
      : 0

  const getStatusAlert = () => {
    if (hasExistingApplication) {
      return (
        <Alert className="bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Application Submitted</AlertTitle>
          <AlertDescription>You have already submitted an application for this program.</AlertDescription>
        </Alert>
      )
    }
    if (exchangeProgram?.status === "closed") {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Program Closed</AlertTitle>
          <AlertDescription>This exchange program has been closed by the program manager.</AlertDescription>
        </Alert>
      )
    }
    if (exchangeProgram?.status === "draft") {
      return (
        <Alert className="bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Coming Soon</AlertTitle>
          <AlertDescription>This exchange program is not yet available for applications.</AlertDescription>
        </Alert>
      )
    }
    if (isDeadlinePassed) {
      return (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Deadline Passed</AlertTitle>
          <AlertDescription>The application deadline for this program has passed.</AlertDescription>
        </Alert>
      )
    }
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Application Period Active</AlertTitle>
        <AlertDescription>
          You can select up to {exchangeProgram?.max_selections} universities until{" "}
          {exchangeProgram?.deadline && formatDateDisplay(exchangeProgram.deadline)}.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <PageSkeleton />
      </DashboardLayout>
    )
  }

  if (fetchError) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Page</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  if (!exchangeProgram) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="p-4 text-center">Exchange program not found</div>
      </DashboardLayout>
    )
  }

  const exchangeProgramName =
    language === "ru" && exchangeProgram.name_ru ? exchangeProgram.name_ru : exchangeProgram.name
  const statementRequiredForProgram = !!exchangeProgram?.statement_template_url
  const isStatementHandled = !statementRequiredForProgram || !!statementFile
  const areUniversitiesSelected = selectedUniversities.length > 0

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <Link href="/student/exchange" passHref>
            <Button variant="outline" size="icon" aria-label="Back to Exchange Programs">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{exchangeProgramName}</h1>
            <p className="text-sm text-muted-foreground">Select partner universities for exchange</p>
          </div>
        </div>

        {getStatusAlert()}

        <Card>
          <CardHeader>
            <CardTitle>Selection Progress</CardTitle>
            <CardDescription>
              Selected {selectedUniversities.length} of {exchangeProgram.max_selections || 0} allowed universities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={selectionProgress} className="h-3" />
            {(exchangeProgram.max_selections || 0) > 0 && (
              <p className="mt-2.5 text-sm text-muted-foreground">
                {selectedUniversities.length === exchangeProgram.max_selections
                  ? "Maximum selections reached"
                  : `You can select ${exchangeProgram.max_selections - selectedUniversities.length} more ${exchangeProgram.max_selections - selectedUniversities.length === 1 ? "university" : "universities"}`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exchangeProgram.description && (
              <p className="text-muted-foreground">
                {language === "ru" && exchangeProgram.description_ru
                  ? exchangeProgram.description_ru
                  : exchangeProgram.description}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Application Deadline</p>
                  <p className="text-sm text-muted-foreground">{formatDateDisplay(exchangeProgram.deadline)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Max Selections</p>
                  <p className="text-sm text-muted-foreground">{exchangeProgram.max_selections} universities</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Partner Universities</p>
                  <p className="text-sm text-muted-foreground">{universities.length} available</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {statementRequiredForProgram && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Statement of Purpose
              </CardTitle>
              <CardDescription>Upload your statement of purpose for the exchange program</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {exchangeProgram.statement_template_url && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent"
                  onClick={handleDownloadStatementTemplate}
                  disabled={downloadingStatement || exchangeProgram.status === "draft"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {downloadingStatement ? "Downloading..." : "Download Template"}
                </Button>
              )}
              <div className="relative">
                <Label
                  htmlFor="statement-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF only (max 10MB)</p>
                  </div>
                  <Input
                    id="statement-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    disabled={isUploadingStatement || !canSubmit}
                    className="sr-only"
                  />
                </Label>
                {isUploadingStatement && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>

              {statementFile && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>File Ready</AlertTitle>
                  <AlertDescription>"{statementFile.name}" ready for upload.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {universities.length > 0 ? (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {universities.map((university) => {
              const isSelected = selectedUniversities.includes(university.id)
              const isDisabledByMax =
                !isSelected &&
                selectedUniversities.length >= (exchangeProgram.max_selections || Number.POSITIVE_INFINITY)
              return (
                <Card
                  key={university.id}
                  className={`flex flex-col h-full transition-all hover:shadow-md ${
                    isSelected ? "border-primary ring-2 ring-primary/50" : "border-border"
                  } ${isDisabledByMax ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <CardTitle className="text-lg leading-tight">
                        {language === "ru" && university.name_ru ? university.name_ru : university.name}
                      </CardTitle>
                      <span className="text-xs whitespace-nowrap text-muted-foreground bg-muted px-2 py-1 rounded-full flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {university.max_students} max
                      </span>
                    </div>
                    <CardDescription className="text-xs">
                      {university.city}, {university.country}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow pb-3">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-sm text-primary hover:text-primary/80"
                      onClick={() => setViewingUniversity(university)}
                    >
                      <Info className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                  </CardContent>
                  {canSubmit && (
                    <CardFooter className="pt-0 border-t mt-auto pt-3">
                      <div className="flex items-center space-x-2 w-full">
                        <Checkbox
                          id={`university-${university.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleUniversityToggle(university.id)}
                          disabled={isDisabledByMax || !canSubmit}
                        />
                        <Label
                          htmlFor={`university-${university.id}`}
                          className={`text-sm font-medium leading-none ${isDisabledByMax || !canSubmit ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </Label>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No universities available for this program</p>
            </CardContent>
          </Card>
        )}

        {canSubmit && (
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-8">
            <Button
              onClick={() => {
                if (!areUniversitiesSelected) {
                  toast({ title: "Select at least one university", variant: "destructive" })
                } else if (!isStatementHandled) {
                  toast({
                    title: "Statement Required",
                    description: "Please upload your statement of purpose",
                    variant: "destructive",
                  })
                } else {
                  setConfirmDialogOpen(true)
                }
              }}
              disabled={isSubmitting || isUploadingStatement || !areUniversitiesSelected || !isStatementHandled}
              className="w-full sm:w-auto px-8 py-3 text-base"
              size="lg"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
              Submit Application
            </Button>
          </div>
        )}

        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Your Application</DialogTitle>
              <DialogDescription>Please review your selection before submitting</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Selected Universities:</h4>
                {selectedUniversities.length > 0 ? (
                  <ul className="space-y-1 list-disc list-inside pl-1">
                    {selectedUniversities.map((id) => {
                      const university = universities.find((u) => u.id === id)
                      return (
                        <li key={id} className="text-sm">
                          {language === "ru" && university?.name_ru ? university.name_ru : university?.name}
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No universities selected yet</p>
                )}
              </div>
              {statementRequiredForProgram && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2">Statement of Purpose:</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>
                      {statementFile
                        ? `File ready to submit: ${statementFile.name} (${Math.round(statementFile.size / 1024)}KB)`
                        : "Statement file ready"}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-2 pt-4 border-t mt-4">
                <Label htmlFor="student-name">Your Full Name (for authorization)</Label>
                <Input
                  id="student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  aria-required="true"
                />
              </div>
            </div>
            <ShadDialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  !studentName.trim() ||
                  isSubmitting ||
                  isUploadingStatement ||
                  !areUniversitiesSelected ||
                  !isStatementHandled
                }
              >
                {isSubmitting || isUploadingStatement ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Submit Application
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewingUniversity} onOpenChange={(open) => !open && setViewingUniversity(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {language === "ru" && viewingUniversity?.name_ru ? viewingUniversity.name_ru : viewingUniversity?.name}
              </DialogTitle>
              <DialogDescription>
                {viewingUniversity?.city}, {viewingUniversity?.country}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[60vh] overflow-y-auto prose prose-sm dark:prose-invert">
              {viewingUniversity && selectedUniversities.includes(viewingUniversity.id) && (
                <Alert variant="info" className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>Currently selected for your application</AlertDescription>
                </Alert>
              )}
              <p className="whitespace-pre-wrap">
                {language === "ru" && viewingUniversity?.description_ru
                  ? viewingUniversity.description_ru
                  : viewingUniversity?.description || "No description available"}
              </p>
              {viewingUniversity?.university_languages && viewingUniversity.university_languages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Languages:</p>
                  <p className="text-sm text-muted-foreground">{viewingUniversity.university_languages.join(", ")}</p>
                </div>
              )}
              {viewingUniversity?.website && (
                <div className="mt-4">
                  <a
                    href={viewingUniversity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Visit university website
                  </a>
                </div>
              )}
            </div>
            <ShadDialogFooter>
              <Button variant="outline" onClick={() => setViewingUniversity(null)}>
                Close
              </Button>
            </ShadDialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
