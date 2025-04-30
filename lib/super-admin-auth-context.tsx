"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

type SuperAdminAuthContextType = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined)

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem("superAdminAuth")
      setIsAuthenticated(authStatus === "true")
      setIsLoading(false)

      // Only redirect if we're not already on the login page
      if (authStatus !== "true" && pathname.startsWith("/super-admin") && pathname !== "/super-admin/login") {
        router.push("/super-admin/login")
      }

      // Redirect if on login page but already authenticated
      if (authStatus === "true" && pathname === "/super-admin/login") {
        router.push("/super-admin/dashboard")
      }
    }

    // Small delay to ensure client-side code runs properly
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Dummy credentials - in a real app, this would be a server-side check
    if (email === "admin@electivepro.com" && password === "admin123") {
      localStorage.setItem("superAdminAuth", "true")
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem("superAdminAuth")
    setIsAuthenticated(false)
    router.push("/super-admin/login")
  }

  // Don't render children until we've checked auth status
  if (isLoading && pathname.startsWith("/super-admin")) {
    return null
  }

  return (
    <SuperAdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
