"use client"

import { type ReactNode, createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { usePathname } from "next/navigation"

// Updated default logo URL
export const DEFAULT_LOGO_URL = "https://pbqvvvdhssghkpvsluvw.supabase.co/storage/v1/object/public/logos//epro_logo.svg"
// Updated default favicon URL
export const DEFAULT_FAVICON_URL =
  "https://pbqvvvdhssghkpvsluvw.supabase.co/storage/v1/object/public/favicons//epro_favicon.svg"
// Default primary color
export const DEFAULT_PRIMARY_COLOR = "#027659"

export interface Institution {
  id: string
  name: string
  subdomain: string
  logo_url?: string
  favicon_url?: string
  primary_color?: string
  is_active: boolean
}

interface InstitutionContextType {
  institution: Institution | null
  setInstitution: (institution: Institution | null) => void
  updateInstitution: (data: Partial<Institution>) => Promise<void>
  isLoading: boolean
  isSubdomainAccess: boolean
  error: string | null
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined)

interface InstitutionProviderProps {
  children: ReactNode
  initialInstitution?: Institution | null
}

export function InstitutionProvider({ children, initialInstitution = null }: InstitutionProviderProps) {
  const [institution, setInstitution] = useState<Institution | null>(initialInstitution)
  const [isLoading, setIsLoading] = useState(!initialInstitution)
  const [error, setError] = useState<string | null>(null)
  const [isSubdomainAccess, setIsSubdomainAccess] = useState(false)
  const pathname = usePathname()

  // Determine if we're in the admin section
  const isAdmin = pathname?.includes("/admin") || false

  const updateInstitution = async (data: Partial<Institution>) => {
    if (!institution?.id) {
      throw new Error("No institution found")
    }

    const { error } = await supabase.from("institutions").update(data).eq("id", institution.id)

    if (error) {
      throw error
    }

    // Update the local state
    setInstitution({
      ...institution,
      ...data,
    })

    // Only apply the institution color if we're not in admin section
    if (data.primary_color && !isAdmin) {
      document.documentElement.style.setProperty("--primary", data.primary_color)
      document.documentElement.style.setProperty("--color-primary", data.primary_color)

      // Set RGB values for components that need them
      const primaryRgb = hexToRgb(data.primary_color)
      if (primaryRgb) {
        document.documentElement.style.setProperty("--primary-rgb", `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`)
      }
    }

    // Only update favicon if we're not in admin section and a new favicon is provided
    if (data.favicon_url && !isAdmin) {
      const existingFavicon = document.querySelector("link[rel='icon']")
      if (existingFavicon) {
        existingFavicon.setAttribute("href", data.favicon_url)
      }

      const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
      if (existingAppleIcon) {
        existingAppleIcon.setAttribute("href", data.favicon_url)
      }
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

  useEffect(() => {
    async function loadInstitution() {
      try {
        // If we already have an institution from props, use it
        if (initialInstitution) {
          console.log("Context: Using initial institution:", initialInstitution.name)
          setInstitution(initialInstitution)

          // Only apply the institution color and favicon if we're not in admin section
          if (!isAdmin) {
            if (initialInstitution.primary_color) {
              // Check if the color is already applied from server-side rendering
              const currentColor = document.documentElement.style.getPropertyValue("--primary")
              if (!currentColor || currentColor !== initialInstitution.primary_color) {
                console.log(
                  "Context: Setting primary color from initial institution:",
                  initialInstitution.primary_color,
                )
                document.documentElement.style.setProperty("--primary", initialInstitution.primary_color)
                document.documentElement.style.setProperty("--color-primary", initialInstitution.primary_color)

                // Set RGB values for components that need them
                const primaryRgb = hexToRgb(initialInstitution.primary_color)
                if (primaryRgb) {
                  document.documentElement.style.setProperty(
                    "--primary-rgb",
                    `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
                  )
                }
              }
            }

            // Similar check for favicon
            if (initialInstitution.favicon_url) {
              const existingFavicon = document.querySelector("link[rel='icon']")
              if (existingFavicon && existingFavicon.getAttribute("href") !== initialInstitution.favicon_url) {
                console.log("Context: Setting favicon from initial institution:", initialInstitution.favicon_url)
                existingFavicon.setAttribute("href", initialInstitution.favicon_url)

                const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
                if (existingAppleIcon) {
                  existingAppleIcon.setAttribute("href", initialInstitution.favicon_url)
                }
              }
            }
          } else {
            // For admin, always use default color and favicon
            console.log("Context: Using default color and favicon for admin section")
            document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
            document.documentElement.style.setProperty("--color-primary", DEFAULT_PRIMARY_COLOR)

            const existingFavicon = document.querySelector("link[rel='icon']")
            if (existingFavicon) {
              existingFavicon.setAttribute("href", DEFAULT_FAVICON_URL)
            }

            const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
            if (existingAppleIcon) {
              existingAppleIcon.setAttribute("href", DEFAULT_FAVICON_URL)
            }
          }

          setIsLoading(false)
          return
        }

        const hostname = window.location.hostname
        const isSubdomain =
          hostname.includes(".electivepro.net") && !hostname.startsWith("www") && !hostname.startsWith("app")

        setIsSubdomainAccess(isSubdomain)
        console.log("Context: Checking for subdomain access:", { hostname, isSubdomain })

        if (isSubdomain) {
          const subdomain = hostname.split(".")[0]
          console.log("Context: Detected subdomain:", subdomain)

          // Simple direct query - no RPC functions
          const { data, error } = await supabase
            .from("institutions")
            .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
            .eq("subdomain", subdomain)
            .eq("is_active", true)
            .single()

          console.log("Context: Institution query result:", { data, error })

          if (error) {
            console.error("Context: Institution not found:", error)
            setError("Institution not found")
          } else if (data) {
            console.log("Context: Found institution:", data.name)
            setInstitution(data)

            // Only apply the institution color and favicon if we're not in admin section
            if (!isAdmin) {
              if (data.primary_color) {
                console.log("Context: Setting primary color from subdomain institution:", data.primary_color)
                document.documentElement.style.setProperty("--primary", data.primary_color)
                document.documentElement.style.setProperty("--color-primary", data.primary_color)

                // Set RGB values for components that need them
                const primaryRgb = hexToRgb(data.primary_color)
                if (primaryRgb) {
                  document.documentElement.style.setProperty(
                    "--primary-rgb",
                    `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
                  )
                }
              }

              // Set institution favicon if available
              if (data.favicon_url) {
                console.log("Context: Setting favicon from subdomain institution:", data.favicon_url)
                const existingFavicon = document.querySelector("link[rel='icon']")
                if (existingFavicon) {
                  existingFavicon.setAttribute("href", data.favicon_url)
                }

                const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
                if (existingAppleIcon) {
                  existingAppleIcon.setAttribute("href", data.favicon_url)
                }
              }
            } else {
              // For admin, always use default color and favicon
              console.log("Context: Using default color and favicon for admin section")
              document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
              document.documentElement.style.setProperty("--color-primary", DEFAULT_PRIMARY_COLOR)

              const existingFavicon = document.querySelector("link[rel='icon']")
              if (existingFavicon) {
                existingFavicon.setAttribute("href", DEFAULT_FAVICON_URL)
              }

              const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
              if (existingAppleIcon) {
                existingAppleIcon.setAttribute("href", DEFAULT_FAVICON_URL)
              }
            }
          }
        } else {
          // If not accessing via subdomain, try to get institution from auth session
          console.log("Context: Not a subdomain access, checking auth session")
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            console.log("Context: User is authenticated, fetching profile")
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("institution_id")
              .eq("id", session.user.id)
              .single()

            if (profileError) {
              console.error("Context: Error fetching profile:", profileError)
            } else if (profileData?.institution_id) {
              console.log("Context: Found institution ID in profile:", profileData.institution_id)

              const { data: institutionData, error: institutionError } = await supabase
                .from("institutions")
                .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
                .eq("id", profileData.institution_id)
                .single()

              if (institutionError) {
                console.error("Context: Error fetching institution:", institutionError)
              } else {
                console.log("Context: Found institution from profile:", institutionData.name)
                setInstitution(institutionData)

                // Only apply the institution color and favicon if we're not in admin section
                if (!isAdmin) {
                  if (institutionData.primary_color) {
                    console.log(
                      "Context: Setting primary color from profile institution:",
                      institutionData.primary_color,
                    )
                    document.documentElement.style.setProperty("--primary", institutionData.primary_color)
                    document.documentElement.style.setProperty("--color-primary", institutionData.primary_color)

                    // Set RGB values for components that need them
                    const primaryRgb = hexToRgb(institutionData.primary_color)
                    if (primaryRgb) {
                      document.documentElement.style.setProperty(
                        "--primary-rgb",
                        `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
                      )
                    }
                  }

                  // Set institution favicon if available
                  if (institutionData.favicon_url) {
                    console.log("Context: Setting favicon from profile institution:", institutionData.favicon_url)
                    const existingFavicon = document.querySelector("link[rel='icon']")
                    if (existingFavicon) {
                      existingFavicon.setAttribute("href", institutionData.favicon_url)
                    }

                    const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
                    if (existingAppleIcon) {
                      existingAppleIcon.setAttribute("href", institutionData.favicon_url)
                    }
                  }
                } else {
                  // For admin, always use default color and favicon
                  console.log("Context: Using default color and favicon for admin section")
                  document.documentElement.style.setProperty("--primary", DEFAULT_PRIMARY_COLOR)
                  document.documentElement.style.setProperty("--color-primary", DEFAULT_PRIMARY_COLOR)

                  const existingFavicon = document.querySelector("link[rel='icon']")
                  if (existingFavicon) {
                    existingFavicon.setAttribute("href", DEFAULT_FAVICON_URL)
                  }

                  const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
                  if (existingAppleIcon) {
                    existingAppleIcon.setAttribute("href", DEFAULT_FAVICON_URL)
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Context: Error loading institution:", err)
        setError("Failed to load institution")
      } finally {
        setIsLoading(false)
      }
    }

    loadInstitution()
  }, [initialInstitution, isAdmin])

  return (
    <InstitutionContext.Provider
      value={{ institution, setInstitution, updateInstitution, isLoading, isSubdomainAccess, error }}
    >
      {children}
    </InstitutionContext.Provider>
  )
}

export function useInstitution() {
  const context = useContext(InstitutionContext)
  if (context === undefined) {
    throw new Error("useInstitution must be used within an InstitutionProvider")
  }
  return context
}

export const useInstitutionContext = useInstitution
