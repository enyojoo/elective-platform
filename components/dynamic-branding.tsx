"use client"

import { useInstitution, DEFAULT_FAVICON_URL, DEFAULT_PRIMARY_COLOR } from "@/lib/institution-context"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

// Default platform name
const DEFAULT_PLATFORM_NAME = "ElectivePRO"

export function DynamicBranding() {
  const { institution, isSubdomainAccess } = useInstitution()
  const pathname = usePathname()

  // Determine if we're in the admin section
  const isAdmin = pathname?.includes("/admin") || false

  useEffect(() => {
    // Log for debugging
    console.log("DynamicBranding: Checking if branding update is needed", {
      institution,
      isSubdomainAccess,
      primaryColor: institution?.primary_color,
      favicon: institution?.favicon_url,
      name: institution?.name,
      isAdmin,
    })

    // Get current values from DOM
    const currentPrimaryColor = document.documentElement.style.getPropertyValue("--primary")
    const currentFavicon = document.querySelector("link[rel='icon']")?.getAttribute("href")
    const currentTitle = document.title

    // For admin pages, always use the default color, favicon, and platform name
    if (isAdmin) {
      // Only update if values are different from current
      if (currentPrimaryColor !== DEFAULT_PRIMARY_COLOR) {
        console.log("DynamicBranding: Updating to default admin branding")
        document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
        document.documentElement.style.setProperty("--color-primary", DEFAULT_PRIMARY_COLOR)

        // Set RGB values for components that need them
        const primaryRgb = hexToRgb(DEFAULT_PRIMARY_COLOR)
        if (primaryRgb) {
          document.documentElement.style.setProperty(
            "--primary-rgb",
            `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
          )
        }
      }

      // Only update favicon if different
      if (currentFavicon !== DEFAULT_FAVICON_URL) {
        updateFavicon(DEFAULT_FAVICON_URL)
      }

      // Only update title if different
      if (currentTitle !== DEFAULT_PLATFORM_NAME) {
        document.title = DEFAULT_PLATFORM_NAME
      }
    }
    // For non-admin pages, use institution color, favicon, and name if available
    else if (institution) {
      // Apply primary color as CSS variable if different
      if (institution.primary_color && currentPrimaryColor !== institution.primary_color) {
        console.log("DynamicBranding: Updating to institution color:", institution.primary_color)
        document.documentElement.style.setProperty("--primary", institution.primary_color)
        document.documentElement.style.setProperty("--color-primary", institution.primary_color)

        // Also set primary color for compatibility with different components
        const primaryRgb = hexToRgb(institution.primary_color)
        if (primaryRgb) {
          document.documentElement.style.setProperty(
            "--primary-rgb",
            `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
          )
        }
      } else if (!institution.primary_color && currentPrimaryColor !== DEFAULT_PRIMARY_COLOR) {
        // If no institution color, use default
        document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
        document.documentElement.style.setProperty("--color-primary", DEFAULT_PRIMARY_COLOR)
      }

      // Update favicon if available and different
      const faviconToUse = institution.favicon_url || DEFAULT_FAVICON_URL
      if (currentFavicon !== faviconToUse) {
        updateFavicon(faviconToUse)
      }

      // Update page title with institution name if available and different
      if (institution.name && currentTitle !== institution.name) {
        console.log("DynamicBranding: Updating page title to institution name:", institution.name)
        document.title = institution.name
      }
    }
  }, [institution, isSubdomainAccess, isAdmin, pathname])

  // Extract favicon update logic to a separate function
  function updateFavicon(url: string) {
    console.log("DynamicBranding: Updating favicon to:", url)

    // Update icon
    const existingFavicon = document.querySelector("link[rel='icon']")
    if (existingFavicon) {
      existingFavicon.setAttribute("href", url)
    } else {
      const favicon = document.createElement("link")
      favicon.rel = "icon"
      favicon.href = url
      document.head.appendChild(favicon)
    }

    // Update apple-touch-icon
    const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
    if (existingAppleIcon) {
      existingAppleIcon.setAttribute("href", url)
    } else {
      const appleIcon = document.createElement("link")
      appleIcon.rel = "apple-touch-icon"
      appleIcon.href = url
      document.head.appendChild(appleIcon)
    }

    // Update shortcut icon
    const existingShortcutIcon = document.querySelector("link[rel='shortcut icon']")
    if (existingShortcutIcon) {
      existingShortcutIcon.setAttribute("href", url)
    } else {
      const shortcutIcon = document.createElement("link")
      shortcutIcon.rel = "shortcut icon"
      shortcutIcon.href = url
      document.head.appendChild(shortcutIcon)
    }
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

  return null
}
