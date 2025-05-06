"use client"

import { useInstitution } from "@/lib/institution-context"
import { useEffect } from "react"

export function DynamicBranding() {
  const { institution } = useInstitution()

  useEffect(() => {
    if (institution) {
      // Apply primary color to CSS variables
      if (institution.primary_color) {
        document.documentElement.style.setProperty("--primary", institution.primary_color)

        // Also set the color for primary foreground if needed
        const primaryRgb = hexToRgb(institution.primary_color)
        if (primaryRgb) {
          // Set the primary foreground color to be either white or black depending on the brightness
          const brightness = (primaryRgb.r * 299 + primaryRgb.g * 587 + primaryRgb.b * 114) / 1000
          const foregroundColor = brightness > 128 ? "#000000" : "#ffffff"
          document.documentElement.style.setProperty("--primary-foreground", foregroundColor)
        }
      }

      // Apply secondary color if available
      if (institution.secondary_color) {
        document.documentElement.style.setProperty("--secondary", institution.secondary_color)
      }

      // Set favicon dynamically
      if (institution.favicon_url) {
        const existingFavicon = document.querySelector('link[rel="icon"]')
        if (existingFavicon) {
          existingFavicon.setAttribute("href", institution.favicon_url)
        } else {
          const favicon = document.createElement("link")
          favicon.rel = "icon"
          favicon.href = institution.favicon_url
          document.head.appendChild(favicon)
        }

        // Also update apple-touch-icon
        const existingAppleIcon = document.querySelector('link[rel="apple-touch-icon"]')
        if (existingAppleIcon) {
          existingAppleIcon.setAttribute("href", institution.favicon_url)
        } else {
          const appleIcon = document.createElement("link")
          appleIcon.rel = "apple-touch-icon"
          appleIcon.href = institution.favicon_url
          document.head.appendChild(appleIcon)
        }
      }

      // Set document title to include institution name
      if (institution.name) {
        document.title = `${institution.name} | ElectivePRO`
      }
    }
  }, [institution])

  return null
}

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
