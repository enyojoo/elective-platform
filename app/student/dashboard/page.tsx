"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, ClipboardList } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function StudentDashboard() {
  const { t } = useLanguage()

  // Mock student data
  const studentData = {
    name: "Alex Johnson",
    email: "alex.johnson@student.spbu.ru",
    degree: "Bachelor",
    program: "Management",
    year: "2023",
    group: "23.B12-vshm",
    requiredElectives: {
      courses: 2,
      exchange: 1,
      total: 3,
    },
    selectedElectives: {
      courses: 1,
      exchange: 0,
      total: 1,
    },
    pendingSelections: {
      courses: 1,
      exchange: 1,
      total: 2,
    },
  }

  // Mock upcoming deadlines
  const upcomingDeadlines = [
    {
      title: "Fall 2025",
      date: "2025-08-15",
      daysLeft: 14,
    },
    {
      title: "Spring 2025",
      date: "2025-12-01",
      daysLeft: 122,
    },
  ]

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("student.dashboard.title")}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.requiredElectives")}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.requiredElectives.total}</div>
              <p className="text-xs text-muted-foreground">
                {studentData.requiredElectives.courses} {t("student.dashboard.courses")},{" "}
                {studentData.requiredElectives.exchange} {t("student.dashboard.exchange")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.selectedElectives")}</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.selectedElectives.total}</div>
              <p className="text-xs text-muted-foreground">
                {studentData.selectedElectives.courses} {t("student.dashboard.courses")},{" "}
                {studentData.selectedElectives.exchange} {t("student.dashboard.exchange")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("student.dashboard.pendingSelections")}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentData.pendingSelections.total}</div>
              <p className="text-xs text-muted-foreground">
                {studentData.pendingSelections.courses} {t("student.dashboard.courses")},{" "}
                {studentData.pendingSelections.exchange} {t("student.dashboard.exchange")}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("student.dashboard.yourInfo")}</CardTitle>
              <CardDescription>{t("student.dashboard.academicDetails")}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="font-medium">{t("student.dashboard.name")}:</dt>
                  <dd>{studentData.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("student.dashboard.degree")}:</dt>
                  <dd>{studentData.degree}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("student.dashboard.program")}:</dt>
                  <dd>{studentData.program}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("student.dashboard.yearEnrollment")}:</dt>
                  <dd>{studentData.year}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("student.dashboard.group")}:</dt>
                  <dd>{studentData.group}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">{t("student.dashboard.email")}:</dt>
                  <dd>{studentData.email}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t("student.dashboard.upcomingDeadlines")}</CardTitle>
              <CardDescription>{t("student.dashboard.importantDates")}</CardDescription>
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
                      {deadline.daysLeft} {t("student.dashboard.daysLeft")}
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
