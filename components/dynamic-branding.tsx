"use client"

import { useInstitution, DEFAULT_FAVICON_URL, DEFAULT_PRIMARY_COLOR } from "@/lib/institution-context"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

// Default platform name
const DEFAULT_PLATFORM_NAME = "ElectivePRO"

export function DynamicBranding() {
  const { institution, isSubdomainAccess } = useInstitution()
  const pathname = usePathname()
  const hasAppliedBranding = useRef(false)

  // Determine if we're in the admin section
  const isAdmin = pathname?.includes("/admin") || false

  useEffect(() => {
    // Skip if we've already applied branding and nothing has changed
    if (
      hasAppliedBranding.current &&
      !pathname?.includes("/admin") &&
      document.documentElement.style.getPropertyValue("--primary") ===
        (institution?.primary_color || DEFAULT_PRIMARY_COLOR)
    ) {
      return
    }

    // Log for debugging
    console.log("DynamicBranding: Applying branding", {
      institution,
      isSubdomainAccess,
      primaryColor: institution?.primary_color,
      favicon: institution?.favicon_url,
      name: institution?.name,
      isAdmin,
    })

    // For admin pages, always use the default color, favicon, and platform name
    if (isAdmin) {
      console.log("DynamicBranding: Using default branding for admin page")
      document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
      document.documentElement.style.setProperty("--color-primary", DEFAULT_PRIMARY_COLOR)

      // Set RGB values for components that need them
      const primaryRgb = hexToRgb(DEFAULT_PRIMARY_COLOR)
      if (primaryRgb) {
        document.documentElement.style.setProperty("--primary-rgb", `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
      }

      // Set default favicon for admin pages
      const existingFavicon = document.querySelector("link[rel='icon']")
      if (existingFavicon) {
        existingFavicon.setAttribute("href", DEFAULT_FAVICON_URL)
      } else {
        const favicon = document.createElement("link")
        favicon.rel = "icon"
        favicon.href = DEFAULT_FAVICON_URL
        document.head.appendChild(favicon)
      }

      // Also update apple-touch-icon
      const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
      if (existingAppleIcon) {
        existingAppleIcon.setAttribute("href", DEFAULT_FAVICON_URL)
      } else {
        const appleIcon = document.createElement("link")
        appleIcon.rel = "apple-touch-icon"
        appleIcon.href = DEFAULT_FAVICON_URL
        document.head.appendChild(appleIcon)
      }

      // Set default platform name for admin pages
      document.title = DEFAULT_PLATFORM_NAME
    }
    // For non-admin pages, use institution color, favicon, and name if available
    else if (institution) {
      // Apply primary color as CSS variable
      if (institution.primary_color) {
        console.log("DynamicBranding: Setting institution color:", institution.primary_color)
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
      } else {
        // If no institution color, use default
        document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
        document.documentElement.style.setProperty("--color-primary", DEFAULT_PRIMARY_COLOR)
      }

      // Update favicon if available
      if (institution.favicon_url) {
        console.log("DynamicBranding: Setting institution favicon:", institution.favicon_url)
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

      // Update page title with institution name if available
      if (institution.name) {
        console.log("DynamicBranding: Setting page title to institution name:", institution.name)
        document.title = institution.name
      }
    }

    // Mark that we've applied branding
    hasAppliedBranding.current = true
  }, [institution, isSubdomainAccess, isAdmin, pathname])

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
