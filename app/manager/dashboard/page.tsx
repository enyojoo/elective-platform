"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, GlobeIcon } from "lucide-react"
import Link from "next/link"
import { UserRole } from "@/lib/types"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useRouter } from "next/navigation"

export default function ManagerDashboard() {
  const { t } = useLanguage()
  const { isSubdomainAccess } = useInstitution()
  const router = useRouter()

  // Ensure this page is only accessed via subdomain
  useEffect(() => {
    if (!isSubdomainAccess) {
      router.push("/institution-required")
    }
  }, [isSubdomainAccess, router])

  // Mock manager data
  const managerData = {
    name: "Elena Petrova",
    email: "e.petrova@gsom.spbu.ru",
    program: "Management",
    degree: "Bachelor's",
    year: "2024",
  }

  // Mock upcoming deadlines
  const upcomingDeadlines = [
    {
      title: "Fall 2025 Course Electives",
      date: "2025-06-15",
      daysLeft: 45,
    },
    {
      title: "Spring 2025 Exchange Programs",
      date: "2024-10-30",
      daysLeft: 12,
    },
    {
      title: "Spring 2025 Course Electives",
      date: "2024-11-15",
      daysLeft: 28,
    },
  ]

  if (!isSubdomainAccess) {
    return null // Don't render anything while redirecting
  }

  return (
    <DashboardLayout userRole={UserRole.MANAGER}>
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("manager.dashboard.yourInformation")}</CardTitle>
              <CardDescription>{t("manager.dashboard.managerDetails")}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium">{t("manager.dashboard.name")}:</dt>
                  <dd>{managerData.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("manager.dashboard.program")}:</dt>
                  <dd>{managerData.program}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("manager.dashboard.degree")}:</dt>
                  <dd>{managerData.degree}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("manager.dashboard.year")}:</dt>
                  <dd>{managerData.year}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("manager.dashboard.email")}:</dt>
                  <dd>{managerData.email}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("manager.dashboard.upcomingDeadlines")}</CardTitle>
              <CardDescription>{t("manager.dashboard.importantDates")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{deadline.title}</p>
                      <p className="text-sm text-muted-foreground">{deadline.date}</p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        deadline.daysLeft < 7
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : deadline.daysLeft < 30
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {deadline.daysLeft} {t("manager.dashboard.daysLeft")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
