"use client"

import type React from "react"

import { useState } from "react"
import SuperAdminHeader from "@/components/layout/super-admin-header"
import SuperAdminSidebar from "@/components/layout/super-admin-sidebar"
import { SuperAdminAuthProvider } from "@/lib/super-admin-auth-context"

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <SuperAdminAuthProvider>
      <div className="flex min-h-screen flex-col">
        <SuperAdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-1">
          <SuperAdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SuperAdminAuthProvider>
  )
}
