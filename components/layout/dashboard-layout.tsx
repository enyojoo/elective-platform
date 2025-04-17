"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import type { UserRole } from "@/lib/types"
import { Toaster } from "@/components/ui/toaster"

interface DashboardLayoutProps {
  children: ReactNode
  userRole: UserRole
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header userRole={userRole} />
      <div className="flex flex-1">
        <Sidebar userRole={userRole} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
