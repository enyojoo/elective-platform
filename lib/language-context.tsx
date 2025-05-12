"use client"

import * as React from "react"

type Language = "en" | "ru"

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: React.ReactNode
}

const translations = {
  en: {
    "common.hello": "Hello",
  },
  ru: {
    "common.hello": "Привет",
  },
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = React.useState<Language>("en")

  React.useEffect(() => {
    const storedLanguage = localStorage.getItem("language") as Language | null
    if (storedLanguage) {
      setLanguage(storedLanguage)
    }
  }, [])

  React.useEffect(() => {
    localStorage.setItem("language", language)
  }, [language])

  const t = React.useCallback(
    (key: string) => {
      return translations[language][key] || key
    },
    [language],
  )

  const value = React.useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
