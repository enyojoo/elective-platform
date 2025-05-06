"use client"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { useCachedInstitutions } from "@/hooks/use-cached-institutions"

export default function InstitutionsPage() {
  const { t } = useLanguage()
  const { institutions, isLoading, error } = useCachedInstitutions()

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
            <h1 className="text-3xl font-bold tracking-tight">{t("superAdmin.institutions.title")}</h1>
            <p className="text-muted-foreground">{t("superAdmin.institutions.subtitle")}</p>
          </div>
          <Link href="/super-admin/institutions/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("superAdmin.institutions.addNew")}
            </Button>
          </Link>
        </div>

        {/* Institutions table or grid here */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {institutions?.map((institution) => (
            <div key={institution.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{institution.name}</h3>
              <p className="text-sm text-muted-foreground">{institution.domain}</p>
              <div className="mt-4">
                <Link href={`/super-admin/institutions/${institution.id}`}>
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
