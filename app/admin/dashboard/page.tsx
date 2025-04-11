"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Users, GraduationCap, BookOpen, CheckSquare, Layers, Building } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"

export default function AdminDashboard() {
  const { language } = useLanguage()
  const translations = {
    title: language === "en" ? "Admin Dashboard" : "Панель администратора",
    welcome: language === "en" ? "System administration and configuration" : "Администрирование и настройка системы",

    // Electives
    electives: language === "en" ? "Electives" : "Элективы",
    totalElectives: language === "en" ? "Elective packs available" : "Доступные пакеты элективов",
    manageElectives: language === "en" ? "Manage Electives" : "Управление элективами",

    // Courses
    courses: language === "en" ? "Courses" : "Курсы",
    totalCourses: language === "en" ? "Courses in the system" : "Курсы в системе",
    manageCourses: language === "en" ? "Manage Courses" : "Управление курсами",

    // Programs
    programs: language === "en" ? "Programs" : "Программы",
    totalPrograms: language === "en" ? "Academic programs configured" : "Настроенные академические программы",
    managePrograms: language === "en" ? "Manage Programs" : "Управление программами",

    // Groups
    groups: language === "en" ? "Groups" : "Группы",
    totalGroups: language === "en" ? "Student groups created" : "Созданные группы студентов",
    manageGroups: language === "en" ? "Manage Groups" : "Управление группами",

    // Degrees
    degrees: language === "en" ? "Degrees" : "Степени",
    totalDegrees: language === "en" ? "Degree types available" : "Доступные типы степеней",
    manageDegrees: language === "en" ? "Manage Degrees" : "Управление степенями",

    // Users
    users: language === "en" ? "Users" : "Пользователи",
    totalUsers: language === "en" ? "Total users in the system" : "Всего пользователей в системе",
    manageUsers: language === "en" ? "Manage Users" : "Управление пользователями",
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
          <p className="text-muted-foreground">{translations.welcome}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Electives Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.electives}</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">{translations.totalElectives}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/electives">{translations.manageElectives}</Link>
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

          {/* Degrees Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.degrees}</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">{translations.totalDegrees}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/degrees">{translations.manageDegrees}</Link>
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
