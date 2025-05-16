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
      title: {
        en: "Create Exchange Program",
        ru: "Создать программу обмена",
      },
      draft: {
        en: "Draft",
        ru: "Черновик",
      },
      step: {
        en: "Step",
        ru: "Шаг",
      },
      of: {
        en: "of",
        ru: "из",
      },
      semester: {
        en: "Semester",
        ru: "Семестр",
      },
      selectSemester: {
        en: "Select semester",
        ru: "Выберите семестр",
      },
      year: {
        en: "Year",
        ru: "Год",
      },
      selectYear: {
        en: "Select year",
        ru: "Выберите год",
      },
      namePreview: {
        en: "Program Name Preview",
        ru: "Предпросмотр названия программы",
      },
      selectionRules: {
        en: "Selection Rules",
        ru: "Правила выбора",
      },
      maxSelections: {
        en: "Maximum Selections",
        ru: "Максимальное количество выборов",
      },
      universitiesPerStudent: {
        en: "universities per student",
        ru: "университетов на студента",
      },
      deadline: {
        en: "Deadline",
        ru: "Крайний срок",
      },
      statementUpload: {
        en: "Statement Upload",
        ru: "Загрузка заявления",
      },
      statementDescription: {
        en: "Upload a blank statement file that students will download, sign, and re-upload.",
        ru: "Загрузите пустой файл заявления, который студенты скачают, подпишут и загрузят обратно.",
      },
      uploadStatementFile: {
        en: "Upload Statement File (PDF)",
        ru: "Загрузить файл заявления (PDF)",
      },
      next: {
        en: "Next",
        ru: "Далее",
      },
      searchUniversities: {
        en: "Search universities...",
        ru: "Поиск университетов...",
      },
      universitiesSelected: {
        en: "universities selected",
        ru: "выбрано университетов",
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
      maxStudents: {
        en: "Max Students",
        ru: "Макс. студентов",
      },
      noUniversitiesAvailable: {
        en: "No universities available. Please add universities first.",
        ru: "Нет доступных университетов. Пожалуйста, сначала добавьте университеты.",
      },
      noUniversitiesFound: {
        en: "No universities found matching your search.",
        ru: "Не найдено университетов, соответствующих вашему запросу.",
      },
      back: {
        en: "Back",
        ru: "Назад",
      },
      programName: {
        en: "Program Name",
        ru: "Название программы",
      },
      maxSelectionsLabel: {
        en: "Max Selections",
        ru: "Макс. выборов",
      },
      selectedUniversities: {
        en: "Selected Universities",
        ru: "Выбранные университеты",
      },
      noUniversitiesSelected: {
        en: "No Universities Selected",
        ru: "Университеты не выбраны",
      },
      goBackToAdd: {
        en: "Go back to add universities to this exchange program.",
        ru: "Вернитесь назад, чтобы добавить университеты в эту программу обмена.",
      },
      saving: {
        en: "Saving...",
        ru: "Сохранение...",
      },
      saveAsDraft: {
        en: "Save as Draft",
        ru: "Сохранить как черновик",
      },
      publishing: {
        en: "Publishing...",
        ru: "Публикация...",
      },
      publishProgram: {
        en: "Publish Program",
        ru: "Опубликовать программу",
      },
      error: {
        en: "Error",
        ru: "Ошибка",
      },
      errorFetchingData: {
        en: "Failed to fetch data",
        ru: "Не удалось получить данные",
      },
      errorFetchingUniversities: {
        en: "Failed to fetch universities",
        ru: "Не удалось получить список университетов",
      },
      uploadSuccess: {
        en: "File uploaded",
        ru: "Файл загружен",
      },
      uploadError: {
        en: "Upload failed",
        ru: "Ошибка загрузки",
      },
      uploadErrorDesc: {
        en: "Failed to upload file",
        ru: "Не удалось загрузить файл",
      },
      missingInfo: {
        en: "Missing Information",
        ru: "Отсутствует информация",
      },
      requiredFields: {
        en: "Please fill in all required fields",
        ru: "Пожалуйста, заполните все обязательные поля",
      },
      universityRequired: {
        en: "At least one university must be selected",
        ru: "Необходимо выбрать хотя бы один университет",
      },
      draftSaved: {
        en: "Draft Saved",
        ru: "Черновик сохранен",
      },
      programPublished: {
        en: "Program Published",
        ru: "Программа опубликована",
      },
      successDesc: {
        en: "Exchange program has been created successfully",
        ru: "Программа обмена успешно создана",
      },
      errorCreating: {
        en: "Failed to create exchange program",
        ru: "Не удалось создать программу обмена",
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
