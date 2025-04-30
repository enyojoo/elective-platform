"use client"

import type { ReactNode } from "react"
import SuperAdminHeader from "@/components/layout/super-admin-header"
import SuperAdminSidebar from "@/components/layout/super-admin-sidebar"
import { SuperAdminAuthProvider } from "@/lib/super-admin-auth-context"
import { usePathname } from "next/navigation"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/super-admin/login"

  return (
    <SuperAdminAuthProvider>
      {isLoginPage ? (
        children
      ) : (
        <div className="flex min-h-screen flex-col">
          <SuperAdminHeader />
          <div className="flex flex-1">
            <SuperAdminSidebar />
            <main className="flex-1 p-6 md:p-8">{children}</main>
          </div>
        </div>
      )}
    </SuperAdminAuthProvider>
  )
}
