"use client"

import { useState, useEffect, memo } from "react"
import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Toaster } from "@/components/ui/toaster"
import { cleanupDialogEffects } from "@/lib/dialog-utils"

interface DashboardLayoutProps {
  children: ReactNode
}

// Use memo to prevent unnecessary re-renders of the layout
export const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} className="h-screen flex-shrink-0 fixed md:relative z-20" />
      <div className="flex flex-col flex-1 h-screen w-full md:w-[calc(100%-16rem)]">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} className="sticky top-0 z-10" />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  )
})
