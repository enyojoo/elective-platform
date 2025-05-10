"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { BookOpen, Coffee, Home, Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function NotFound() {
  const { t } = useLanguage()
  const [randomTip, setRandomTip] = useState<number>(0)

  // Fun educational facts about universities
  const educationalFacts = [
    t("notFound.fact1"),
    t("notFound.fact2"),
    t("notFound.fact3"),
    t("notFound.fact4"),
    t("notFound.fact5"),
  ]

  useEffect(() => {
    // Pick a random educational fact
    setRandomTip(Math.floor(Math.random() * educationalFacts.length))
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-9xl font-extrabold tracking-tighter text-primary">404</h1>
          <h2 className="text-3xl font-bold tracking-tight">{t("notFound.title")}</h2>
          <p className="text-muted-foreground">{t("notFound.description")}</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t("notFound.didYouKnow")}</span>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm border">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <p className="italic text-card-foreground">{educationalFacts[randomTip]}</p>
          <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
            <Coffee className="h-4 w-4 mr-1" />
            <span>{t("notFound.funFact")}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t("notFound.goHome")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/login">
              <Search className="mr-2 h-4 w-4" />
              {t("notFound.findCourses")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
