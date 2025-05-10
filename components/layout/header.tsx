"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
      </div>
    </header>
  )
}
