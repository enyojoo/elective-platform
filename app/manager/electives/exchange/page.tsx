"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { toast } from "sonner"

interface ElectivePack {
  id: string
  name: string
  name_ru: string | null
  type: string
  status: string
  deadline: string | null
  created_at: string
  updated_at: string
  max_selections: number
  universities?: any[]
}

export default function ManagerExchangeElectivesPage() {
  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)
  const [exchangePrograms, setExchangePrograms] = useState<ElectivePack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (institution?.id) {
      setInstitutionId(institution.id)
    }
  }, [institution])

  // Fetch exchange programs
  useEffect(() => {
    const fetchElectivePacks = async () => {
      if (!institution?.id) return

      try {
        setIsLoading(true)

        // Fetch elective exchange programs
        const { data: packs, error } = await supabase
          .from("elective_exchange")
          .select("*")
          .eq("institution_id", institution.id)
          .eq("type", "exchange")
          .order("created_at", { ascending: false })

        if (error) throw error

        setExchangePrograms(packs || [])
      } catch (error) {
        console.error("Error fetching elective packs:", error)
        toast({
          title: t("manager.electives.error", "Error"),
          description: t("manager.electives.errorFetching", "Failed to fetch elective packs"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElectivePacks()
  }, [institution?.id, supabase, t])

  // Only show skeleton on first load, not when navigating back to this page
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton type="card-grid" />
      </DashboardLayout>
    )
  }

  // Get status badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("manager.electives.active")}
          </Badge>
        )
      case "inactive":
      case "closed":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
            {t("manager.electives.inactive")}
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
            {t("manager.electives.draft")}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Get localized name based on current language
  const getLocalizedName = (pack: ElectivePack) => {
    if (language === "ru" && pack.name_ru) {
      return pack.name_ru
    }
    return pack.name
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("manager.electives.exchangePrograms")}</h1>
            <p className="text-muted-foreground">{t("manager.electives.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/manager/electives/exchange-builder">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("manager.electives.create")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Exchange Programs grid */}
        {exchangePrograms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exchangePrograms.map((program) => (
              <Card key={program.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 pb-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-medium">{getLocalizedName(program)}</h3>
                      {getStatusBadge(program.status || "draft")}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("manager.exchangeDetails.universities")}: {program.universities?.length || 0}
                    </p>
                  </div>
                  <div className="p-6 pt-2">
                    <div className="flex justify-between gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/manager/electives/exchange/${program.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("common.view")}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/manager/electives/exchange/${program.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("common.edit")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-md">
            <p className="text-muted-foreground">{t("manager.electives.noExchangePrograms")}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
