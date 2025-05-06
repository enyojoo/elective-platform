"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { useCachedPrograms } from "@/hooks/use-cached-programs"

export default function ProgramsPage() {
  const { t } = useLanguage()
  const { institution } = useInstitution()
  const [institutionId, setInstitutionId] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (institution?.id) {
      setInstitutionId(institution.id)
    }
  }, [institution])

  const { programs, isLoading, error } = useCachedPrograms(institutionId)

  // Only show skeleton on first load, not when navigating back to this page
  if (isLoading) {
    return (
      <DashboardLayout>
        <PageSkeleton type="table" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("admin.programs.title")}</h1>
            <p className="text-muted-foreground">{t("admin.programs.subtitle")}</p>
          </div>
          <Link href="/admin/programs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.programs.addNew")}
            </Button>
          </Link>
        </div>

        {/* Programs table or grid here */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs?.map((program) => (
            <div key={program.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{program.name}</h3>
              <p className="text-sm text-muted-foreground">{program.description}</p>
              <div className="mt-4">
                <Link href={`/admin/programs/${program.id}`}>
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
