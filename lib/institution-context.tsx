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
  const [isSubdomainAccess, setIsSubdomainAccess] = useState(true) // Default to true to prevent unnecessary redirects
  const pathname = usePathname()

  // Determine if we're in the admin section
  const isAdmin = pathname?.includes("/admin") || false

  const updateInstitution = async (data: Partial<Institution>) => {
    if (!institution?.id) {
      throw new Error("No institution found")
    }

    try {
      const { error: updateError } = await supabase.from("institutions").update(data).eq("id", institution.id)

      if (updateError) {
        console.error("Error updating institution:", updateError)
        throw updateError
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
          document.documentElement.style.setProperty(
            "--primary-rgb",
            `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
          )
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
    } catch (err) {
      console.error("Failed to update institution:", err)
      throw err
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

  // Check if we're on a subdomain
  useEffect(() => {
    const detectSubdomain = () => {
      try {
        if (typeof window === "undefined") {
          return // Skip on server-side
        }

        // Check if we're in development mode
        const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"

        if (isDevelopment) {
          // In development, check for subdomain query parameter
          const url = new URL(window.location.href)
          const subdomain = url.searchParams.get("subdomain")

          // If we have a subdomain parameter, we're on a subdomain
          setIsSubdomainAccess(!!subdomain)
          console.log(
            `Context: Development mode, subdomain from query: ${subdomain}, isSubdomainAccess: ${!!subdomain}`,
          )
          return
        }

        // In production, check the hostname
        const hostname = window.location.hostname
        const isSubdomain =
          hostname.includes(".electivepro.net") &&
          !hostname.startsWith("www.") &&
          !hostname.startsWith("app.") &&
          !hostname.startsWith("api.")

        setIsSubdomainAccess(isSubdomain)
        console.log(`Context: Production mode, hostname: ${hostname}, isSubdomainAccess: ${isSubdomain}`)
      } catch (err) {
        console.error("Error detecting subdomain:", err)
        // Default to true to prevent unnecessary redirects
        setIsSubdomainAccess(true)
      }
    }

    detectSubdomain()
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadInstitution() {
      // Skip if we're on the server side
      if (typeof window === "undefined") {
        return
      }

      try {
        // If we already have an institution from props, use it
        if (initialInstitution) {
          console.log("Context: Using initial institution:", initialInstitution.name)
          if (isMounted) {
            setInstitution(initialInstitution)
          }

          // Only apply the institution color and favicon if we're not in admin section
          if (!isAdmin) {
            if (initialInstitution.primary_color) {
              console.log("Context: Setting primary color from initial institution:", initialInstitution.primary_color)
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

            // Set institution favicon if available
            if (initialInstitution.favicon_url) {
              console.log("Context: Setting favicon from initial institution:", initialInstitution.favicon_url)
              const existingFavicon = document.querySelector("link[rel='icon']")
              if (existingFavicon) {
                existingFavicon.setAttribute("href", initialInstitution.favicon_url)
              }

              const existingAppleIcon = document.querySelector("link[rel='apple-touch-icon']")
              if (existingAppleIcon) {
                existingAppleIcon.setAttribute("href", initialInstitution.favicon_url)
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

          if (isMounted) {
            setIsLoading(false)
          }
          return
        }

        // Check if we're on a subdomain
        if (isSubdomainAccess) {
          // Get the subdomain
          let subdomain

          // Check if we're in development mode
          const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"

          if (isDevelopment) {
            // In development, get subdomain from query parameter
            const url = new URL(window.location.href)
            subdomain = url.searchParams.get("subdomain")
          } else {
            // In production, extract subdomain from hostname
            const hostname = window.location.hostname
            subdomain = hostname.split(".")[0]
          }

          console.log("Context: Detected subdomain:", subdomain)

          if (subdomain) {
            try {
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
                if (isMounted) {
                  setError(`Institution not found: ${error.message}`)
                }

                // Continue with default values to prevent breaking the app
                if (!isAdmin) {
                  // Set default values for non-admin pages
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
              } else if (data) {
                console.log("Context: Found institution:", data.name)
                if (isMounted) {
                  setInstitution(data)
                }

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
            } catch (fetchError) {
              console.error("Context: Error fetching institution:", fetchError)
              if (isMounted) {
                setError(`Failed to fetch institution: ${fetchError.message}`)
              }

              // Set default values to prevent breaking the app
              if (!isAdmin) {
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
        } else {
          // If not accessing via subdomain, try to get institution from auth session
          console.log("Context: Not a subdomain access, checking auth session")
          try {
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession()

            if (sessionError) {
              console.error("Context: Error getting session:", sessionError)
              if (isMounted) {
                setError(`Failed to get session: ${sessionError.message}`)
              }
              return
            }

            if (session?.user) {
              console.log("Context: User is authenticated, fetching profile")
              try {
                const { data: profileData, error: profileError } = await supabase
                  .from("profiles")
                  .select("institution_id")
                  .eq("id", session.user.id)
                  .single()

                if (profileError) {
                  console.error("Context: Error fetching profile:", profileError)
                  if (isMounted) {
                    setError(`Failed to fetch profile: ${profileError.message}`)
                  }
                  return
                }

                if (profileData?.institution_id) {
                  console.log("Context: Found institution ID in profile:", profileData.institution_id)

                  try {
                    const { data: institutionData, error: institutionError } = await supabase
                      .from("institutions")
                      .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
                      .eq("id", profileData.institution_id)
                      .single()

                    if (institutionError) {
                      console.error("Context: Error fetching institution:", institutionError)
                      if (isMounted) {
                        setError(`Failed to fetch institution: ${institutionError.message}`)
                      }
                      return
                    }

                    if (institutionData) {
                      console.log("Context: Found institution from profile:", institutionData.name)
                      if (isMounted) {
                        setInstitution(institutionData)
                      }

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
                  } catch (institutionFetchError) {
                    console.error("Context: Error fetching institution:", institutionFetchError)
                    if (isMounted) {
                      setError(`Failed to fetch institution: ${institutionFetchError.message}`)
                    }
                  }
                }
              } catch (profileFetchError) {
                console.error("Context: Error fetching profile:", profileFetchError)
                if (isMounted) {
                  setError(`Failed to fetch profile: ${profileFetchError.message}`)
                }
              }
            }
          } catch (sessionFetchError) {
            console.error("Context: Error getting session:", sessionFetchError)
            if (isMounted) {
              setError(`Failed to get session: ${sessionFetchError.message}`)
            }
          }
        }
      } catch (err) {
        console.error("Context: Error loading institution:", err)
        if (isMounted) {
          setError(`Failed to load institution: ${err.message}`)
        }

        // Set default values to prevent breaking the app
        if (!isAdmin) {
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
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInstitution()

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [initialInstitution, isAdmin, isSubdomainAccess])

  // Add a retry mechanism for failed institution fetches
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3
    let retryTimeout: NodeJS.Timeout | null = null

    const retryFetch = async () => {
      if (error && error.includes("Failed to fetch") && retryCount < maxRetries) {
        retryCount++
        console.log(`Context: Retrying institution fetch (${retryCount}/${maxRetries})...`)

        try {
          setError(null)
          setIsLoading(true)

          // Get the subdomain
          let subdomain

          if (typeof window !== "undefined") {
            // Check if we're in development mode
            const isDevelopment = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"

            if (isDevelopment) {
              // In development, get subdomain from query parameter
              const url = new URL(window.location.href)
              subdomain = url.searchParams.get("subdomain")
            } else {
              // In production, extract subdomain from hostname
              const hostname = window.location.hostname
              subdomain = hostname.split(".")[0]
            }

            if (subdomain) {
              const { data, error: fetchError } = await supabase
                .from("institutions")
                .select("id, name, subdomain, logo_url, primary_color, is_active, favicon_url")
                .eq("subdomain", subdomain)
                .eq("is_active", true)
                .single()

              if (fetchError) {
                throw fetchError
              }

              if (data) {
                setInstitution(data)
                setError(null)

                // Apply institution styling
                if (!isAdmin && data.primary_color) {
                  document.documentElement.style.setProperty("--primary", data.primary_color)
                  document.documentElement.style.setProperty("--color-primary", data.primary_color)

                  const primaryRgb = hexToRgb(data.primary_color)
                  if (primaryRgb) {
                    document.documentElement.style.setProperty(
                      "--primary-rgb",
                      `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
                    )
                  }
                }
              }
            }
          }
        } catch (retryError) {
          console.error(`Context: Retry ${retryCount} failed:`, retryError)
          setError(`Failed to fetch institution (retry ${retryCount}/${maxRetries}): ${retryError.message}`)

          // Schedule another retry with exponential backoff
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000)
          retryTimeout = setTimeout(retryFetch, backoffTime)
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (error && error.includes("Failed to fetch")) {
      retryTimeout = setTimeout(retryFetch, 1000)
    }

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [error, isAdmin])

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
