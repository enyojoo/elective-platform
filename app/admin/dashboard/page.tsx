"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Users, GraduationCap, BookOpen, Globe, Layers } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function AdminDashboard() {
  const { language } = useLanguage()
  const translations = {
    title: language === "en" ? "Dashboard" : "Панель управления",

    // Course Electives
    courseElectives: language === "en" ? "Course Electives" : "Элективные курсы",
    totalCourseElectives: language === "en" ? "Total course elective selections" : "Всего выборов элективных курсов",
    manageCourseElectives: language === "en" ? "Manage" : "Управлять",

    // Exchange Programs
    exchangePrograms: language === "en" ? "Exchange Programs" : "Про��раммы обмена",
    totalExchangePrograms: language === "en" ? "Total exchange programs available" : "Всего доступных программ обмена",
    manageExchangePrograms: language === "en" ? "Manage" : "Управлять",

    // Courses
    courses: language === "en" ? "Courses" : "Курсы",
    totalCourses: language === "en" ? "Courses in the system" : "Курсы в системе",
    manageCourses: language === "en" ? "Manage" : "Управлять",

    // Programs
    programs: language === "en" ? "Programs" : "Программы",
    totalPrograms: language === "en" ? "Academic programs configured" : "Настроенные академические программы",
    managePrograms: language === "en" ? "Manage" : "Управлять",

    // Groups
    groups: language === "en" ? "Groups" : "Группы",
    totalGroups: language === "en" ? "Student groups created" : "Созданные группы студентов",
    manageGroups: language === "en" ? "Manage" : "Управлять",

    // Degrees
    degrees: language === "en" ? "Degrees" : "Степени",
    totalDegrees: language === "en" ? "Degree types available" : "Доступные типы степеней",
    manageDegrees: language === "en" ? "Manage" : "Управлять",

    // Users
    users: language === "en" ? "Users" : "Пользователи",
    totalUsers: language === "en" ? "Total users in the system" : "Всего пользователей в системе",
    manageUsers: language === "en" ? "Manage" : "Управлять",
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
          {/* Course Electives Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.courseElectives}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">{translations.totalCourseElectives}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/electives?tab=courses">{translations.manageCourseElectives}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Exchange Programs Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.exchangePrograms}</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">{translations.totalExchangePrograms}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/electives?tab=exchange">{translations.manageExchangePrograms}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Courses Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.courses}</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">{translations.totalCourses}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/courses">{translations.manageCourses}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Programs Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.programs}</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">{translations.totalPrograms}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/programs">{translations.managePrograms}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Groups Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.groups}</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">16</div>
              <p className="text-xs text-muted-foreground">{translations.totalGroups}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/groups">{translations.manageGroups}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.users}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">{translations.totalUsers}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/users">{translations.manageUsers}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
