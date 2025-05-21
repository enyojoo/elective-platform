import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return ""

  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function calculateDaysLeft(dateString: string): number {
  if (!dateString) return 0

  const targetDate = new Date(dateString)
  const currentDate = new Date()

  // Reset time part for accurate day calculation
  targetDate.setHours(0, 0, 0, 0)
  currentDate.setHours(0, 0, 0, 0)

  // Calculate difference in milliseconds
  const differenceMs = targetDate.getTime() - currentDate.getTime()

  // Convert to days
  return Math.ceil(differenceMs / (1000 * 60 * 60 * 24))
}
