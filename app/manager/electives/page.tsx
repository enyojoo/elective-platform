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

export default function ManagerElectivesPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (institution?.id) {
      setInstitutionId(institution.id)
    }
  }, [institution])

  const { electives, isLoading, error } = useCachedElectives(institutionId)

  // Only show skeleton on first load, not when navigating back to this page
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton type="card-grid" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("manager.electives.title")}</h1>
            <p className="text-muted-foreground">{t("manager.electives.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/manager/electives/course-builder">
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t("manager.electives.addCourse")}
              </Button>
            </Link>
            <Link href="/manager/electives/exchange-builder">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("manager.electives.addExchange")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Electives grid here */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {electives?.map((elective) => (
            <div key={elective.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{elective.name}</h3>
              <p className="text-sm text-muted-foreground">{elective.type}</p>
              <div className="mt-4">
                <Link href={`/manager/electives/${elective.type}/${elective.id}`}>
                  <Button variant="outline" size="sm">
                    {t("common.view")}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
