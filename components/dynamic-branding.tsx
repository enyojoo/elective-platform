"use client"

import { useInstitution } from "@/lib/institution-context"
import { useEffect } from "react"

// Updated default favicon URL
const DEFAULT_FAVICON_URL =
  "https://pbqvvvdhssghkpvsluvw.supabase.co/storage/v1/object/public/favicons//epro_favicon.svg"

export function DynamicBranding() {
  const { institution, isSubdomainAccess } = useInstitution()

  useEffect(() => {
    // Log for debugging
    console.log("DynamicBranding: Applying branding", {
      institution,
      isSubdomainAccess,
      primaryColor: institution?.primary_color,
    })

    if (institution) {
      // Apply primary color as CSS variable
      if (institution.primary_color) {
        console.log("DynamicBranding: Setting primary color to", institution.primary_color)
        document.documentElement.style.setProperty("--primary", institution.primary_color)

        // Also set primary color for compatibility with different components
        const primaryRgb = hexToRgb(institution.primary_color)
        if (primaryRgb) {
          document.documentElement.style.setProperty(
            "--primary-rgb",
            `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
          )
        }

        // Set the color as a CSS custom property for Tailwind to use
        document.documentElement.style.setProperty("--color-primary", institution.primary_color)
      }

      // Update favicon if available
      if (institution.favicon_url) {
        const existingFavicon = document.querySelector("link[rel='icon']")
        if (existingFavicon) {
          existingFavicon.setAttribute("href", institution.favicon_url)
        } else {
          const favicon = document.createElement("link")
          favicon.rel = "icon"
          favicon.href = institution.favicon_url
          document.head.appendChild(favicon)
        }

        // Also update apple-touch-icon
        const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
        if (existingAppleIcon) {
          existingAppleIcon.setAttribute("href", institution.favicon_url)
        } else {
          const appleIcon = document.createElement("link")
          appleIcon.rel = "apple-touch-icon"
          appleIcon.href = institution.favicon_url
          document.head.appendChild(appleIcon)
        }
      } else {
        // Set default favicon if institution doesn't have one
        const existingFavicon = document.querySelector("link[rel='icon']")
        if (existingFavicon) {
          existingFavicon.setAttribute("href", DEFAULT_FAVICON_URL)
        }
      }
    }
  }, [institution, isSubdomainAccess])

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
