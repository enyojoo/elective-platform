"use client"

import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Globe } from "lucide-react"

export function AuthLanguageSwitcher() {
  const [language, setLanguage] = useState<"en" | "ru">("en")

  useEffect(() => {
    // Try to get the language from localStorage
    try {
      const storedLang = localStorage.getItem("gsom-timetable-language")
      if (storedLang === "ru" || storedLang === "en") {
        setLanguage(storedLang)
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
  }, [])

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ru" : "en"
    setLanguage(newLanguage)
    try {
      localStorage.setItem("gsom-timetable-language", newLanguage)
    } catch (error) {
      console.error("Error setting localStorage:", error)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleLanguage} className="w-20 font-medium flex items-center gap-1">
      <Globe className="h-4 w-4" />
      {language.toUpperCase()}
    </Button>
  )
}
