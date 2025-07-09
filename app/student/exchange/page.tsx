"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
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
  created_at: string
}

export default function StudentExchangePage() {
  const { t, language } = useLanguage()
  const supabase = getSupabaseBrowserClient()
  const { institution } = useInstitution()

  const [exchangePrograms, setExchangePrograms] = useState<ExchangeProgram[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (institution?.id) {
      loadExchangePrograms()
    }
  }, [institution?.id])

  const loadExchangePrograms = async () => {
    if (!institution?.id) return

    setIsLoading(true)
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
    } catch (error) {
      console.error("Error loading exchange programs:", error)
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
  const isProgramSelectable = (program: ExchangeProgram) => {
    const now = new Date()
    const deadline = new Date(program.deadline)
    return program.status === "published" && deadline > now
  }

  // Get status badge for students
  const getStatusBadge = (program: ExchangeProgram) => {
    if (program.status === "closed") {
      return <Badge variant="destructive">Closed</Badge>
    }

    const now = new Date()
    const deadline = new Date(program.deadline)

    if (deadline < now) {
      return <Badge variant="outline">Deadline Passed</Badge>
    }

    return <Badge variant="secondary">Open for Applications</Badge>
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

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : exchangePrograms.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No Exchange Programs Available</h3>
              <p className="text-muted-foreground">
                There are currently no exchange programs open for applications. Check back later for new opportunities.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exchangePrograms.map((program) => {
              const isSelectable = isProgramSelectable(program)

              return (
                <Card
                  key={program.id}
                  className={`transition-all hover:shadow-md ${!isSelectable ? "opacity-75" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {language === "ru" && program.name_ru ? program.name_ru : program.name}
                      </CardTitle>
                      {getStatusBadge(program)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {program.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {language === "ru" && program.description_ru ? program.description_ru : program.description}
                      </p>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Deadline: {formatDate(program.deadline)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Max {program.max_selections} university selections</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{program.universities?.length || 0} partner universities</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {isSelectable ? (
                        <Button asChild className="w-full">
                          <Link href={`/student/exchange/${program.id}`}>
                            View & Apply
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full bg-transparent" disabled>
                          {program.status === "closed" ? "Program Closed" : "Application Closed"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
