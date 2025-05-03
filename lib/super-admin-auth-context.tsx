"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Session } from "@supabase/supabase-js"

type SuperAdminAuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  session: Session | null
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined)

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // We'll just check if the user is authenticated and set them as authenticated
          // We'll verify their role when they try to access protected resources
          setIsAuthenticated(true)
          setSession(session)
        } else {
          setIsAuthenticated(false)
          setSession(null)
        }

        setIsLoading(false)

        // Only redirect if we're not already on the login page
        if (!isAuthenticated && pathname.startsWith("/super-admin") && pathname !== "/super-admin/login") {
          router.push("/super-admin/login")
        }

        // Redirect if on login page but already authenticated
        if (isAuthenticated && pathname === "/super-admin/login") {
          router.push("/super-admin/dashboard")
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthenticated(false)
        setSession(null)
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setIsAuthenticated(true)
        setSession(session)
      } else {
        setIsAuthenticated(false)
        setSession(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, supabase, isAuthenticated])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.session) {
        // For now, we'll just set the user as authenticated
        // We'll check their role when they try to access protected resources
        setIsAuthenticated(true)
        setSession(data.session)
        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setSession(null)
    router.push("/super-admin/login")
  }

  // Don't render children until we've checked auth status
  if (isLoading && pathname.startsWith("/super-admin")) {
    return null
  }

  return (
    <SuperAdminAuthContext.Provider value={{ isAuthenticated, login, logout, session }}>
      {children}
    </SuperAdminAuthContext.Provider>
  )
}

export function useSuperAdminAuth() {
  const context = useContext(SuperAdminAuthContext)
  if (context === undefined) {
    throw new Error("useSuperAdminAuth must be used within a SuperAdminAuthProvider")
  }
  return context
}
