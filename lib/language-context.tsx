"use client"

import { createContext, useContext, useState, type ReactNode, useCallback, useEffect } from "react"

type Language = "en" | "ru"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

type TranslationDictionary = {
  [key: string]: string
}

type Translations = {
  en: TranslationDictionary
  ru: TranslationDictionary
}

const LANGUAGE_STORAGE_KEY = "epro-language"

const translations: Translations = {
  en: {
    // Existing translations...
    "home.title": "ElectivePRO",
    // ... other existing translations

    // Course form placeholders - all in English
    "admin.newCourse.nameEnPlaceholder": "Strategic Management",
    "admin.newCourse.nameRuPlaceholder": "Course name in Russian",
    "admin.newCourse.instructorEnPlaceholder": "Prof. John Smith",
    "admin.newCourse.instructorRuPlaceholder": "Instructor name in Russian",
    "admin.newCourse.descriptionEnPlaceholder": "Course description in English",
    "admin.newCourse.descriptionRuPlaceholder": "Course description in Russian",
  },
  ru: {
    "home.title": "ElectivePRO",
    // ... other existing translations

    // Course form placeholders - all in Russian
    "admin.newCourse.nameEnPlaceholder": "Название курса на английском",
    "admin.newCourse.nameRuPlaceholder": "Стратегический менеджмент",
    "admin.newCourse.instructorEnPlaceholder": "Имя преподавателя на английском",
    "admin.newCourse.instructorRuPlaceholder": "Проф. Иван Смирнов",
    "admin.newCourse.descriptionEnPlaceholder": "Описание курса на английском",
    "admin.newCourse.descriptionRuPlaceholder": "Описание курса на русском",
  },
}

// Helper function to detect browser language
const detectBrowserLanguage = (): "en" | "ru" => {
  if (typeof window === "undefined") return "en" // Default for SSR

  const browserLang = navigator.language.toLowerCase().split("-")[0]
  return browserLang === "ru" ? "ru" : "en"
}

// Helper function to get stored language preference
const getStoredLanguage = (): "en" | "ru" | null => {
  if (typeof window === "undefined") return null // Return null for SSR

  try {
    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return storedLang === "ru" ? "ru" : storedLang === "en" ? "en" : null
  } catch (error) {
    console.error("Error accessing localStorage:", error)
    return null
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with a placeholder, will be updated in useEffect
  const [language, setLanguageState] = useState<"en" | "ru">("en")
  const [isInitialized, setIsInitialized] = useState(false)

  // Custom setter that also updates localStorage
  const setLanguage = useCallback((newLanguage: "en" | "ru") => {
    setLanguageState(newLanguage)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage)
    } catch (error) {
      console.error("Error setting localStorage:", error)
    }
  }, [])

  // Initialize language based on stored preference or browser language
  useEffect(() => {
    if (!isInitialized) {
      const storedLang = getStoredLanguage()
      const initialLang = storedLang || detectBrowserLanguage()
      setLanguageState(initialLang)
      setIsInitialized(true)
    }
  }, [isInitialized])

  const t = useCallback(
    (key: string) => {
      const dict = translations[language] || translations.en
      return dict[key] || key
    },
    [language],
  )

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
