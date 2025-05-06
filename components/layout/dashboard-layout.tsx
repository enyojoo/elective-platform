"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Toaster } from "@/components/ui/toaster"
import { cleanupDialogEffects } from "@/lib/dialog-utils"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Add a safety cleanup effect
  useEffect(() => {
    // Clean up any lingering dialog effects on mount
    cleanupDialogEffects()

    // Set up a periodic check for frozen UI (optional)
    const checkInterval = setInterval(() => {
      // Check if any dialogs are stuck
      const stuckOverlays = document.querySelectorAll("[data-radix-portal]")
      const visibleOverlays = Array.from(stuckOverlays).filter((el) => (el as HTMLElement).style.display !== "none")

      // If there are visible overlays but no open dialogs, clean up
      if (visibleOverlays.length > 0 && !document.querySelector('[data-state="open"]')) {
        cleanupDialogEffects()
      }
    }, 5000) // Check every 5 seconds

    return () => {
      clearInterval(checkInterval)
      cleanupDialogEffects()
    }
  }, [])

  return (
    <div className="flex min-h-screen h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="flex flex-1 flex-col h-full">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
