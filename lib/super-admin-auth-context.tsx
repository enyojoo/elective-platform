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
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is already logged in on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("superAdminAuth")
    setIsAuthenticated(authStatus === "true")

    // Redirect if on login page but already authenticated
    if (authStatus === "true" && pathname === "/super-admin/login") {
      router.push("/super-admin/dashboard")
    }

    // Redirect to login if accessing protected route without auth
    if (authStatus !== "true" && pathname.startsWith("/super-admin") && pathname !== "/super-admin/login") {
      router.push("/super-admin/login")
    }
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
