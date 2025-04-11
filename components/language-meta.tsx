"use client"

import { useLanguage } from "@/lib/language-context"
import { useEffect } from "react"

export function LanguageMeta() {
  const { language } = useLanguage()

  useEffect(() => {
    // Get the existing meta description tag
    const metaDescription = document.querySelector('meta[name="description"]')

    if (metaDescription) {
      // Update the content based on the selected language
      if (language === "ru") {
        metaDescription.setAttribute("content", "Платформа выбора элективных курсов Высшей Школы Менеджмента, СПбГУ")
      } else {
        metaDescription.setAttribute(
          "content",
          "Elective Course Selection Platform for Graduate School of Management, SPbU",
        )
      }
    }
  }, [language])

  // This component doesn't render anything visible
  return null
}
