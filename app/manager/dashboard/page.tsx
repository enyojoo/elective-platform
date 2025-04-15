"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, GlobeIcon } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function ManagerDashboard() {
  const { t } = useLanguage()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("manager.dashboard.title")}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("manager.dashboard.courseElectives")}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">{t("manager.dashboard.totalCourseElectives")}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manager/electives?tab=courses">{t("manager.dashboard.manageCourseElectives")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("manager.dashboard.exchangePrograms")}</CardTitle>
              <GlobeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">{t("manager.dashboard.totalExchangePrograms")}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manager/electives?tab=exchange">{t("manager.dashboard.manageExchangePrograms")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
