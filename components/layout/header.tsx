"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  className?: string
  institution?: {
    logo_url?: string
    name?: string
  }
}

export function Header({ sidebarOpen, setSidebarOpen, className, institution }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 flex-shrink-0",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <div className="flex items-center">
          {institution?.logo_url ? (
            <div
              className="institution-logo h-8 w-auto"
              style={{ minWidth: "120px" }}
              aria-label={institution.name || "Institution logo"}
            />
          ) : (
            <div className="institution-logo h-8 w-auto" style={{ minWidth: "120px" }} aria-label="ElectivePRO logo" />
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
      </div>
    </header>
  )
}
