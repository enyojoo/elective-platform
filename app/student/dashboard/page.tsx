"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { UserRole } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, ClipboardList, AlertCircle } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useInstitution } from "@/lib/institution-context"
import { useRouter } from "next/navigation"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function StudentDashboard() {
  const { t, language } = useLanguage()
  const { institution, isSubdomainAccess } = useInstitution()
  const router = useRouter()

  const { profile, isLoading: isProfileLoading, error: profileError } = useCachedStudentProfile()

  // Ensure this page is only accessed via subdomain
  useEffect(() => {
    if (!isSubdomainAccess) {
      router.push("/institution-required")
    }
  }, [isSubdomainAccess, router])

  if (!isSubdomainAccess) {
    return null
  }

  if (isProfileLoading) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        <PageSkeleton type="dashboard" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {profile?.full_name || "Student"}</h1>
          <p className="text-muted-foreground">Here's your academic overview</p>
        </div>

        {profileError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Required Electives</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">0 courses, 0 exchange</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Electives</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">0 courses, 0 exchange</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Selections</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">0 courses, 0 exchange</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Your Academic Details</CardTitle>
              <CardDescription>Your student information</CardDescription>
            </CardHeader>
            <CardContent>
              {isProfileLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : (
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="font-medium">Name:</dt>
                    <dd>{profile?.full_name || "Not specified"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Degree:</dt>
                    <dd>{profile?.degree?.name || "Not specified"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Year:</dt>
                    <dd>{profile?.year || "Not specified"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Group:</dt>
                    <dd>{profile?.group?.name || "Not assigned"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Email:</dt>
                    <dd>{profile?.email || "Not specified"}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Important dates to remember</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">No upcoming deadlines</div>
            </CardContent>
          </Card>
        </div>

        {/* Debug info */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
