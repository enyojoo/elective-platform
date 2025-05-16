"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { useCachedElectives } from "@/hooks/use-cached-electives"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit } from "lucide-react"

export default function ManagerExchangeElectivesPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (institution?.id) {
      setInstitutionId(institution.id)
    }
  }, [institution])

  const { electives, isLoading, error } = useCachedElectives(institutionId)

  // Filter only exchange electives
  const exchangeElectives = electives?.filter((elective) => elective.type === "exchange") || []

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
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
            {t("manager.electives.active")}
          </Badge>
        )
      case "inactive":
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
        {exchangeElectives.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exchangeElectives.map((elective) => (
              <Card key={elective.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-6 pb-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-medium">{elective.name}</h3>
                      {getStatusBadge(elective.status || "draft")}
                    </div>
                    <p className="text-sm text-muted-foreground">{elective.program || ""}</p>
                  </div>
                  <div className="p-6 pt-2">
                    <div className="flex justify-between gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/manager/electives/exchange/${elective.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("common.view")}
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/manager/electives/exchange/${elective.id}/edit`}>
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
