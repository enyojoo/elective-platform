"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Language = "en" | "ru"

interface Translations {
  [key: string]: {
    en: string
    ru: string
  }
}

const translations: Translations = {
  // Existing translations...

  // Exchange universities
  exchange_universities: {
    en: "Exchange Universities",
    ru: "Университеты по обмену",
  },
  add_university: {
    en: "Add University",
    ru: "Добавить университет",
  },
  edit_university: {
    en: "Edit University",
    ru: "Редактировать университет",
  },
  name: {
    en: "Name",
    ru: "Название",
  },
  country: {
    en: "Country",
    ru: "Страна",
  },
  city: {
    en: "City",
    ru: "Город",
  },
  language: {
    en: "Language",
    ru: "Язык",
  },
  max_students: {
    en: "Max Students",
    ru: "Макс. студентов",
  },
  actions: {
    en: "Actions",
    ru: "Действия",
  },
  view: {
    en: "View",
    ru: "Просмотр",
  },
  edit: {
    en: "Edit",
    ru: "Редактировать",
  },
  delete: {
    en: "Delete",
    ru: "Удалить",
  },
  confirm_delete: {
    en: "Confirm Delete",
    ru: "Подтвердите удаление",
  },
  delete_university_confirmation: {
    en: "Are you sure you want to delete this university? This action cannot be undone.",
    ru: "Вы уверены, что хотите удалить этот университет? Это действие нельзя отменить.",
  },
  cancel: {
    en: "Cancel",
    ru: "Отмена",
  },
  success: {
    en: "Success",
    ru: "Успех",
  },
  error: {
    en: "Error",
    ru: "Ошибка",
  },
  university_deleted: {
    en: "University deleted successfully",
    ru: "Университет успешно удален",
  },
  university_delete_error: {
    en: "Failed to delete university",
    ru: "Не удалось удалить университет",
  },
  university_created: {
    en: "University created successfully",
    ru: "Университет успешно создан",
  },
  university_create_error: {
    en: "Failed to create university",
    ru: "Не удалось создать университет",
  },
  university_updated: {
    en: "University updated successfully",
    ru: "Университет успешно обновлен",
  },
  university_update_error: {
    en: "Failed to update university",
    ru: "Не удалось обновить университет",
  },
  name_required: {
    en: "Name is required",
    ru: "Необходимо указать название",
  },
  country_required: {
    en: "Country is required",
    ru: "Необходимо указать страну",
  },
  city_required: {
    en: "City is required",
    ru: "Необходимо указать город",
  },
  max_students_positive: {
    en: "Max students must be a positive number",
    ru: "Максимальное количество студентов должно быть положительным числом",
  },
  elective_pack: {
    en: "Elective Pack",
    ru: "Пакет элективов",
  },
  select_elective_pack: {
    en: "Select an elective pack",
    ru: "Выберите пакет элективов",
  },
  select_country: {
    en: "Select a country",
    ru: "Выберите страну",
  },
  language_description: {
    en: "Primary language of instruction",
    ru: "Основной язык обучения",
  },
  max_students_description: {
    en: "Maximum number of students that can be accepted",
    ru: "Максимальное количество студентов, которые могут быть приняты",
  },
  description: {
    en: "Description",
    ru: "Описание",
  },
  website_url: {
    en: "Website URL",
    ru: "URL веб-сайта",
  },
  logo_url: {
    en: "Logo URL",
    ru: "URL логотипа",
  },
  status: {
    en: "Status",
    ru: "Статус",
  },
  select_status: {
    en: "Select status",
    ru: "Выберите статус",
  },
  active: {
    en: "Active",
    ru: "Активный",
  },
  inactive: {
    en: "Inactive",
    ru: "Неактивный",
  },
  saving: {
    en: "Saving...",
    ru: "Сохранение...",
  },
  update: {
    en: "Update",
    ru: "Обновить",
  },
  create: {
    en: "Create",
    ru: "Создать",
  },
  search_universities: {
    en: "Search universities",
    ru: "Поиск университетов",
  },
  no_universities_found: {
    en: "No universities found",
    ru: "Университеты не найдены",
  },

  // Student exchange selection
  exchange_university_selection: {
    en: "Exchange University Selection",
    ru: "Выбор университета по обмену",
  },
  selected_universities: {
    en: "Selected Universities",
    ru: "Выбранные университеты",
  },
  available_universities: {
    en: "Available Universities",
    ru: "Доступные университеты",
  },
  drag_to_reorder: {
    en: "Drag to reorder your preferences",
    ru: "Перетащите, чтобы изменить порядок предпочтений",
  },
  max_selections: {
    en: "Maximum {count} selections",
    ru: "Максимум {count} выбора",
  },
  max_selections_reached: {
    en: "You can select maximum {count} universities",
    ru: "Вы можете выбрать максимум {count} университетов",
  },
  no_universities_selected: {
    en: "No universities selected",
    ru: "Университеты не выбраны",
  },
  add_to_selection: {
    en: "Add to Selection",
    ru: "Добавить к выбору",
  },
  remove: {
    en: "Remove",
    ru: "Удалить",
  },
  motivation_letter_url: {
    en: "Motivation Letter URL",
    ru: "URL мотивационного письма",
  },
  motivation_letter_url_description: {
    en: "Link to your motivation letter document",
    ru: "Ссылка на документ с мотивационным письмом",
  },
  transcript_url: {
    en: "Transcript URL",
    ru: "URL транскрипта",
  },
  transcript_url_description: {
    en: "Link to your academic transcript document",
    ru: "Ссылка на документ с академической выпиской",
  },
  submitting: {
    en: "Submitting...",
    ru: "Отправка...",
  },
  submit_selection: {
    en: "Submit Selection",
    ru: "Отправить выбор",
  },
  selection_submitted: {
    en: "Your selection has been submitted successfully",
    ru: "Ваш выбор успешно отправлен",
  },
  selection_submit_error: {
    en: "Failed to submit your selection",
    ru: "Не удалось отправить ваш выбор",
  },
  select_at_least_one_university: {
    en: "Please select at least one university",
    ru: "Пожалуйста, выберите хотя бы один университет",
  },

  // Exchange builder translations
  "manager.exchangeBuilder.deadline": {
    en: "Deadline",
    ru: "Крайний срок",
  },
  "manager.exchangeBuilder.universitiesPerStudent": {
    en: "universities per student",
    ru: "университетов на студента",
  },
  manager: {
    exchangeBuilder: {
      programInfo: {
        en: "Program Information",
        ru: "Информация о программе",
      },
      addUniversities: {
        en: "Add Universities",
        ru: "Добавить университеты",
      },
      programDetails: {
        en: "Review & Publish",
        ru: "Просмотр и публикация",
      },
    },
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, any>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  const t = (key: string, params?: Record<string, any>) => {
    const translation = translations[key]?.[language] || key

    if (params) {
      return Object.entries(params).reduce((acc, [key, value]) => {
        return acc.replace(new RegExp(`{${key}}`, "g"), String(value))
      }, translation)
    }

    return translation
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
