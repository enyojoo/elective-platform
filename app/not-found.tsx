"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { ArrowLeft, Compass, Home, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useInstitution } from "@/lib/institution-context"

export default function NotFoundPage() {
  const { t } = useLanguage()
  const { isSubdomainAccess } = useInstitution()
  const [dashboardUrl, setDashboardUrl] = useState("/admin/dashboard")

  useEffect(() => {
    // Determine the appropriate dashboard URL based on subdomain access
    if (isSubdomainAccess) {
      // Check if user is a student or manager (simplified logic)
      // In a real app, you might want to check the user's role from auth context
      const isStudent = localStorage.getItem("userRole") === "student"
      setDashboardUrl(isStudent ? "/student/dashboard" : "/manager/dashboard")
    } else {
      setDashboardUrl("/admin/dashboard")
    }
  }, [isSubdomainAccess])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="relative h-40 w-full mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-9xl font-bold text-primary/10">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/confused-student.png"
                alt="Lost student"
                width={160}
                height={160}
                className="rounded-full border-4 border-background"
              />
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight">{t("notFound.title")}</h1>
        <p className="text-xl text-muted-foreground mt-2">{t("notFound.subtitle")}</p>

        <div className="mt-6 bg-card rounded-lg p-6 shadow-md">
          <h2 className="text-lg font-medium mb-4">{t("notFound.suggestions")}</h2>
          <ul className="space-y-3 text-left">
            <li className="flex items-start">
              <Compass className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
              <span>{t("notFound.suggestion1")}</span>
            </li>
            <li className="flex items-start">
              <Search className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
              <span>{t("notFound.suggestion2")}</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild className="flex-1">
            <Link href={dashboardUrl}>
              <Home className="mr-2 h-4 w-4" />
              {t("notFound.backToDashboard")}
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("notFound.goBack")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
