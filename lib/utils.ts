import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to a localized format
 * @param dateString - The date string to format
 * @param locale - The locale to use for formatting (defaults to 'en-US')
 * @returns Formatted date string
 */
export function formatDate(dateString: string, locale = "en-US"): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return ""
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date)
  } catch (error) {
    console.error("Error formatting date:", error)
    return ""
  }
}

/**
 * Calculates the number of days left until a given date
 * @param dateString - The target date string
 * @returns Number of days left (0 if date is invalid or in the past)
 */
export function calculateDaysLeft(dateString: string): number {
  if (!dateString) return 0

  try {
    const targetDate = new Date(dateString)
    const currentDate = new Date()

    // Reset time portion for accurate day calculation
    targetDate.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)

    // Check if date is valid
    if (isNaN(targetDate.getTime())) {
      return 0
    }

    // Calculate difference in milliseconds and convert to days
    const differenceMs = targetDate.getTime() - currentDate.getTime()
    const daysLeft = Math.ceil(differenceMs / (1000 * 60 * 60 * 24))

    // Return 0 if date is in the past
    return Math.max(0, daysLeft)
  } catch (error) {
    console.error("Error calculating days left:", error)
    return 0
  }
}
