"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/language-context"
import { Globe } from "lucide-react"

export function AuthLanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ru" : "en")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="w-20 font-medium flex items-center gap-1"
      aria-label={t("language.switch")}
    >
      <Globe className="h-4 w-4" />
      {language.toUpperCase()}
    </Button>
  )
}
