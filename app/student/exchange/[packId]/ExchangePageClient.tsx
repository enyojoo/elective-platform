"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCachedStudentProfile } from "@/hooks/use-cached-student-profile"
import { PageSkeleton } from "@/components/ui/page-skeleton" // Or a relevant skeleton
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout" // If it uses this layout
import { UserRole } from "@/lib/types"

interface ExchangePageClientProps {
  packId: string
}

const ExchangePageClient: React.FC<ExchangePageClientProps> = ({ packId }) => {
  const router = useRouter()
  const { profile, isLoading: isLoadingProfile, error: profileError } = useCachedStudentProfile()
  // Add any other state this component needs, e.g., for exchange data
  const [isLoadingPageData, setIsLoadingPageData] = useState(true) // For page-specific data

  useEffect(() => {
    if (!isLoadingProfile && !profile && !profileError) {
      router.push("/student/login")
    }
  }, [profile, isLoadingProfile, profileError, router])

  if (isLoadingProfile || (!profile && !profileError)) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        {" "}
        {/* Adjust layout if different */}
        <PageSkeleton />
      </DashboardLayout>
    )
  }

  if (profileError) {
    return (
      <DashboardLayout userRole={UserRole.STUDENT}>
        {" "}
        {/* Adjust layout if different */}
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Profile</AlertTitle>
            <AlertDescription>{profileError}</AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    )
  }

  // If profile is loaded, proceed to fetch/display exchange data
  // Example:
  // if (isLoadingPageData) {
  //   return <DashboardLayout userRole={UserRole.STUDENT}><PageSkeleton /></DashboardLayout>;
  // }

  return (
    <DashboardLayout userRole={UserRole.STUDENT}>
      <div>
        <h1>Exchange Pack ID: {packId}</h1>
        {/* Your component's actual JSX */}
      </div>
    </DashboardLayout>
  )
}

export default ExchangePageClient
