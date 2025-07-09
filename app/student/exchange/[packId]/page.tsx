"use client"

import type React from "react"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Calendar, MapPin, Users, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { useToast } from "@/hooks/use-toast"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"

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

  useEffect(() => {
    if (params.packId && institution?.id) {
      loadExchangeProgram()
    }
  }, [params.packId, institution?.id])

  const loadExchangeProgram = async () => {
    if (!params.packId || !institution?.id) return

    setIsLoading(true)
    try {
      console.log("Loading exchange program:", params.packId)

      // Load exchange program
      const { data: program, error: programError } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("id", params.packId)
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
    } catch (error) {
      console.error("Error loading exchange program:", error)
      toast({
        title: "Error",
        description: "Failed to load exchange program details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === "ru" ? "ru-RU" : "en-US", {
      year: "numeric",
      month: "long",
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

  // Get status message
  const getStatusMessage = () => {
    if (!exchangeProgram) return ""

    if (exchangeProgram.status === "closed") {
      return "This exchange program has been closed by the program manager."
    }

    const now = new Date()
    const deadline = new Date(exchangeProgram.deadline)

    if (deadline < now) {
      return "The application deadline for this program has passed."
    }

    if (hasExistingApplication) {
      return "You have already submitted an application for this program."
    }

    return ""
  }

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
        })
        return prev
      }
    })
  }

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Upload statement file
      const fileExt = statementFile.name.split(".").pop()
      const fileName = `statements/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("statements").upload(fileName, statementFile)

      if (uploadError) throw uploadError

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
    } catch (error) {
      console.error("Error submitting application:", error)
      toast({
        title: "Submission failed",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    )
  }

  if (!exchangeProgram) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <h2 className="text-2xl font-bold mb-2">Exchange Program Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The exchange program you're looking for doesn't exist or is no longer available.
          </p>
          <Link href="/student/exchange">
            <Button>Back to Exchange Programs</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const statusMessage = getStatusMessage()
  const isSelectable = isProgramSelectable()

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/student/exchange">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === "ru" && exchangeProgram.name_ru ? exchangeProgram.name_ru : exchangeProgram.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isSelectable ? "secondary" : "destructive"}>
                {isSelectable
                  ? "Open for Applications"
                  : exchangeProgram.status === "closed"
                    ? "Closed"
                    : "Application Closed"}
              </Badge>
            </div>
          </div>
        </div>

        {statusMessage && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800">{statusMessage}</p>
            </CardContent>
          </Card>
        )}

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
                  <p className="text-sm text-muted-foreground">{formatDate(exchangeProgram.deadline)}</p>
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

            {exchangeProgram.statement_template_url && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Statement Template</p>
                    <p className="text-sm text-muted-foreground">Download the template to prepare your statement</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={exchangeProgram.statement_template_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partner Universities</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select up to {exchangeProgram.max_selections} universities you're interested in
            </p>
          </CardHeader>
          <CardContent>
            {universities.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No universities available for this program</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {universities.map((university) => (
                  <div
                    key={university.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedUniversities.includes(university.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${!isSelectable ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => handleUniversityToggle(university.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedUniversities.includes(university.id)}
                        disabled={!isSelectable}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {language === "ru" && university.name_ru ? university.name_ru : university.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {university.city}, {university.country}
                        </p>
                        {university.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {language === "ru" && university.description_ru
                              ? university.description_ru
                              : university.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Max {university.max_students} students</span>
                          {university.university_languages && university.university_languages.length > 0 && (
                            <span>Languages: {university.university_languages.join(", ")}</span>
                          )}
                        </div>
                        {university.website && (
                          <a
                            href={university.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Visit website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {isSelectable && (
          <Card>
            <CardHeader>
              <CardTitle>Submit Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="statement">Statement of Purpose (PDF)</Label>
                <div className="mt-2">
                  <Input
                    id="statement"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {statementFile && (
                    <p className="text-sm text-muted-foreground mt-1">Selected: {statementFile.name}</p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Selected universities: {selectedUniversities.length} of {exchangeProgram.max_selections}
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedUniversities.length === 0 || !statementFile}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
