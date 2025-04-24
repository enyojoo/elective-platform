"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Toaster } from "@/components/ui/toaster"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
