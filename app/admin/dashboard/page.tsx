"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Users, GraduationCap, BookOpen, Globe, Layers, Building } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { Skeleton } from "@/components/ui/skeleton"
import { useCachedUsers } from "@/hooks/use-cached-users"
import { useCachedPrograms } from "@/hooks/use-cached-programs"
import { useCachedCourses } from "@/hooks/use-cached-courses"
import { useCachedGroups } from "@/hooks/use-cached-groups"
import { useCachedElectives } from "@/hooks/use-cached-electives"

export default function AdminDashboard() {
  const { t, language } = useLanguage()
  const { institution } = useInstitution()
  const { data: users, isInitialized: usersInitialized } = useCachedUsers(institution?.id)
  const { data: programs, isInitialized: programsInitialized } = useCachedPrograms(institution?.id)
  const { data: courses, isInitialized: coursesInitialized } = useCachedCourses(institution?.id)
  const { data: groups, isInitialized: groupsInitialized } = useCachedGroups(institution?.id)
  const { data: electives, isInitialized: electivesInitialized } = useCachedElectives(institution?.id)

  const [isLoading, setIsLoading] = useState(true)

  // Set loading state based on all data initialization
  useEffect(() => {
    if (usersInitialized && programsInitialized && coursesInitialized && groupsInitialized && electivesInitialized) {
      setIsLoading(false)
    }
  }, [usersInitialized, programsInitialized, coursesInitialized, groupsInitialized, electivesInitialized])

  const translations = {
    title: language === "en" ? "Dashboard" : "Панель управления",

    // Course Electives
    courseElectives: language === "en" ? "Course Electives" : "Элективные курсы",
    totalCourseElectives: language === "en" ? "Total course elective selections" : "Всего выборов элективных курсов",
    manageCourseElectives: language === "en" ? "Manage" : "Управлять",

    // Exchange Programs
    exchangePrograms: language === "en" ? "Exchange Programs" : "Программы обмена",
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

    // Universities
    universities: language === "en" ? "Universities" : "Университеты",
    totalUniversities: language === "en" ? "Total universities in the system" : "Всего университетов в системе",
    manageUniversities: language === "en" ? "Manage" : "Управлять",
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-[200px]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-[50px] mb-1" />
                  <Skeleton className="h-4 w-[180px] mb-4" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
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
              <div className="text-2xl font-bold">{electives?.filter((e) => e.type === "course")?.length || 24}</div>
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
              <div className="text-2xl font-bold">{electives?.filter((e) => e.type === "exchange")?.length || 8}</div>
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
              <div className="text-2xl font-bold">{courses?.length || 42}</div>
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
              <div className="text-2xl font-bold">{programs?.length || 8}</div>
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
              <div className="text-2xl font-bold">{groups?.length || 16}</div>
              <p className="text-xs text-muted-foreground">{translations.totalGroups}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/groups">{translations.manageGroups}</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Universities Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{translations.universities}</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{8}</div>
              <p className="text-xs text-muted-foreground">{translations.totalUniversities}</p>
              <Button asChild className="w-full mt-4" size="sm">
                <Link href="/admin/universities">{translations.manageUniversities}</Link>
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
              <div className="text-2xl font-bold">{users?.length || 156}</div>
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
