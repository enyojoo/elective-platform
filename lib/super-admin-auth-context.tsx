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
          // Check if the user is a super_admin
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()

          if (error) {
            console.error("Error fetching profile:", error)
            setIsAuthenticated(false)
            setSession(null)
          } else if (profile && profile.role === "super_admin") {
            setIsAuthenticated(true)
            setSession(session)
          } else {
            // User is authenticated but not a super_admin
            setIsAuthenticated(false)
            setSession(null)
            // Sign out the user since they're not a super_admin
            await supabase.auth.signOut()
          }
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
        // Check if the user is a super_admin
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (error) {
          console.error("Error fetching profile:", error)
          setIsAuthenticated(false)
          setSession(null)
        } else if (profile && profile.role === "super_admin") {
          setIsAuthenticated(true)
          setSession(session)
        } else {
          // User is authenticated but not a super_admin
          setIsAuthenticated(false)
          setSession(null)
          // Sign out the user since they're not a super_admin
          await supabase.auth.signOut()
        }
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
        // Check if the user is a super_admin
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError)
          await supabase.auth.signOut()
          return { success: false, error: "Error verifying user role" }
        }

        if (profile && profile.role === "super_admin") {
          setIsAuthenticated(true)
          setSession(data.session)
          return { success: true }
        } else {
          // User is authenticated but not a super_admin
          await supabase.auth.signOut()
          return { success: false, error: "You do not have super admin privileges" }
        }
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
