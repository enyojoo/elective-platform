"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { BookOpen, GlobeIcon } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function ManagerDashboard() {
  const { language } = useLanguage()
  const translations = {
    title: language === "en" ? "Dashboard" : "Панель управления",
    courseElectives: language === "en" ? "Course Electives" : "Элективные курсы",
    totalCourseElectives: language === "en" ? "Total course elective selections" : "Всего выборов элективных курсов",
    manageCourseElectives: language === "en" ? "Manage Course Electives" : "Управление элективными курсами",
    exchangePrograms: language === "en" ? "Exchange Programs" : "Программы обмена",
    totalExchangePrograms: language === "en" ? "Total exchange programs available" : "Всего доступных программ обмена",
    manageExchangePrograms: language === "en" ? "Manage Exchange Programs" : "Управление программами обмена",
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.courseElectives}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">{translations.totalCourseElectives}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manager/electives?tab=courses">{translations.manageCourseElectives}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.exchangePrograms}</CardTitle>
              <GlobeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">{translations.totalExchangePrograms}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/manager/electives?tab=exchange">{translations.manageExchangePrograms}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
