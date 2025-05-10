"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Compass, GraduationCap, Home, Search, UserCog } from "lucide-react"
import Link from "next/link"
import { useInstitution } from "@/lib/institution-context"

export default function NotFoundPage() {
  const { t, language, setLanguage } = useLanguage()
  const { isSubdomainAccess } = useInstitution()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ru" : "en")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-primary/10">404</div>
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

        <div className="mt-8 space-y-4">
          {isSubdomainAccess ? (
            <>
              <Button asChild className="w-full">
                <Link href="/student/dashboard">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {t("notFound.backToStudentApp")}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/manager/dashboard">
                  <UserCog className="mr-2 h-4 w-4" />
                  {t("notFound.backToManagerApp")}
                </Link>
              </Button>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link href="/admin/dashboard">
                <Home className="mr-2 h-4 w-4" />
                {t("notFound.backToDashboard")}
              </Link>
            </Button>
          )}
        </div>

        {/* Language Switcher - styled like the one on admin login */}
        <div className="mt-8 pt-4 border-t border-border">
          <button
            onClick={toggleLanguage}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            type="button"
          >
            {language === "en" ? "Русский" : "English"}
          </button>
        </div>
      </div>
    </div>
  )
}
