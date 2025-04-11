"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, CheckSquare, Users, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function ManagerDashboard() {
  const { language } = useLanguage()
  const translations = {
    title: language === "en" ? "Program Manager Dashboard" : "Панель управления программой",
    welcome:
      language === "en"
        ? "Manage elective courses and student selections"
        : "Управление элективными курсами и выбором студентов",
    manageElectives: language === "en" ? "Manage Electives" : "Управление элективами",
    totalElectives: language === "en" ? "Total elective courses in the system" : "Всего элективных курсов в системе",
    manageButton: language === "en" ? "Manage Courses" : "Управление курсами",
    electivePacks: language === "en" ? "Elective Packs" : "Пакеты элективов",
    totalPacks: language === "en" ? "Total elective packs configured" : "Всего настроенных пакетов элективов",
    managePacksButton: language === "en" ? "Manage Packs" : "Управление пакетами",
    studentSelections: language === "en" ? "Student Selections" : "Выборы студентов",
    totalSelections: language === "en" ? "Students who have made selections" : "Студенты, сделавшие выбор",
    viewSelectionsButton: language === "en" ? "View Selections" : "Просмотр выборов",
    exportData: language === "en" ? "Export Data" : "Экспорт данных",
    exportDescription: language === "en" ? "Generate reports and export data" : "Создание отчетов и экспорт данных",
    exportButton: language === "en" ? "Export Options" : "Опции экспорта",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
          <p className="text-muted-foreground">{translations.welcome}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.manageElectives}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">{translations.totalElectives}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manage/electives">{translations.manageButton}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.electivePacks}</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">{translations.totalPacks}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manage/elective-packs">{translations.managePacksButton}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.studentSelections}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">87</div>
              <p className="text-xs text-muted-foreground">{translations.totalSelections}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manage/selections">{translations.viewSelectionsButton}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.exportData}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <p className="text-xs text-muted-foreground">{translations.exportDescription}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manage/export">{translations.exportButton}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Selection Statistics</CardTitle>
              <CardDescription>Overview of student selections by program</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Master in Management</div>
                    <div className="text-sm text-muted-foreground">42 students</div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "75%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Master in Business Analytics</div>
                    <div className="text-sm text-muted-foreground">28 students</div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "60%" }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Master in Corporate Finance</div>
                    <div className="text-sm text-muted-foreground">17 students</div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: "45%" }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Electives</CardTitle>
              <CardDescription>Most selected elective courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Digital Marketing Strategies</div>
                    <div className="text-sm text-muted-foreground">Fall 2024</div>
                  </div>
                  <div className="text-sm font-medium">32 selections</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sustainable Business Models</div>
                    <div className="text-sm text-muted-foreground">Fall 2024</div>
                  </div>
                  <div className="text-sm font-medium">28 selections</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Data-Driven Decision Making</div>
                    <div className="text-sm text-muted-foreground">Fall 2024</div>
                  </div>
                  <div className="text-sm font-medium">25 selections</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">International Business Strategy</div>
                    <div className="text-sm text-muted-foreground">Fall 2024</div>
                  </div>
                  <div className="text-sm font-medium">21 selections</div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Entrepreneurship and Innovation</div>
                    <div className="text-sm text-muted-foreground">Fall 2024</div>
                  </div>
                  <div className="text-sm font-medium">19 selections</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
