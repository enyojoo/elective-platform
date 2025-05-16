"use client"

import { useInstitution } from "@/lib/institution-context"
import { useEffect } from "react"
import { DEFAULT_FAVICON_URL, DEFAULT_PRIMARY_COLOR } from "@/lib/constants"

export function DynamicBranding() {
  const { institution } = useInstitution()

  useEffect(() => {
    if (institution) {
      // Apply primary color as CSS variable
      if (institution.primary_color) {
        document.documentElement.style.setProperty("--primary", institution.primary_color)

        // Also set primary color for compatibility with different components
        const primaryRgb = hexToRgb(institution.primary_color)
        if (primaryRgb) {
          document.documentElement.style.setProperty(
            "--primary-rgb",
            `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
          )
        }
      } else {
        // Use default primary color if not set
        document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
        const defaultRgb = hexToRgb(DEFAULT_PRIMARY_COLOR)
        if (defaultRgb) {
          document.documentElement.style.setProperty(
            "--primary-rgb",
            `${defaultRgb.r}, ${defaultRgb.g}, ${defaultRgb.b}`,
          )
        }
      }

      // Update favicon if available
      const faviconUrl = institution.favicon_url || DEFAULT_FAVICON_URL
      const existingFavicon = document.querySelector("link[rel='icon']")
      if (existingFavicon) {
        existingFavicon.setAttribute("href", faviconUrl)
      } else {
        const favicon = document.createElement("link")
        favicon.rel = "icon"
        favicon.href = faviconUrl
        document.head.appendChild(favicon)
      }

      // Also update apple-touch-icon
      const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
      if (existingAppleIcon) {
        existingAppleIcon.setAttribute("href", faviconUrl)
      } else {
        const appleIcon = document.createElement("link")
        appleIcon.rel = "apple-touch-icon"
        appleIcon.href = faviconUrl
        document.head.appendChild(appleIcon)
      }
    }
  }, [institution])

  // Helper function to convert hex color to RGB
  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : null
  }

  return null
}
