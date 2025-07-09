"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, MapPin, Users, Inbox, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { useInstitution } from "@/lib/institution-context"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

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
}

export default function StudentExchangePage() {
  const { t, language } = useLanguage()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()

  const [exchangePrograms, setExchangePrograms] = useState<ExchangeProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (institution?.id) {
      loadExchangePrograms()
    }
  }, [institution?.id])

  const loadExchangePrograms = async () => {
    if (!institution?.id) return

    setIsLoading(true)
    setFetchError(null)
    try {
      console.log("Fetching exchange programs for student view")

      // Only show published and closed programs to students
      const { data, error } = await supabase
        .from("elective_exchange")
        .select("*")
        .eq("institution_id", institution.id)
        .in("status", ["published", "closed"])
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching exchange programs:", error)
        throw error
      }

      console.log("Exchange programs loaded for student:", data)
      setExchangePrograms(data || [])
    } catch (error: any) {
      console.error("Error loading exchange programs:", error)
      setFetchError(error.message || "Failed to load exchange programs")
    } finally {
      setIsLoading(false)
    }
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

  // Check if program is selectable
  const isProgramSelectable = (program: ExchangeProgram) => {
    const now = new Date()
    const deadline = new Date(program.deadline)
    return program.status === "published" && deadline > now
  }

  // Get status badge for students
  const getStatusBadge = (program: ExchangeProgram) => {
    const now = new Date()
    const deadline = new Date(program.deadline)
    const isSelectable = isProgramSelectable(program)

    if (program.status === "closed") {
      return <Badge variant="destructive">Closed</Badge>
    }

    if (deadline < now) {
      return <Badge variant="destructive">Deadline Passed</Badge>
    }

    if (isSelectable) {
      return <Badge variant="secondary">Open</Badge>
    }

    return <Badge variant="outline">Coming Soon</Badge>
  }

  const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date()

  if (isLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exchange Programs</h1>
            <p className="text-muted-foreground">
              Explore international exchange opportunities and apply to partner universities
            </p>
          </div>
          <TableSkeleton numberOfRows={3} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exchange Programs</h1>
          <p className="text-muted-foreground">
            Explore international exchange opportunities and apply to partner universities
          </p>
        </div>

        {fetchError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        {!fetchError && exchangePrograms.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No Exchange Programs Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                There are currently no exchange programs open for applications. Check back later for new opportunities.
              </p>
            </CardContent>
          </Card>
        )}

        {!fetchError && exchangePrograms.length > 0 && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {exchangePrograms.map((program) => {
              const isSelectable = isProgramSelectable(program)
              const deadlinePassed = isDeadlinePassed(program.deadline)
              const name = language === "ru" && program.name_ru ? program.name_ru : program.name

              return (
                <Card
                  key={program.id}
                  className={`h-full transition-all hover:shadow-md ${!isSelectable ? "opacity-75" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{name}</CardTitle>
                        {getStatusBadge(program)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {program.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {language === "ru" && program.description_ru ? program.description_ru : program.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-col pt-0 pb-4 gap-4">
                    <div className="flex flex-col gap-y-2 text-sm w-full">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Deadline:</span>
                        <span className={deadlinePassed ? "text-red-600" : ""}>{formatDate(program.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Max selections:</span>
                        <span>{program.max_selections}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Universities:</span>
                        <span>{program.universities?.length || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-md p-2 w-full bg-gray-100/50 dark:bg-gray-900/20">
                      <span className="text-sm">
                        Status:{" "}
                        {isSelectable
                          ? "Open for Applications"
                          : program.status === "closed"
                            ? "Closed"
                            : "Application Closed"}
                      </span>
                      <Link href={`/student/exchange/${program.id}`}>
                        <Button
                          size="sm"
                          variant={isSelectable ? "default" : "outline"}
                          className="h-7 gap-1"
                          disabled={!isSelectable && program.status !== "published"}
                        >
                          <span>View</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
