"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import SuperAdminSidebar from "@/components/layout/super-admin-sidebar"
import SuperAdminHeader from "@/components/layout/super-admin-header"
import { SuperAdminAuthProvider } from "@/lib/super-admin-auth-context"

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Skip layout on login page
  if (pathname === "/super-admin/login") {
    return <SuperAdminAuthProvider>{children}</SuperAdminAuthProvider>
  }

  return (
    <SuperAdminAuthProvider>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1">
          <SuperAdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <div className="flex flex-1 flex-col">
            <SuperAdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
        </div>
      </div>
    </SuperAdminAuthProvider>
  )
}
