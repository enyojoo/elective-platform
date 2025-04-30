"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuperAdminHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function SuperAdminHeader({ sidebarOpen, setSidebarOpen }: SuperAdminHeaderProps) {
  const pathname = usePathname()

  // Skip rendering header on login page
  if (pathname === "/super-admin/login") {
    return null
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
      <div className="flex items-center gap-4">{/* No language switcher for Super Admin */}</div>
    </header>
  )
}
