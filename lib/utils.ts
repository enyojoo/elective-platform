import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add the missing formatDate function
export function formatDate(dateString: string, locale = "en-US"): string {
  try {
    if (!dateString) return "Invalid date"

    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) return "Invalid date"

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid date"
  }
}

// Add the missing calculateDaysLeft function
export function calculateDaysLeft(targetDateString: string): number {
  try {
    if (!targetDateString) return 0

    const targetDate = new Date(targetDateString)

    // Check if date is valid
    if (isNaN(targetDate.getTime())) return 0

    // Remove time portion for accurate day calculation
    const today = new Date()
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const normalizedTarget = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())

    // Calculate difference in milliseconds and convert to days
    const diffTime = normalizedTarget.getTime() - normalizedToday.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Return 0 if the date is in the past
    return Math.max(0, diffDays)
  } catch (error) {
    console.error("Error calculating days left:", error)
    return 0
  }
}
